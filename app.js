require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

mongoose.set('strictQuery', false);

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected on app termination');
  process.exit(0);
});
