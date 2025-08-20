const User = require("../../model/userSchema");
const Theatre = require("../../model/theatreSchema");
const Screen = require("../../model/screenSchema");
const Show = require("../../model/showSchema");
const Booking = require("../../model/bookingSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      return res.status(400).json({ success: false, message: "Admin not found!" });
    }

    const pswMatch = await bcrypt.compare(password, admin.password);
    if (!pswMatch) {
      return res.status(400).json({ success: false, message: "Invalid Password" });
    }

    const secretKey = process.env.MY_SECRET_KEY;
    const Token = jwt.sign(
      {
        userId: admin._id,
        email: admin.email,
        role: admin.role
      },
      secretKey,
      { expiresIn: "1d" }
    );

    return res.status(200).json({ success: true, message: "Admin Login Successful", Token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    // counts
    const [totalUsers, totalTheatres, totalScreens, totalShows] = await Promise.all([
      User.countDocuments({}),                          
      Theatre.countDocuments({}),                       
      Screen.countDocuments({}),                          
      Show.countDocuments({ isActive: true }),            
    ]);

    // bookings & revenue
    const totalBookings = await Booking.countDocuments({
      status: "booked",
      "payment.status": "success",
    });

    const revenueAgg = await Booking.aggregate([
      { $match: { status: "booked", "payment.status": "success" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$payment.amount", 0] } }, 
        },
      },
    ]);

    const totalRevenue = revenueAgg.length ? revenueAgg[0].total : 0;

    return res.json({
      totalUsers,
      totalTheatres,
      totalScreens,
      totalShows,
      totalBookings,
      totalRevenue,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  Login,
  getAdminDashboard
};
