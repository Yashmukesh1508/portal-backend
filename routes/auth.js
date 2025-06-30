const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ftp = require('basic-ftp');
const User = require('../models/User');
const Counter = require('../models/Counter');
require('dotenv').config();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  allowedTypes.test(ext) ? cb(null, true) : cb(new Error('Only JPG, PNG, or PDF files allowed'));
};

const upload = multer({ storage, fileFilter });

// Get next userId
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { id: name },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

// FTP Upload function
async function uploadToFTP(localPath, remoteFilename) {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: true,
      secureOptions: {
        rejectUnauthorized: false // to allow self-signed or mismatched SSL
      }
    });
    await client.ensureDir("/public_html/uploads");
    await client.uploadFrom(localPath, remoteFilename);
    console.log(`✅ FTP Upload successful: ${remoteFilename}`);
  } catch (err) {
    console.error("FTP Upload Error:", err.message);
    throw err;
  } finally {
    client.close();
  }
}

// Register Route
router.post('/register', upload.fields([
  { name: 'aadhar_file', maxCount: 1 },
  { name: 'pan_file', maxCount: 1 }
]), async (req, res) => {
  const {
    slug, name, firm_name, mobile, email, password,
    address, state, city, pincode, aadhar_number,
    pan_number, reference
  } = req.body;

  try {
    if (!mobile || !password || !email || !name) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const userId = await getNextSequence('userId');

    const aadharFile = req.files['aadhar_file']?.[0];
    const panFile = req.files['pan_file']?.[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userId,
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
      reference,
      aadhar_file: aadharFile?.filename || '',
      pan_file: panFile?.filename || ''
    });

    await newUser.save();

    // Upload to FTP
    if (aadharFile) {
      await uploadToFTP(aadharFile.path, aadharFile.filename);
    }
    if (panFile) {
      await uploadToFTP(panFile.path, panFile.filename);
    }

    // Delete local files
    if (aadharFile) fs.unlinkSync(aadharFile.path);
    if (panFile) fs.unlinkSync(panFile.path);

    res.status(201).json({ message: 'Registration successful', userId });

  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
