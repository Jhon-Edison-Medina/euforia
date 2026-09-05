// backend/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  time: String,
  location: String,
  category: String,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);