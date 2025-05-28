const express = require("express");
const router = express.Router();
const Registration = require("../models/registrationModel"); // or your model

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

    // You can add validation here (e.g. check required fields)

    // Check if user already exists (optional)
    const existingUser = await Registration.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ error: "User with this mobile already exists" });
    }

    // Save new user to DB
    const newUser = new Registration({
      slug,
      name,
      firm_name,
      mobile,
      email,
      password, // Ideally hash password here
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

const bcrypt = require("bcryptjs");

router.post('/register', async (req, res) => {
  try {
    const { password, ...otherFields } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object with hashed password
    const newUser = new Registration({
      ...otherFields,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to register" });
  }
});


module.exports = router;
