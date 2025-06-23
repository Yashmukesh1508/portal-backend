const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Registration = require('../models/User'); // user model

router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await Registration.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ If using JWT, you can generate a token here (optional)
    // const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    return res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        id: user._id,
      },
      // token, // Uncomment if using JWT
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});

module.exports = router;
