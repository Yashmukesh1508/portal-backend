// routes/auth.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Counter = require('../models/Counter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, or PDF files are allowed'));
  }
};

const upload = multer({ storage, fileFilter });

async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { id: name },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

// Register API
router.post('/register', upload.fields([
  { name: 'aadhar_file', maxCount: 1 },
  { name: 'pan_file', maxCount: 1 }
]), async (req, res) => {
  const {
    slug, name, firm_name, mobile, email, password,
    address, state, city, pincode, aadhar_number,
    pan_number, reference
  } = req.body;

  if (!mobile || !password || !email || !name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userId = await getNextSequence('userId');

      const aadharFile = req.files['aadhar_file']?.[0]?.filename || '';
    const panFile = req.files['pan_file']?.[0]?.filename || '';

    const newUser = new User({
      userId,
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
      reference,
      aadhar_file: aadharFile,
      pan_file: panFile
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', userId: newUser.userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login API
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ message: 'Mobile and password are required' });
  }

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ Create JWT token with userId and mongoId
    const token = jwt.sign(
      {
        userId: user.userId,
        mongoId: user._id,
        mobile: user.mobile,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        userId: user.userId,
        mongoId: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        slug: user.slug
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
