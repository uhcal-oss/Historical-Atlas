const mongoose = require('mongoose');

const iconMarkerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  file_name: { type: String, required: true },
  url: { type: String, required: true }
});

iconMarkerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => { ret.id = ret._id; delete ret.__v; }
});

module.exports = mongoose.model('IconMarker', iconMarkerSchema);
