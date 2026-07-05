const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  mail: { type: String, required: true, unique: true },
  lang: { type: String }
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
