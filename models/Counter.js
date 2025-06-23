const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sequence_value: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', CounterSchema);
