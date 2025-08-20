const Movie = require("../../model/movieSchema");
const Theatre = require("../../model/theatreSchema");
const Show = require("../../model/showSchema");
const Screen = require("../../model/screenSchema");


const getActiveMovies = async (req, res) => {
  try {
    const { city } = req.query;

    const theatres = await Theatre.find({ "address.city": city, isActive: true });
    const theatreIds = theatres.map(t => t._id);

    const shows = await Show.find({
      isActive: true,
      theatre: { $in: theatreIds }
    }).populate("movie");

    const uniqueMovies = new Map();
    shows.forEach(show => {
      const movie = show.movie;
      if (movie && movie.isActive && movie.rating >= 7) {
        uniqueMovies.set(movie._id.toString(), movie);
      }
    });

    const movies = Array.from(uniqueMovies.values());

    res.status(200).json(movies);
  } catch (error) {
    console.error("Error fetching active movies:", error);
    res.status(500).json({ message: "Error fetching movies" });
  }
};

const allMovieList = async (req, res) => {
  try {
    const movies = await Movie.find({ isActive: true });
    res.status(200).json(movies);
  } catch (error) {
    console.error("Error fetching all movies:", error);
    res.status(500).json({ message: "Error fetching movies" });
  }
};

const getTheatreCities = async (req, res) => {
  try {
    const cities = await Theatre.distinct("address.city", { isActive: true });
    res.status(200).json({ cities });
  } catch (error) {
    console.error("Error fetching theatre cities:", error);
    res.status(500).json({ message: "Error fetching cities" });
  }
};

const getUpcomingMovies = async (req, res) => {
  try {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 5);

    const upcomingMovies = await Movie.find({
      releaseDate: { $gte: futureDate },
      isActive: true,
    });

    res.status(200).json(upcomingMovies);
  } catch (error) {
    console.error("Error fetching upcoming movies:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id); 
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.status(200).json(movie);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMovieShowsByDate = async (req, res) => {
  const { id: movieId } = req.params;

  try {
    const shows = await Show.find({ movie: movieId, isActive: true })
      .populate({
        path: "theatre",
        select: "name address",
      })
      .populate({
        path: "screen",
        select: "screenName",
      })
      .populate({
        path:"movie",
        select:"poster title duration genre language"
      })

      if (!shows || shows.length === 0) {
      return res.status(404).json({ message: "No shows found for this movie." });
    }

    res.status(200).json(shows);
  } catch (error) {
    console.error("Failed to fetch shows", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getScreenInfo = async (req, res) => {
   try {
    const show = await Show.findById(req.params.showId)
      .populate("movie")
      .populate("theatre")
      .populate("screen");

    if (!show) return res.status(404).json({ message: "Show not found" });

    res.json({
      movie: show.movie,
      theatreName: show.theatre.name,
      screenName: show.screen.screenName,
      sections: show.screen.sections,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getFutureBannerMovies = async (req, res) => {
  try {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 20); 

    const movies = await Movie.find({
      releaseDate: { $gte: futureDate },
      isActive: true,
    })

    res.status(200).json(movies);
  } catch (error) {
    console.error("Error fetching banner movies:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const movies = await Movie.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { language: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    });

    res.status(200).json(movies);
  } catch (error) {
    console.error("Error searching movies:", error);
    res.status(500).json({ message: "Error searching movies" });
  }
};


module.exports = {
  getActiveMovies,
  allMovieList,
  getTheatreCities,
  getUpcomingMovies,
  getMovieById,
  getMovieShowsByDate,
  getFutureBannerMovies,
  searchMovies
};
