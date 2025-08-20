const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema({
  screenName: { type: String, required: true },
  theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
  totalSeats: { type: Number, default: 0 },

  sections: [
    {
      name: { type: String, required: true }, 
      price: { type: Number, required: true },

      seatMap: [
        {
          row: { type: String, required: true }, 
          layout: [
            {
              count: { type: Number, required: true }, 
              type: {
                type: String,
                enum: ['seat', 'gap'],
                default: 'seat'
              } 
            }
          ]
        }
      ]
    }
  ],

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Screen', screenSchema);
  