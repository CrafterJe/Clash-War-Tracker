const express = require('express');
const router = express.Router();
const Jugador = require('../models/Jugador');

// Listar jugadores activos
router.get('/', async (req, res) => {
  try {
    const jugadores = await Jugador.find({ activo: true }).sort({ nombre: 1 });
    res.json(jugadores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear jugador
router.post('/', async (req, res) => {
  try {
    const { nombre, th } = req.body;
    const jugador = new Jugador({ nombre, th });
    await jugador.save();
    res.status(201).json(jugador);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar jugador
router.put('/:id', async (req, res) => {
  try {
    const jugador = await Jugador.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(jugador);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar (desactivar) jugador
router.delete('/:id', async (req, res) => {
  try {
    await Jugador.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: 'Jugador desactivado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;