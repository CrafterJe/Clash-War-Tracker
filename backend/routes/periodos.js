const express = require('express');
const router = express.Router();
const Periodo = require('../models/Periodo');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Obtener período activo (público)
router.get('/activo', async (req, res) => {
  try {
    const periodo = await Periodo.findOne({ activo: true });
    if (!periodo) {
      return res.status(404).json({ error: 'No hay período activo' });
    }
    res.json(periodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo período (requiere colider o lider)
router.post('/', verificarToken, verificarRol('colider', 'lider'), async (req, res) => {
  try {
    const { nombre, mes, año, totalGuerras, fechaInicio } = req.body;
    
    // Desactivar períodos anteriores
    await Periodo.updateMany({}, { activo: false });
    
    const periodo = new Periodo({
      nombre,
      mes,
      año,
      totalGuerras,
      fechaInicio,
      activo: true
    });
    
    await periodo.save();
    res.status(201).json(periodo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar total de guerras (solo lider)
router.put('/:id/guerras', verificarToken, verificarRol('lider'), async (req, res) => {
  try {
    const { totalGuerras } = req.body;
    
    if (totalGuerras < 1) {
      return res.status(400).json({ error: 'Total de guerras debe ser al menos 1' });
    }
    
    const periodo = await Periodo.findByIdAndUpdate(
      req.params.id,
      { totalGuerras },
      { new: true }
    );
    
    res.json(periodo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todos los períodos (público)
router.get('/', async (req, res) => {
  try {
    const periodos = await Periodo.find().sort({ fechaInicio: -1 });
    res.json(periodos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;