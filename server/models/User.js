const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mail: { type: String, required: true },
  admin: { type: Boolean, default: false },
  lang: { type: String, default: 'en' },
  newsletter: { type: Boolean, default: false },
  registration_date: { type: Date },
  login_date: { type: Date }
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => { delete ret.__v; }
});

module.exports = mongoose.model('User', userSchema);
