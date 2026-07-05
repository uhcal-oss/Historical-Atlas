const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  user_name: { type: String, required: true },
  generated_key: { type: String, required: true },
  date: { type: Date, required: true }
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
