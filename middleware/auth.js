const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Access denied: No token provided" 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.MY_SECRET_KEY);
        
        if (!decoded.userId) {
            return res.status(403).json({ 
                success: false, 
                message: "Invalid token: Missing user ID" 
            });
        }

        req.user = decoded; 
        req.userId = decoded.userId;
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(403).json({ 
                success: false, 
                message: "Token expired" 
            });
        }
        return res.status(403).json({ 
            success: false, 
            message: "Invalid token" 
        });
    }
};

module.exports = verifyToken;