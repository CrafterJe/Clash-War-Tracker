require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Detectar entorno
const isProduction = process.env.NODE_ENV === 'production';

// Middleware CORS con detección de entorno
app.use(cors({
  origin: isProduction 
    ? process.env.FRONTEND_URL || true // Railway usa el mismo dominio
    : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/periodos', require('./routes/periodos'));
app.use('/api/jugadores', require('./routes/jugadores'));
app.use('/api/estadisticas', require('./routes/estadisticas'));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(`Conectado a MongoDB (${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'})`))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en ${isProduction ? 'producción' : 'http://localhost:' + PORT}`);
});