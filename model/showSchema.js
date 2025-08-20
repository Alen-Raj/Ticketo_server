const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
  theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },

  // Per-day time slots
  schedule: {
    type: Map,
    of: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every(v =>
            /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(v)
          );
        },
        message: props => `${props.value} contains invalid time format(s)`
      }
    },
    required: true
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);
