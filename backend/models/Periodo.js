const mongoose = require('mongoose');

const periodoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  mes: { type: String, required: true },
  año: { type: Number, required: true },
  totalGuerras: { type: Number, required: true, default: 1 },
  fechaInicio: { type: Date, required: true },
  fechaFin: Date,
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Periodo', periodoSchema);