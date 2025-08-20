const mongoose = require("mongoose");

const theatreSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pincode: { type: String, required: true }
  },

  contact: {
    phone: { type: String, required: true },
    email: { type: String, required:true }
  },

  description: { type: String,required:true },

  screens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Screen' }],


  isActive: { type: Boolean, default: false } 
}, { timestamps: true });

module.exports = mongoose.model('Theatre', theatreSchema);
