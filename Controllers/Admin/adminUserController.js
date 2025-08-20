const User = require("../../model/userSchema");

const UserList = async (req, res) => {
  try {
    const users = await User.find();

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

const DeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid User ID" });
    }

    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    
    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: "User deleted successfully" });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error while deleting user" });
  }
};

const UserActive=async(req,res)=>{
  try {
      const userId=req.params.id
      const {isActive}=req.body
      const changeActive=await User.findByIdAndUpdate(userId,{isActive},{new:true})
      if(!changeActive){
       return res.status(404).json({success:false,message:"User Not Found"})
      }
      res.status(200).json({success:true,message:"User Updated Successfully"})
  } catch (error) {
       console.log("error User Active: ",error);
       res.status(404).json({success:false,message:"Error Updating User"})
  }
}

const UpdateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Server error while updating user" });
  }
};


module.exports = {
  UserList,
  DeleteUser,
  UserActive,
  UpdateUser
};
