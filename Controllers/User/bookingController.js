const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../../model/bookingSchema");
const Show = require("../../model/showSchema");
const nodemailer = require("nodemailer");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const getScreenInfo = async (req, res) => {
  try {
    const { date, time } = req.query;

    const show = await Show.findById(req.params.showId)
      .populate("movie")
      .populate("theatre")
      .populate("screen");

    if (!show) return res.status(404).json({ message: "Show not found" });

    const query = {
      show: req.params.showId,
      status: { $in: ["booked", "blocked", "cancelled"] },
    };

    // If date & time are passed, filter by them
    if (date) {
      query.showDate = normalizeDate(date);
    }
    if (time) {
      query.showTime = time;
    }

    const bookings = await Booking.find(query);

    // Extract booked/blocked/cancelled seats
    const bookedSeats = bookings.flatMap((b) =>
      b.seats
        .filter((s) => ["booked", "blocked", "cancelled"].includes(s.status))
        .map((s) => ({
          section: s.section || b.section,
          row: s.row,
          seatNumber: s.seatNumber,
          status: s.status,
        }))
    );

    res.json({
      movie: show.movie,
      theatreName: show.theatre.name,
      screenName: show.screen.screenName,
      sections: show.screen.sections,
      bookedSeats, // ✅ added so normal users can see status
    });
  } catch (err) {
    console.error("getScreenInfo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const getScreenBookingInfo = async (req, res) => {
  try {
    const { date, time } = req.query;
    const show = await Show.findById(req.params.showId)
      .populate("movie")
      .populate("theatre")
      .populate("screen");
    if (!show) return res.status(404).json({ message: "Show not found" });

    const showDate = date ? normalizeDate(date) : null;

    const query = {
      show: req.params.showId,
      status: { $in: ["booked", "blocked", "cancelled"] },
    };
    
    // Add both date and time to the query
    if (showDate) {
      query.showDate = showDate;
      query.showTime = time; // Add this line to filter by time
    }

    const bookings = await Booking.find(query);

    const bookedSeats = bookings.flatMap((b) =>
      b.seats
        .filter((s) => ["booked", "blocked", "cancelled"].includes(s.status))
        .map((s) => ({
          section: s.section || b.section,
          row: s.row,
          seatNumber: s.seatNumber,
          status: s.status,
        }))
    );  

    res.json({
      movie: show.movie,
      theatreName: show.theatre.name,
      screenName: show.screen.screenName,
      sections: show.screen.sections,
      bookedSeats,
    });
  } catch (err) {
    console.error("getScreenInfo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create order & block seats
const createOrder = async (req, res) => {
  try {
    const { showId, date, time, seats, totalPrice, customer } = req.body;

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "No seats selected" });
    }

    const showDate = normalizeDate(date);

    // ✅ Get userId FIRST
    const userId = req.userId || req.user?.userId || null;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    // Check for conflicts
    const existing = await Booking.findOne({
      show: showId,
      showDate,
      seats: {
        $elemMatch: {
          $or: seats.map((s) => ({ 
            row: s.row, 
            seatNumber: s.seatNumber,
            status: { $in: ["booked", "blocked"] }
          }))
        },
      },
      status: { $in: ["booked", "blocked"] },
    });

    // Check if it's blocked by someone else
    if (existing) {
      const blockedByAnotherUser = existing.seats.some(
        seat => seat.status === "blocked" && seat.blockedBy.toString() !== userId.toString()
      );
      if (blockedByAnotherUser) {
        return res.status(400).json({ message: "Some seats are already taken." });
      }
    }

    const showDoc = await Show.findById(showId).populate("movie theatre screen");
    if (!showDoc) return res.status(404).json({ message: "Show not found" });

    // Map seats to include status 'blocked' on each seat
    const seatsWithStatus = seats.map((s) => ({
      row: s.row,
      seatNumber: s.seatNumber,
      section: s.section || "default",
      status: "blocked",
      blockedBy: userId 
    }));

    // Create booking with seats having status 'blocked'
    const booking = await Booking.create({
      user: userId,
      show: showId,
      theatre: showDoc.theatre,
      screen: showDoc.screen,
      movie: showDoc.movie,
      section: seatsWithStatus[0].section || "default",
      seats: seatsWithStatus,
      seatCount: seats.length,
      status: "blocked",
      customer,
      showDate,
      showTime: time, 
    });

    // Auto-expire after 5 minutes
    setTimeout(async () => {
      try {
        const b = await Booking.findById(booking._id);
        if (b && b.status === "blocked") {
          b.status = "expired";
          b.seats.forEach((seat) => (seat.status = "cancelled"));
          await b.save();
        }
      } catch (err) {
        console.error("Error expiring booking:", err);
      }
    }, 5 * 60 * 1000);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      receipt: booking._id.toString(),
    });

    booking.payment.orderId = order.id;
    booking.payment.amount = Math.round(totalPrice * 100);
    booking.payment.status = "pending";
    await booking.save();

    res.json({
      order,
      bookingId: booking._id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    res.status(500).json({ message: "Payment order creation failed", error: error.message });
  }
};


const verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const booking = await Booking.findById(bookingId).populate("movie theatre screen");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
  booking.status = "blocked";  // keep it blocked
  booking.payment.status = "failed";

  // Ensure seats are still blocked by that user
  booking.seats.forEach((seat) => {
    seat.status = "blocked";
    seat.blockedBy = booking.user; // 👈 same user can retry
  });

  await booking.save();
  return res.status(400).json({ message: "Invalid payment signature" });
}


    booking.status = "booked";
    booking.seats.forEach((seat) => {
      seat.status = "booked";
    });

    booking.payment.paymentId = razorpay_payment_id;
    booking.payment.status = "success";
    booking.payment.paidAt = new Date();
    await booking.save();

    sendBookingEmail(booking).catch((err) => console.error("sendBookingEmail error:", err));

    res.json({ message: "Payment successful & booking confirmed" });
  } catch (err) {
    console.error("verifyPayment error:", err);
    res.status(500).json({ message: "Payment verification failed", error: err.message });
  }
};

// Email with show time & poster
const sendBookingEmail = async (booking) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const seatList = booking.seats.map((s) => `${booking.section} ${s.row}${s.seatNumber}`).join(", ");

  const mailOptions = {
    from: `"Ticketo" <${process.env.EMAIL_USER}>`,
    to: booking.customer.email,
    subject: "Your Movie Tickets",
    html: `
      <h2>🎬 Booking Confirmed</h2>
      <img src="${process.env.BASE_URL || "http://localhost:3002"}${booking.movie.poster}" alt="Movie Poster" width="120" height="180" style="border-radius:8px; margin-bottom:10px;" />
      <p><strong>Movie:</strong> ${booking.movie.title}</p>
      <p><strong>Theatre:</strong> ${booking.theatre.name}</p>
      <p><strong>Screen:</strong> ${booking.screen.screenName}</p>
      <p><strong>Seats:</strong> ${seatList}</p>
      <p><strong>Date:</strong> ${booking.showDate.toDateString()}</p>
      <p><strong>Time:</strong> ${booking.showTime}</p>
      <p><strong>Status:</strong> Confirmed</p>
      <br/>
      <p>Enjoy your show! 🍿</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate("movie theatre screen");

    res.json(bookings);
  } catch (err) {
    console.error("Fetch user bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  getScreenBookingInfo,
  createOrder,
  verifyPayment,
  myBookings,
  getScreenInfo
};
