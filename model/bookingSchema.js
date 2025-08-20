const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
  screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true }, 

  section: { type: String, required: true },
  seats: [
  {
    row: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['booked', 'blocked', 'cancelled'], 
      default: 'blocked' 
    },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // 👈 Add this
  }
],


  seatCount: { type: Number, required: true },

  status: {
    type: String,
    enum: ['blocked', 'booked', 'cancelled', 'expired'],
    default: 'blocked'
  },
  blockedAt: { type: Date, default: Date.now },

  payment: {
    paymentId: { type: String }, 
    orderId: { type: String },  
    method: { type: String },  
    amount: { type: Number }, 
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    paidAt: { type: Date }
  },

  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },

  showDate: { type: Date, required: true },
  showTime: { type: String, required: true }, 

  bookingDate: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
