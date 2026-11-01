console.log("📂 ESTOY EJECUTANDO ESTE ARCHIVO:", __filename);
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Ruta explícita para la raíz (sirve home.html)
app.get('/', (req, res) => {
  console.log('--- ENTRANDO A HOME.HTML ---');
  const rutaHome = path.join(__dirname, 'public', 'home.html');
  console.log('Sirviendo archivo desde:', rutaHome);
  res.sendFile(rutaHome);
});

// 2. Servir los archivos estáticos de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Base de Datos en archivo local SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Modelo de la tabla Scores (Puntuaciones)
const Score = sequelize.define('Score', {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  game: {
    type: DataTypes.STRING, // 'tetris' o 'snake'
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Endpoints de la API

// 1. Guardar una puntuación
app.post('/api/scores', async (req, res) => {
  try {
    const { username, game, score } = req.body;
    if (!username || !game || score === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const newScore = await Score.create({ username, game, score });
    res.status(201).json({ message: 'Puntuación guardada con éxito', data: newScore });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la puntuación' });
  }
});

// 2. Obtener el Top 10 de puntuaciones de un juego
app.get('/api/scores/:game', async (req, res) => {
  try {
    const { game } = req.params;
    const topScores = await Score.findAll({
      where: { game },
      order: [['score', 'DESC']],
      limit: 10
    });
    res.json(topScores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el ranking' });
  }
});

// Iniciar base de datos y arrancar servidor
async function startServer() {
  try {
    await sequelize.sync();
    console.log('Base de datos SQLite conectada correctamente.');
    
    app.listen(PORT, () => {
      console.log(`Servidor API ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}

startServer();