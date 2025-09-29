const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Importar rutas de la API
const platosRouter = require('../routes/api/platos');

app.prepare().then(() => {
  const server = express();
  
  // Middleware para parsear JSON
  server.use(express.json());
  
  // Configurar rutas de la API
  server.use('/api', platosRouter);
  
  // Servir archivos estáticos
  server.use(express.static(path.join(__dirname, '../public')));
  
  // Manejar todas las demás rutas con Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });
  
  // Iniciar el servidor
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
