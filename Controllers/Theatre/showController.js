const mongoose = require('mongoose');
const Show = require('../../model/showSchema');
const Screen = require('../../model/screenSchema');
const Movie = require('../../model/movieSchema');
const Theatre = require('../../model/theatreSchema');

const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ isActive: true });
    res.status(200).json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
};

const addShow = async (req, res) => {
  try {
    const { movieId, screenId, theatreId, schedule } = req.body;

    const movie = await Movie.findById(movieId);
    const screen = await Screen.findById(screenId);
    const theatre = await Theatre.findById(theatreId);

    if (!movie || !screen || !theatre) {
      return res.status(404).json({ message: "Invalid movie, screen or theatre" });
    }

    const dates = Object.keys(schedule);

    const existingShows = await Show.find({ screen: screenId });

    for (const show of existingShows) {
      if (!show.schedule) continue;

      const scheduleMap = show.schedule instanceof Map ? Object.fromEntries(show.schedule) : show.schedule;

      for (const date of dates) {
        if (scheduleMap[date]) {
          const incomingSlots = schedule[date].map(s => s.replace(/\s+/g, "").toUpperCase());
          const existingSlots = scheduleMap[date].map(s => s.replace(/\s+/g, "").toUpperCase());

          const conflict = incomingSlots.find(slot => existingSlots.includes(slot));
          if (conflict) {
            return res.status(400).json({
              message: `A show already exists on this screen at ${conflict} on ${new Date(date).toDateString()}`
            });
          }
        }
      }
    }



    const newShow = new Show({
      movie: movieId,
      screen: screenId,
      theatre: theatreId,
      schedule
    });

    await newShow.save();
    return res.status(201).json({ message: "Show added successfully", show: newShow });
  } catch (err) {
    console.error("Add show error:", err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  addShow,
  getMovies
};
