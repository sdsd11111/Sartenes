const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sartenes_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: '¡La API está funcionando correctamente!' });
});

// Ruta para obtener los platos activos
app.get('/api/platos-activos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM platos_del_dia WHERE activo = 1 ORDER BY orden ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener platos activos:', error);
    res.status(500).json({ error: 'Error al obtener los platos activos' });
  }
});

// Ruta para actualizar el estado de un plato
app.put('/api/platos/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  
  try {
    await pool.query(
      'UPDATE platos_del_dia SET activo = ? WHERE id = ?',
      [activo ? 1 : 0, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar estado del plato:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del plato' });
  }
});

// Ruta para actualizar un plato
app.put('/api/platos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio } = req.body;
  
  try {
    await pool.query(
      'UPDATE platos_del_dia SET nombre = ?, descripcion = ?, precio = ? WHERE id = ?',
      [nombre, descripcion, precio, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar el plato:', error);
    res.status(500).json({ error: 'Error al actualizar el plato' });
  }
});

// Ruta para eliminar un plato
app.delete('/api/platos/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM platos_del_dia WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar el plato:', error);
    res.status(500).json({ error: 'Error al eliminar el plato' });
  }
});

// Ruta para crear un nuevo plato
app.post('/api/platos', async (req, res) => {
  const { nombre, descripcion, precio } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO platos_del_dia (nombre, descripcion, precio, activo, orden) VALUES (?, ?, ?, 1, 0)',
      [nombre, descripcion, precio]
    );
    
    // Obtener el plato recién creado
    const [plato] = await pool.query('SELECT * FROM platos_del_dia WHERE id = ?', [result.insertId]);
    res.status(201).json(plato[0]);
  } catch (error) {
    console.error('Error al crear el plato:', error);
    res.status(500).json({ error: 'Error al crear el plato' });
  }
});

// Ruta para actualizar el orden de los platos
app.put('/api/platos/orden', async (req, res) => {
  const { platos } = req.body;
  
  try {
    const promises = platos.map((plato, index) => 
      pool.query('UPDATE platos_del_dia SET orden = ? WHERE id = ?', [index, plato.id])
    );
    
    await Promise.all(promises);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar el orden de los platos:', error);
    res.status(500).json({ error: 'Error al actualizar el orden de los platos' });
  }
});

// Iniciar el servidor solo si no estamos en un entorno serverless (como Vercel)
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    console.log(`Visita http://localhost:${PORT}`);
  });

  // Manejo de cierre de la aplicación
  process.on('SIGTERM', () => {
    console.log('\n🔴 Recibida señal de terminación. Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  });
}

// Manejador de errores no controlados en promesas
process.on('unhandledRejection', (err) => {
  console.error('\n❌ Error no manejado en una promesa:', err);
  if (process.env.VERCEL !== '1' && server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Exportar la aplicación para Vercel y pruebas
const startServer = () => {
  if (process.env.VERCEL !== '1') {
    const server = app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
      console.log(`Visita http://localhost:${PORT}`);
    });
    return server;
  }
  return null;
};

// Solo exportar startServer si no estamos en producción de Vercel
module.exports = process.env.VERCEL === '1' ? app : { app, startServer };
