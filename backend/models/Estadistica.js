const mongoose = require('mongoose');

const estadisticaSchema = new mongoose.Schema({
  periodoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Periodo', required: true },
  jugadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jugador', required: true },
  ataques: { type: Number, default: 0, min: 0 },
  estrellas: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Índice compuesto para evitar duplicados
estadisticaSchema.index({ periodoId: 1, jugadorId: 1 }, { unique: true });

module.exports = mongoose.model('Estadistica', estadisticaSchema);