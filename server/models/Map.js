const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  lang: { type: String },
  category: { type: String },
  update_date: { type: Date },
  creation_date: { type: Date },
  public: { type: Boolean, default: false },
  public_editable: { type: Boolean, default: false },
  views: { type: Number, default: 0 }
});

mapSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => { ret.id = ret._id; delete ret.__v; }
});

module.exports = mongoose.model('Map', mapSchema);
