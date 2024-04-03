const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['class', 'task'],
    required: true,
  },
  details: {
    type: String,
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('ScheduleEntry', scheduleEntrySchema);

