const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified;
    
    console.log("Decoded Token:", req.user); // 🔹 Debugging Line

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message); // 🔹 Log the error
    res.status(400).json({ message: 'Invalid Token' });
  }
};
