const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
  origin: ['https://sartenes.vercel.app', 'http://localhost:3000', 'http://localhost:9000'],
  credentials: true
}));

// Configuración de CORS para producción
const allowedOrigins = ['https://sartenes.vercel.app', 'http://localhost:3000', 'http://localhost:9000'];
app.use(cors({
  origin: function(origin, callback) {
    // Permitir peticiones sin origen (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'El origen de la petición no está permitido';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Configuración de CORS - ya definida anteriormente

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Ruta para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Ruta para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'public', 'images', 'platos');
    if (!fs.existsSync(dir)) { 
      fs.mkdirSync(dir, { recursive: true }); 
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const titulo = (req.body.titulo || 'plato').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    cb(null, titulo + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({ storage: storage });

// Rutas de la API
app.get('/api/test', (req, res) => {
  res.json({ message: '¡API funcionando correctamente con Supabase!' });
});

// Crear o actualizar plato
app.post('/api/platos', upload.single('imagen'), async (req, res) => {
  try {
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file);
    
    const { titulo, descripcion, valor, activo, id } = req.body;
    const platoId = id; // Para actualización
    
    // Manejo de la imagen
    let imagen_url = req.body.imagen_url || '';
    if (req.file) {
      imagen_url = '/images/platos/' + req.file.filename;
    }
    
    const platoData = { 
      titulo, 
      descripcion, 
      precio: parseFloat(valor),
      activo: activo === 'on' || activo === true || activo === 'true',
      imagen_url
    };
    
    console.log('Datos del plato a guardar:', platoData);
    
    // Si hay un ID, actualizamos el plato existente
    if (platoId && platoId !== 'undefined') {
      console.log('Actualizando plato existente con ID:', platoId);
      const { data, error } = await supabase
        .from('platos')
        .update(platoData)
        .eq('id', platoId)
        .select()
        .single();
        
      if (error) throw error;
      console.log('Plato actualizado:', data);
      return res.json(data);
    } 
    // Si no hay ID, creamos un nuevo plato
    else {
      console.log('Creando nuevo plato');
      const { data, error } = await supabase
        .from('platos')
        .insert([platoData])
        .select()
        .single();
        
      if (error) throw error;
      console.log('Nuevo plato creado:', data);
      return res.status(201).json(data);
    }
  } catch (error) {
    console.error('❌ Error al guardar el plato:', error);
    res.status(500).json({ 
      error: 'Error al guardar el plato',
      details: error.message 
    });
  }
});

// Obtener todos los platos para el panel de administración
app.get('/api/platos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('platos')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    
    // Mapear los campos para el frontend
    const platos = data.map(item => ({
      id: item.id,
      titulo: item.titulo,
      descripcion: item.descripcion,
      valor: item.precio,
      activo: item.activo || false,
      imagen_url: item.imagen_url || ''
    }));
    
    res.json(platos);
  } catch (error) {
    console.error('Error al cargar platos:', error);
    res.status(500).json({ error: 'Error al cargar los platos' });
  }
});

// Obtener platos activos para la vista pública
app.get('/api/platos-activos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('platos')
      .select('*')
      .eq('activo', true);

    if (error) throw error;
    
    // Mapear los campos para la vista pública
    const platos = data.map(item => ({
      id: item.id,
      titulo: item.titulo,
      descripcion: item.descripcion,
      precio: item.precio,
      imagen_url: item.imagen_url || ''
    }));
    
    res.json(platos);
  } catch (error) {
    console.error('Error al obtener platos activos:', error);
    res.status(500).json({ error: 'Error al obtener los platos' });
  }
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la aplicación
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL ? 'Configurada' : 'No configurada'}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  // Mensajes de error amigables
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
