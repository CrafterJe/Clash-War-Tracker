const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const usuario = await Usuario.findOne({ username, activo: true });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    const token = jwt.sign(
      { 
        id: usuario._id, 
        username: usuario.username, 
        nombre: usuario.nombre,
        rol: usuario.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      usuario: {
        username: usuario.username,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar sesión (para cuando recargas la página)
router.get('/verificar', verificarToken, async (req, res) => {
  res.json({ 
    usuario: {
      username: req.usuario.username,
      nombre: req.usuario.nombre,
      rol: req.usuario.rol
    }
  });
});

// Crear usuario (solo líder)
router.post('/usuarios', verificarToken, verificarRol('lider'), async (req, res) => {
  try {
    const { username, password, nombre, rol } = req.body;
    
    const usuario = new Usuario({ username, password, nombre, rol });
    await usuario.save();
    
    res.status(201).json({ 
      message: 'Usuario creado',
      usuario: { username, nombre, rol }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar usuarios (solo líder)
router.get('/usuarios', verificarToken, verificarRol('lider'), async (req, res) => {
  try {
    const usuarios = await Usuario.find({ activo: true })
      .select('-password')
      .sort({ rol: 1, nombre: 1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registro público (asigna rol miembro automáticamente)
router.post('/registro', async (req, res) => {
  try {
    const { username, password, nombre } = req.body;
    
    // Validar campos
    if (!username || !password || !nombre) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Verificar que no exista el usuario
    const existente = await Usuario.findOne({ username });
    if (existente) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    const usuario = new Usuario({ 
      username, 
      password, 
      nombre, 
      rol: 'miembro' // Siempre miembro en registro público
    });
    await usuario.save();
    
    // Registrar en historial
    const Historial = require('../models/Historial');
    await Historial.create({
      jugadorNombre: nombre,
      campoModificado: 'registro',
      valorAnterior: 0,
      valorNuevo: 0,
      modificadoPor: 'Sistema (Registro público)'
    });
    
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente con rol de miembro'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cambiar rol de usuario (solo lider)
router.put('/usuarios/:id/rol', verificarToken, verificarRol('lider'), async (req, res) => {
  try {
    const { rol } = req.body;
    
    if (!['miembro', 'colider', 'lider'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    
    const usuario = await Usuario.findById(req.params.id);
    const rolAnterior = usuario.rol;
    
    usuario.rol = rol;
    await usuario.save();
    
    // Registrar en historial
    const Historial = require('../models/Historial');
    await Historial.create({
      jugadorNombre: usuario.nombre,
      campoModificado: 'cambio_rol',
      valorAnterior: 0,
      valorNuevo: 0,
      modificadoPor: `${req.usuario.nombre} (${rolAnterior} → ${rol})`
    });
    
    res.json({ message: 'Rol actualizado', usuario });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;