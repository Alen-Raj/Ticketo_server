const express=require("express")
const router=express.Router()
const TheatreController=require("../Controllers/Theatre/theatreController")
const verifyOwner=require("../middleware/verifyOwner")
const ScreenController=require("../Controllers/Theatre/screenController")
const ShowController=require("../Controllers/Theatre/showController")


router.post("/login",TheatreController.TheatreLogin)
router.post("/add",verifyOwner,TheatreController.addTheater)
router.get("/myTheatres", verifyOwner, TheatreController.getOwnerTheatres)
router.delete("/:id/delete",verifyOwner,TheatreController.deleteTheatre)
router.put("/:id/update", verifyOwner, TheatreController.updateTheatre);

router.post("/screen/add", verifyOwner,ScreenController.addScreen);
router.get("/myTheatresWithScreens", verifyOwner, ScreenController.getOwnerTheatreWithScreens);
router.get('/shows/list',verifyOwner, ShowController.getMovies)
router.post('/shows/add',verifyOwner, ShowController.addShow)
router.get('/:theatreId/screen/:screenId', verifyOwner, ScreenController.getScreenDetails);
router.put('/:theatreId/screen/:screenId/update', verifyOwner, ScreenController.updateScreen);
router.get("/owner/dashboard",verifyOwner,TheatreController.getOwnerDashboard)



module.exports=router
