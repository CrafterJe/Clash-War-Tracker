const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
  estadisticaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Estadistica' },
  jugadorNombre: String,
  campoModificado: String,
  valorAnterior: Number,
  valorNuevo: Number,
  modificadoPor: String,
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Historial', historialSchema);