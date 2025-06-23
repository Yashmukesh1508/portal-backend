const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Registration = require("../models/registrationModel");

// Registration Route
router.post("/register", async (req, res) => {
  try {
    const {
      slug,
      name,
      firm_name,
      mobile,
      email,
      password,
      address,
      state,
      city,
      pincode,
      aadhar_number,
      pan_number,
      gst_number,
      reference,
    } = req.body;

    // ✅ Validation
    if (!name || !mobile || !password) {
      return res.status(400).json({ error: "Name, Mobile, and Password are required" });
    }

    // ✅ Check if user already exists
    const existingUser = await Registration.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ error: "User with this mobile already exists" });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const newUser = new Registration({
      slug,
      name,
      firm_name,
      mobile,
      email,
      password: hashedPassword,
      address,
      state,
      city,
      pincode,
      aadhar_number,
      pan_number,
      gst_number,
      reference,
    });

    await newUser.save();

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
