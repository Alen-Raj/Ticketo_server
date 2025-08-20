const User = require("../../model/userSchema");
const Show = require('../../model/showSchema');
const Screen = require('../../model/screenSchema');
const Movie = require('../../model/movieSchema');
const Theater = require('../../model/theatreSchema');
const Booking=require("../../model/bookingSchema")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const TheatreLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const theatreOwner = await User.findOne({ email, role: "theatre_owner" });

    if (!theatreOwner) {
      return res.status(400).json({ success: false, message: "Theatre Owner not found!" });
    }

    const isMatch = await bcrypt.compare(password, theatreOwner.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid Password" });
    }

    const secretKey = process.env.MY_SECRET_KEY;
    const token = jwt.sign(
      { _id: theatreOwner._id, role: theatreOwner.role, email: theatreOwner.email },
      secretKey,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Theatre Owner Login Successful",
      token,
      role: theatreOwner.role,
    });
  } catch (error) {
    console.error("Theatre Login Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const addTheater = async (req, res) => {
  try {
    const {
      name,
      address,
      contact,
      description
    } = req.body;

    const newTheater = new Theater({
      name,
      address,
      contact,
      description,
      owner: req.user._id
    });

    const existingEmail = await Theater.findOne({ "contact.email": contact.email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "A theatre with this email already exists!"
      });
    }

    const existingPhone = await Theater.findOne({ "contact.phone": contact.phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "A theatre with this phone number already exists!"
      });
    }

    await newTheater.save();

    res.status(201).json({
      success: true,
      message: "Theater added successfully",
      data: newTheater
    });
  } catch (error) {
    console.error("Add Theater Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

const getOwnerTheatres = async (req, res) => {
  try {
    const ownerId = req.user._id;
    console.log("Owner ID from token:", ownerId);

    const theatres = await Theater.find({ owner: ownerId });
    console.log("Fetched Theatres:", theatres);

    res.status(200).json({
      success: true,
      data: theatres
    });
  } catch (error) {
    console.error("Fetch Owner Theatres Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

const deleteTheatre = async (req, res) => {
  try {
    const theatreId = req.params.id;
    const theatre = await Theater.findByIdAndDelete(theatreId);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Theatre deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting theatre",
    });
  }
};

const updateTheatre = async (req, res) => {
  try {
    const theatreId = req.params.id;
    const updateData = req.body;

    const theatre = await Theater.findById(theatreId);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    if (theatre.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const updatedTheatre = await Theater.findByIdAndUpdate(theatreId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Theatre updated successfully",
      data: updatedTheatre,
    });

  } catch (error) {
    console.error("Update Theatre Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating theatre",
    });
  }
};

const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user._id; 

    const theatres = await Theater.find({ owner: ownerId }).populate("screens");

    let totalRevenue = 0;
    let theatreData = [];

    for (const theatre of theatres) {
      let theatreRevenue = 0;
      let totalBookingsForTheatre = 0;
      let screensData = [];

      for (const screen of theatre.screens) {
        const bookings = await Booking.find({
          screen: screen._id,
          status: "booked"
        });

        const screenBookingCount = bookings.length;
        const screenRevenue = bookings.reduce(
          (sum, b) => sum + (b.payment.amount || 0),
          0
        );

        // Convert from paise to rupees
        theatreRevenue += screenRevenue / 100;
        totalBookingsForTheatre += screenBookingCount;

        screensData.push({
          screenName: screen.screenName,
          bookings: screenBookingCount,
          revenue: screenRevenue / 100  // Convert to rupees
        });
      }

      totalRevenue += theatreRevenue;

      theatreData.push({
        theatreName: theatre.name,
        totalBookings: totalBookingsForTheatre,
        revenue: theatreRevenue,  // Already in rupees
        screens: screensData
      });
    }

    res.json({
      totalTheatres: theatres.length,
      totalRevenue,  // Already in rupees
      theatres: theatreData
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  TheatreLogin,
  addTheater,
  getOwnerTheatres,
  deleteTheatre,
  updateTheatre,
  getOwnerDashboard
};
