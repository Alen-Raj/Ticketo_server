const Theatre=require("../../model/theatreSchema")


const GetTheatre=async(req,res)=>{
    try {
        const theatre=await Theatre.find()
        res.status(200).json(theatre)
    } catch (error) {
        res.status(500).json({success:false,message:"Error Fetching Theatres"})
    }
}

const ActiveTheatre=async(req,res)=>{
    try {
        const theatreId=req.params.id 
        const {isActive}=req.body
        const updateTheatre= await Theatre.findByIdAndUpdate(theatreId,{isActive},{new:true})
        if(!updateTheatre){
        res.status(404).json({success:false,message:'Theatre not found'})
        }
        res.status(200).json({ success: true, message: 'Theatre updated successfully', theatre: updateTheatre });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating Theatre status' });
    }
}

module.exports={
    GetTheatre,
    ActiveTheatre
}