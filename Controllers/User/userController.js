
const User = require("../../model/userSchema");
const Otp=require("../../model/otpSchema")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer=require("nodemailer")

const signup = async (req, res) => {
  try {
    const { name, email, password, cPassword } = req.body;


    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    if (password !== cPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    return requestOtp(req, res);

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It is valid for 1 minute.`,
    html: `<h2>Your OTP: ${otp}</h2><p>It will expire in 1 minute.</p>`
  });
};

const requestOtp = async (req, res) => {
  try {
    const { name, email, password, cPassword } = req.body;

  

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

    await Otp.deleteMany({ email }); // clear previous OTPs
    await Otp.create({ email, otp, expiresAt });

    await sendOtpEmail(email, otp);

    return res.status(200).json({ success: true, message: "OTP sent to your email", userData: { name, email, password } });
  } catch (error) {
    console.error("OTP request error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    await Otp.deleteMany({ email });

    const token = jwt.sign({ userId: user._id, userEmail: user.email }, process.env.MY_SECRET_KEY, { expiresIn: "1d" });

    return res.status(201).json({ success: true, message: "User created successfully", token });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    await sendOtpEmail(email, otp);

    return res.status(200).json({ success: true, message: "OTP resent" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found, Please try to register!!" })
        }
        const pswMatch = await bcrypt.compare(password, user.password)
        if (!pswMatch) {
            return res.status(400).json({ success: false, message: "Invalid Password" })
        }
        if(user.isActive===false){
          return res.status(400).json({ success: false, message: "User Blocked" })
        }
        const secretKey = process.env.MY_SECRET_KEY
        const Token = jwt.sign({ userId: user._id, userEmail: user.email }, secretKey, { expiresIn: "1d" })

        return res.status(201).json({ success: true, message: "Login Successful", Token })


    } catch (error) {
        console.error("Login error: ", error);
        return res.status(500).json({ success: false, message: "Internal server error" });

    }
}

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get user error: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true }).select("-password");
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Update user error: ", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `/uploads/profiles/${req.file.filename}`; // stored path

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { profilePic: fileUrl },
      { new: true }
    ).select("-password");

    return res.status(200).json({ success: true, message: "Profile picture updated", user });
  } catch (error) {
    console.error("Update profile picture error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
    signup,
    Login,
    getProfile,
    updateProfile,
    requestOtp, 
    verifyOtp, 
    resendOtp,
    updateProfilePic
}