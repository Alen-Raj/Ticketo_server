const express=require("express")
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router=express.Router()
const upload = require("../middleware/multer");
const userController=require("../Controllers/User/userController")
const HomeController=require("../Controllers/User/homeController")
const BookingController=require("../Controllers/User/bookingController")
const verifyToken=require("../middleware/auth")


router.post("/register",userController.signup)
router.post("/register-otp", userController.requestOtp);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.post("/login",userController.Login)
router.get('/get-profile', verifyToken, userController.getProfile)
router.put("/update-profile", verifyToken, userController.updateProfile);
router.put("/update-profile-pic", verifyToken, upload.single("profilePic"), userController.updateProfilePic);

router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] ,prompt: "select_account" }));
router.get("/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { userId: user._id, userEmail: user.email },
      process.env.MY_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);

  }
);

router.get("/movies/future-banners", HomeController.getFutureBannerMovies);
router.get("/movies",HomeController.getActiveMovies)
router.get('/theatre-cities',HomeController.getTheatreCities)
router.get("/movies/all",HomeController.allMovieList)
router.get('/search', HomeController.searchMovies);
router.get("/movies/upcoming",HomeController.getUpcomingMovies)
router.get("/movie/:id/details",HomeController.getMovieById)
router.get("/movie/:id/displayShows",HomeController.getMovieShowsByDate)
router.get("/show/:showId/screen-info", BookingController.getScreenInfo);

router.get("/show/:showId/screen-info/booking",verifyToken, BookingController.getScreenBookingInfo);
router.post("/create-order",verifyToken, BookingController.createOrder);
router.post("/verify-payment", verifyToken,BookingController.verifyPayment);
router.get('/my-bookings',verifyToken,BookingController.myBookings)





module.exports=router