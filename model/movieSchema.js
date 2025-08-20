const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  director: { 
    type: String, 
    required: true 
  },
  genre: { 
    type: [String], 
    required: true 
  },
  releaseDate: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: String, 
    required: true 
  },
  language: { 
    type: [String], 
    required: true 
  },
  poster: { 
    type: String, 
    required: true 
  },
  banner: { 
    type: String,
    required: true
  },
  casts: [{
    name: { 
      type: String, 
      required: true 
    },
    image: { 
      type: String, 
      required: true 
    }
  }],
  rating: { 
    type: Number, 
    min: 0, 
    max: 10, 
    default: 0 
  },
  trailerLink: { 
    type: String 
  },
  interest:{
    type:Number
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true  
});



module.exports = mongoose.model('Movie', movieSchema);
