const Screen = require("../../model/screenSchema");
const Theatre = require("../../model/theatreSchema");
const Show = require("../../model/showSchema");
const Movie = require("../../model/movieSchema");


const addScreen=async (req, res) => {
  try {
    const { screenName, theatre, totalSeats, sections } = req.body;

    if (!screenName || !theatre || !sections || sections.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const foundTheatre = await Theatre.findById(theatre);
    if (!foundTheatre) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    const newScreen = new Screen({
      screenName,
      theatre,
      totalSeats,
      sections
    });

    await newScreen.save();

    foundTheatre.screens.push(newScreen._id);
    await foundTheatre.save();

    res.status(201).json({ message: "Screen created successfully", screen: newScreen });
  } catch (error) {
    console.error("Error creating screen:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getOwnerTheatreWithScreens = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const theatres = await Theatre.find({ owner: ownerId })
      .populate({
        path: 'screens',
        match: { isActive: true },
        populate: {
          path: 'theatre',
          select: 'name'
        }
      })
      .lean(); // Lean returns plain JS objects instead of Mongoose documents

    // For each screen in each theatre, fetch related shows
    for (const theatre of theatres) {
      if (theatre.screens && theatre.screens.length > 0) {
        for (const screen of theatre.screens) {
          const shows = await Show.find({
            screen: screen._id,
            isActive: true
          })
            .populate('movie', 'title')
            .select('schedule movie')
            .lean();

          screen.shows = shows;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: theatres
    });

  } catch (error) {
    console.error("Error fetching theatres with screens and shows:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching theatres with screens and shows"
    });
  }
};

const getScreenDetails = async (req, res) => {
  try {
    const { theatreId, screenId } = req.params;

    const screen = await Screen.findOne({
      _id: screenId,
      theatre: theatreId
    }).lean();

    if (!screen) {
      return res.status(404).json({ message: "Screen not found" });
    }

    res.status(200).json({ 
      success: true,
      data: screen
    });
  } catch (error) {
    console.error("Error fetching screen details:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching screen details" 
    });
  }
};

const updateScreen = async (req, res) => {
  try {
    const { theatreId, screenId } = req.params;
    const { screenName, totalSeats, sections } = req.body;

    if (!screenName || !sections || sections.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updatedScreen = await Screen.findOneAndUpdate(
      { _id: screenId, theatre: theatreId },
      { screenName, totalSeats, sections },
      { new: true }
    );

    if (!updatedScreen) {
      return res.status(404).json({ message: "Screen not found" });
    }

    res.status(200).json({ 
      success: true,
      message: "Screen updated successfully",
      data: updatedScreen
    });
  } catch (error) {
    console.error("Error updating screen:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while updating screen" 
    });
  }
};


module.exports={
    addScreen,
    getOwnerTheatreWithScreens,
    getScreenDetails,
    updateScreen
}