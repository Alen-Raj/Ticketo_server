const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
  },
  googleId: {
    type: String
  },
  profilePic: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },
  dob: {
    type: Date
  },
  address: {
    pincode: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String }
  },
  role: {
    type: String,
    enum: ["user", "admin", "theatre_owner"],
    default: "user"
  },
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
