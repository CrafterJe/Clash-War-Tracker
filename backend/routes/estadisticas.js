const express = require('express');
const router = express.Router();
const Estadistica = require('../models/Estadistica');
const Periodo = require('../models/Periodo');
const Jugador = require('../models/Jugador');
const Historial = require('../models/Historial');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Obtener estadísticas del período activo con cálculos (público)
router.get('/', async (req, res) => {
  try {
    const periodo = await Periodo.findOne({ activo: true });
    if (!periodo) {
      return res.status(404).json({ error: 'No hay período activo' });
    }
    
    const stats = await Estadistica.find({ periodoId: periodo._id })
      .populate('jugadorId')
      .lean();
    
    // Calcular métricas
    const resultado = stats.map(stat => {
      const ataquesEsperados = periodo.totalGuerras * 2;
      const participacion = ataquesEsperados > 0 
        ? (stat.ataques / ataquesEsperados) * 100 
        : 0;
      const efectividad = stat.ataques > 0 
        ? (stat.estrellas / (stat.ataques * 3)) * 100 
        : 0;
      const desempeno = (efectividad * 0.6) + (participacion * 0.4);
      
      return {
        _id: stat._id,
        nombre: stat.jugadorId.nombre,
        th: stat.jugadorId.th,
        jugadorId: stat.jugadorId._id,
        ataques: stat.ataques,
        estrellas: stat.estrellas,
        ataquesEsperados,
        participacion: parseFloat(participacion.toFixed(2)),
        efectividad: parseFloat(efectividad.toFixed(2)),
        desempeno: parseFloat(desempeno.toFixed(2))
      };
    });
    
    // Ordenar por TH y desempeño
    resultado.sort((a, b) => {
      if (a.th !== b.th) return b.th - a.th;
      return b.desempeno - a.desempeno;
    });
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estadística (requiere colider o lider)
router.put('/:id', verificarToken, verificarRol('colider', 'lider'), async (req, res) => {
  try {
    const { ataques, estrellas } = req.body;
    
    // Validar que estrellas no excedan el máximo
    if (estrellas > ataques * 3) {
      return res.status(400).json({ 
        error: `Las estrellas no pueden exceder ${ataques * 3} con ${ataques} ataques` 
      });
    }
    
    // Obtener valores anteriores para historial
    const statAnterior = await Estadistica.findById(req.params.id)
      .populate('jugadorId');
    
    // Guardar en historial si hubo cambios
    if (statAnterior.ataques !== ataques) {
      await Historial.create({
        estadisticaId: statAnterior._id,
        jugadorNombre: statAnterior.jugadorId.nombre,
        campoModificado: 'ataques',
        valorAnterior: statAnterior.ataques,
        valorNuevo: ataques,
        modificadoPor: req.usuario.nombre
      });
    }
    
    if (statAnterior.estrellas !== estrellas) {
      await Historial.create({
        estadisticaId: statAnterior._id,
        jugadorNombre: statAnterior.jugadorId.nombre,
        campoModificado: 'estrellas',
        valorAnterior: statAnterior.estrellas,
        valorNuevo: estrellas,
        modificadoPor: req.usuario.nombre
      });
    }
    
    // Actualizar
    const stat = await Estadistica.findByIdAndUpdate(
      req.params.id,
      { ataques, estrellas },
      { new: true }
    );
    
    res.json(stat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Importar desde Excel (requiere colider o lider)
router.post('/importar', verificarToken, verificarRol('colider', 'lider'), async (req, res) => {
  try {
    const { periodoNombre, totalGuerras, jugadores } = req.body;
    
    // Crear período
    await Periodo.updateMany({}, { activo: false });
    const periodo = new Periodo({
      nombre: periodoNombre,
      mes: new Date().toLocaleString('es', { month: 'long' }),
      año: new Date().getFullYear(),
      totalGuerras,
      fechaInicio: new Date(),
      activo: true
    });
    await periodo.save();
    
    // Crear/actualizar jugadores y estadísticas
    for (const j of jugadores) {
      let jugador = await Jugador.findOne({ nombre: j.nombre });
      if (!jugador) {
        jugador = new Jugador({ nombre: j.nombre, th: j.th });
        await jugador.save();
      }
      
      await Estadistica.create({
        periodoId: periodo._id,
        jugadorId: jugador._id,
        ataques: j.ataques,
        estrellas: j.estrellas
      });
    }
    
    res.json({ message: 'Datos importados exitosamente', periodoId: periodo._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener historial de cambios (solo lider)
router.get('/historial', verificarToken, verificarRol('lider'), async (req, res) => {
  try {
    const historial = await Historial.find()
      .sort({ fecha: -1 })
      .limit(100);
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar estadística (requiere colider o lider)
router.delete('/:id', verificarToken, verificarRol('colider', 'lider'), async (req, res) => {
  try {
    await Estadistica.findByIdAndDelete(req.params.id);
    res.json({ message: 'Estadística eliminada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agregar jugador manualmente al período actual (requiere colider o lider)
router.post('/agregar', verificarToken, verificarRol('colider', 'lider'), async (req, res) => {
  try {
    const { nombre, th, ataques, estrellas } = req.body;
    
    const periodo = await Periodo.findOne({ activo: true });
    if (!periodo) {
      return res.status(404).json({ error: 'No hay período activo' });
    }
    
    // Validar límite de 50 jugadores
    const jugadoresActuales = await Estadistica.countDocuments({ periodoId: periodo._id });
    if (jugadoresActuales >= 50) {
      return res.status(400).json({ error: 'Se alcanzó el límite de 50 jugadores por período' });
    }
    
    // Validar estrellas máximas
    if (estrellas > ataques * 3) {
      return res.status(400).json({ 
        error: `Las estrellas no pueden exceder ${ataques * 3} con ${ataques} ataques` 
      });
    }
    
    // Crear o buscar jugador
    let jugador = await Jugador.findOne({ nombre });
    if (!jugador) {
      jugador = new Jugador({ nombre, th });
      await jugador.save();
    }
    
    // Verificar que no esté ya en el período
    const existe = await Estadistica.findOne({ 
      periodoId: periodo._id, 
      jugadorId: jugador._id 
    });
    
    if (existe) {
      return res.status(400).json({ error: 'El jugador ya está en este período' });
    }
    
    // Crear estadística
    const stat = await Estadistica.create({
      periodoId: periodo._id,
      jugadorId: jugador._id,
      ataques,
      estrellas
    });
    
    // Registrar en historial
    await Historial.create({
      jugadorNombre: nombre,
      campoModificado: 'agregar_jugador',
      valorAnterior: 0,
      valorNuevo: 0,
      modificadoPor: req.usuario.nombre
    });
    
    res.status(201).json({ message: 'Jugador agregado', stat });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;