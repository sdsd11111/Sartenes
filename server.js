const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// =============================================
// 1. CONFIGURACIÓN BÁSICA DEL SERVIDOR
// =============================================
const app = express();
const PORT = process.env.PORT || 8001;

// Configuración de middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// 2. CONFIGURACIÓN DE RUTAS DE LA API
// =============================================

// Importar rutas de la API
const platosRouter = require('./routes/api/platos');

// Ruta de estado de la API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API funcionando correctamente', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Registrar rutas de la API
app.use('/api', platosRouter);
console.log('✅ Rutas de la API registradas en /api');

// =============================================
// 3. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
// =============================================

// Configuración de rutas
const rootPath = __dirname; // Ruta raíz del proyecto
const publicPath = path.join(rootPath, 'public');

// Servir archivos estáticos de la carpeta public si existe
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log('✅ Archivos estáticos públicos habilitados en /public');
}

// Servir archivos estáticos de la raíz (solo archivos específicos)
app.use(express.static(rootPath, {
  index: false, // No servir automáticamente index.html
  extensions: ['html', 'htm', 'css', 'js', 'json', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg']
}));

// Servir imágenes desde la carpeta images
const imagesPath = path.join(rootPath, 'images');
if (fs.existsSync(imagesPath)) {
  app.use('/images', express.static(imagesPath));
  console.log('✅ Imágenes habilitadas en /images');
}

// Manejo de rutas del lado del cliente para SPA
app.get('*', (req, res) => {
  // Si es una petición de API, devolver 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  
  // Para cualquier otra ruta, servir index.html
  res.sendFile(path.join(publicPath, 'index.html'), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// Configuración del panel de administración
const adminPath = path.join(rootPath, 'admin');
if (fs.existsSync(adminPath)) {
  // Servir archivos estáticos del panel de administración
  app.use('/admin', express.static(adminPath));
  
  // Manejar rutas SPA para el panel de administración
  app.get('/admin*', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  });
  
  console.log(`✅ Panel de administración habilitado en /admin`);
} else {
  console.warn('⚠️ No se encontró la carpeta del panel de administración');
}

console.log(`✅ Página principal: ${path.join(rootPath, 'index.html')}`);

// =============================================
// 5. MANEJO DE ERRORES
// =============================================

// Manejar rutas no encontradas (404)
app.use((req, res, next) => {
  if (req.accepts('html')) {
    // Si el cliente acepta HTML, sirve la página 404 personalizada
    const notFoundPath = path.join(publicPath, '404.html');
    if (fs.existsSync(notFoundPath)) {
      return res.status(404).sendFile(notFoundPath);
    }
  }
  
  // Si no, devuelve un JSON con el error
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  
  // Determinar el código de estado (predeterminado: 500)
  const statusCode = err.statusCode || 500;
  
  // Construir la respuesta de error
  const errorResponse = {
    success: false,
    error: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };
  
  // Solo incluir detalles del error en desarrollo
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
});

// =============================================
// 6. INICIO DEL SERVIDOR
// =============================================

// Función para iniciar el servidor
function startServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Panel de administración: http://localhost:${PORT}/admin`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏠 Página de inicio: http://localhost:${PORT}`);
      console.log('\nPresiona Ctrl+C para detener el servidor\n');
      
      resolve(server);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
        console.log('Por favor, cierra cualquier otra instancia del servidor o usa un puerto diferente.');
        console.log('Puedes cambiar el puerto modificando la variable de entorno PORT o en el archivo .env\n');
      } else {
        console.error('\n❌ Error al iniciar el servidor:', err);
      }
      reject(err);
    });
  });
}

// Export the Express API for Vercel
module.exports = app;

// Iniciar el servidor solo si no estamos en Vercel
if (process.env.VERCEL !== '1') {
  startServer().catch(err => {
    console.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  });
}

// Manejo de cierre de la aplicación
process.on('SIGTERM', () => {
  console.log('\n🔴 Recibida señal de terminación. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('\n❌ Error no manejado en una promesa:', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Exportar la aplicación para pruebas
module.exports = { app, startServer };
