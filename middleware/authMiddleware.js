const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Check multiple possible token locations
  const token = req.header('Authorization') || 
                req.cookies?.token || 
                req.headers?.authorization;
  
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    
    // Check for either _id or userId in the token
    if (!verified._id && !verified.userId) {
      return res.status(401).json({ message: 'Invalid Token - Missing User ID' });
    }

    req.user = {
      _id: verified._id || verified.userId,
      userId: verified._id || verified.userId  // Add this for consistency
    };
    
    console.log("Authenticated User ID:", req.user._id);
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    res.status(400).json({ message: 'Invalid Token' });
  }
};