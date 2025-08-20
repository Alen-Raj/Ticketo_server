const Movie = require('../../model/movieSchema');
const { findByIdAndUpdate } = require('../../model/userSchema');
const fs = require("fs")
const path = require("path")


const AddMovie = async (req, res) => {
  try {
    const { 
      title, description, director, genre, releaseDate, duration, 
      language, trailerLink, rating, castNames 
    } = req.body;

    const poster = req.files['poster'] 
      ? `/uploads/posters/${req.files['poster'][0].filename}` 
      : null;

    const banner = req.files['banner'] 
      ? `/uploads/banners/${req.files['banner'][0].filename}` 
      : null;

    const castImages = req.files['casts'] || [];

    if (!poster || !banner || !castNames || !castImages.length) {
      return res.status(400).json({ message: 'Poster, banner, and casts are required' });
    }

    const castNamesArray = Array.isArray(castNames) ? castNames : [castNames];
    const casts = castNamesArray.map((name, index) => ({
      name,
      image: `/uploads/casts/${castImages[index]?.filename}`,
    }));

   

    const movie = new Movie({
      title,
      description,
      director,
      genre: genre ? genre.split(',').map(g => g.trim()) : [],
      releaseDate,
      duration,  
      language,
      poster,
      banner,
      trailerLink,
      rating: rating || 0,
      casts,
    });

    await movie.save();

    res.status(201).json({ success: true, message: 'Movie added successfully', movie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding movie' });
  }
};


const GetMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
};

const BlockMovie = async (req, res) => {
  try {
    const movieId = req.params.id;
    const { isActive } = req.body;

    const updatedMovie = await Movie.findByIdAndUpdate(
      movieId,
      { isActive },
      { new: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    res.status(200).json({ success: true, message: 'Movie updated successfully', movie: updatedMovie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating movie status' });
  }
};

const DeleteMovie = async (req, res) => {
  try {
    const movieId = req.params.id;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    if (movie.poster) {
      const posterPath = path.join(__dirname, '..', '..','public', movie.poster.startsWith('/') ? movie.poster.slice(1) : movie.poster);
      if (fs.existsSync(posterPath)) {
        fs.unlinkSync(posterPath);
        console.log(`Deleted poster at ${posterPath}`);
      } else {
        console.warn(`Poster file not found at ${posterPath}`);
      }
    }

    movie.casts.forEach(cast => {
      if (cast.image) {
        const castPath = path.join(__dirname, '..', '..','public', cast.image.startsWith('/') ? cast.image.slice(1) : cast.image);
        if (fs.existsSync(castPath)) {
          fs.unlinkSync(castPath);
          console.log(`Deleted cast image at ${castPath}`);
        } else {
          console.warn(`Cast image not found at ${castPath}`);
        }
      }
    });

    await Movie.findByIdAndDelete(movieId);

    res.status(200).json({ success: true, message: "Movie and images deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error deleting movie' });
  }
};

const GetMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


const UpdateMovie = async (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const {
      title,
      description,
      director,
      genre,
      releaseDate,
      duration,
      language,
      trailerLink,
      rating,
      castsNames,
      castsIds,
      deletePoster,
      deleteBanner,
      deleteCasts // frontend should send an array of castIds (or indexes) to delete
    } = req.body;

    // === Basic movie fields ===
    movie.title = title;
    movie.description = description;
    movie.director = director;
    movie.genre = Array.isArray(genre) ? genre : genre?.split(',').map(g => g.trim()) || [];
    movie.language = Array.isArray(language) ? language : language?.split(',').map(l => l.trim()) || [];
    movie.releaseDate = releaseDate;
    movie.duration = duration;
    movie.trailerLink = trailerLink;
    movie.rating = rating;

    // === Poster ===
    if (deletePoster === 'true' && movie.poster) {
      try {
        await fs.unlink(
          path.join(__dirname, '..', '..', 'public', movie.poster.replace(/^\//, ''))
        );
      } catch (err) {
        console.warn('Poster delete failed:', err.message);
      }
      movie.poster = '';
    }

    if (req.files['poster'] && req.files['poster'][0]) {
      if (movie.poster) {
        try {
          await fs.unlink(
            path.join(__dirname, '..', '..', 'public', movie.poster.replace(/^\//, ''))
          );
        } catch (err) {
          console.warn('Old poster delete failed:', err.message);
        }
      }
      movie.poster = `/uploads/posters/${req.files['poster'][0].filename}`;
    }

    // === Banner ===
    if (deleteBanner === 'true' && movie.banner) {
      try {
        await fs.unlink(
          path.join(__dirname, '..', '..', 'public', movie.banner.replace(/^\//, ''))
        );
      } catch (err) {
        console.warn('Banner delete failed:', err.message);
      }
      movie.banner = '';
    }

    if (req.files['banner'] && req.files['banner'][0]) {
      if (movie.banner) {
        try {
          await fs.unlink(
            path.join(__dirname, '..', '..', 'public', movie.banner.replace(/^\//, ''))
          );
        } catch (err) {
          console.warn('Old banner delete failed:', err.message);
        }
      }
      movie.banner = `/uploads/banners/${req.files['banner'][0].filename}`;
    }

    // === Casts ===
    const castNamesArray = Array.isArray(castsNames) ? castsNames : castsNames ? [castsNames] : [];
    const castIdsArray = Array.isArray(castsIds) ? castsIds : castsIds ? [castsIds] : [];
    const castImages = req.files['casts'] || [];
    const deleteCastsArray = Array.isArray(deleteCasts) ? deleteCasts : deleteCasts ? [deleteCasts] : [];

    let updatedCasts = [];

    for (let i = 0; i < castNamesArray.length; i++) {
      let cast = {};
      const castId = castIdsArray[i];

      // Try to find existing cast
      if (castId) {
        const existingCast = movie.casts.find(c => c._id.toString() === castId);
        if (existingCast) cast = { ...existingCast._doc };
      }

      // Handle deletion of cast image
      if (deleteCastsArray.includes(castId)) {
        if (cast.image) {
          try {
            await fs.unlink(
              path.join(__dirname, '..', '..', 'public', cast.image.replace(/^\//, ''))
            );
          } catch (err) {
            console.warn('Cast image delete failed:', err.message);
          }
        }
        cast.image = '';
      }

      // Update cast name
      cast.name = castNamesArray[i];

      // Update cast image if new one uploaded
      if (castImages[i] && castImages[i].filename) {
        if (cast.image) {
          try {
            await fs.unlink(
              path.join(__dirname, '..', '..', 'public', cast.image.replace(/^\//, ''))
            );
          } catch (err) {
            console.warn('Old cast image delete failed:', err.message);
          }
        }
        cast.image = `/uploads/casts/${castImages[i].filename}`;
      }

      updatedCasts.push(cast);
    }

    if (updatedCasts.length > 0) {
      movie.casts = updatedCasts;
    }

    await movie.save();
    res.json({ message: 'Movie updated successfully', movie });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating movie' });
  }
};


module.exports = {
  AddMovie,
  GetMovies,
  BlockMovie,
  DeleteMovie,
  GetMovieById,
  UpdateMovie
}