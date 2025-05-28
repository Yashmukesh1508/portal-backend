const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Registration = require('../models/User'); // update with your actual model path

router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await Registration.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Add password match check here if not already done
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Return user details
    return res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        id: user._id,
      },
      token: "your_token_here", // Optional: if using token
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
});


module.exports = router;
