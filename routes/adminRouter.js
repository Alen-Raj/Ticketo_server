const express=require("express")
const router=express.Router()
const adminController=require("../Controllers/Admin/adminController")
const upload=require("../middleware/multer")
const movieController= require('../Controllers/Admin/movieController')
const verifyAdmin=require("../middleware/verifyAdmin")
const AdminUserController=require("../Controllers/Admin/adminUserController")
const AdminTheatreController=require("../Controllers/Admin/adminTheatreController")


router.post("/login",adminController.Login)
router.get("/dashboard",adminController.getAdminDashboard)
router.post('/addMovie', verifyAdmin,upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'casts', maxCount: 10 },
]), movieController.AddMovie);

router.get('/movies',verifyAdmin,movieController.GetMovies);
router.put("/movies/:id/block",verifyAdmin,movieController.BlockMovie)
router.delete("/movies/:id/delete",verifyAdmin,movieController.DeleteMovie)
router.get("/movies/:id", verifyAdmin, movieController.GetMovieById);
router.put("/movies/:id/edit", verifyAdmin, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'casts', maxCount: 10 },
]), movieController.UpdateMovie);
router.get('/usersList',verifyAdmin,AdminUserController.UserList)
router.put('/users/:id/toggle',verifyAdmin,AdminUserController.UserActive)
router.delete('/users/:id/delete',verifyAdmin,AdminUserController.DeleteUser)
router.put('/users/:id/update', verifyAdmin, AdminUserController.UpdateUser);
router.get('/theatre/list',verifyAdmin,AdminTheatreController.GetTheatre)
router.put('/theatre/:id/status',verifyAdmin,AdminTheatreController.ActiveTheatre)



module.exports=router