require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const lider = new Usuario({
      username: 'CrafterJe',
      password: 'Bakugan2y4', // Cámbiala después
      nombre: 'CrafterJe',
      rol: 'lider'
    });
    
    await lider.save();
    console.log('Líder creado exitosamente');
    process.exit();
  });