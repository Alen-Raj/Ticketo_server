const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.MY_SECRET_KEY);
    console.log("Decoded token:", decoded);


    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    req.user = decoded; 
    next();

  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = verifyAdmin;
