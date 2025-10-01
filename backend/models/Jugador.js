const mongoose = require('mongoose');

const jugadorSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  th: { type: Number, required: true, min: 1, max: 17 },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Jugador', jugadorSchema);