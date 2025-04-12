const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    
    // Ensure the token has the required user ID
    if (!verified._id) {
      return res.status(401).json({ message: 'Invalid Token - Missing User ID' });
    }

    req.user = {
      _id: verified._id,  // This is what your Checklist model needs
      ...verified        // Include any other token payload
    };
    
    console.log("Authenticated User ID:", req.user._id); // Debug
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    res.status(400).json({ message: 'Invalid Token' });
  }
};