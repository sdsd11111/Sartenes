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

// Configuración de CORS para desarrollo y producción
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
  ? [
      'https://sartenes.vercel.app',
      'https://sartenes-*.vercel.app',
      'https://sartenes-git-*',
      'https://sartenes-*-sdsd11111.vercel.app'
    ]
  : [
      'http://localhost:3000',
      'http://localhost:9000',
      'http://127.0.0.1:9000',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];

// Configuración de CORS
const corsOptions = {
  origin: function(origin, callback) {
    // En desarrollo, permitir cualquier origen
    if (!isProduction) return callback(null, true);
    
    // En producción, verificar orígenes permitidos
    if (!origin || allowedOrigins.some(allowed => 
      origin === allowed || 
      origin.match(new RegExp(`^https?://${allowed.replace('*', '.*')}$`))
    )) {
      return callback(null, true);
    }
    
    console.log('Origen no permitido:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
};

// Aplicar CORS a todas las rutas
app.use(cors(corsOptions));

// Manejar preflight requests
app.options('*', cors(corsOptions));

// Configuración de archivos estáticos
const publicPath = path.join(__dirname, 'public');

// Crear directorio público si no existe
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
}

// Configuración de caché para archivos estáticos
const staticOptions = {
  setHeaders: (res, path) => {
    // Configurar cabeceras de caché para archivos estáticos
    if (path.match(/\.(js|css|json|xml)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Configurar tipos MIME
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.woff')) {
      res.setHeader('Content-Type', 'font/woff');
    } else if (path.endsWith('.woff2')) {
      res.setHeader('Content-Type', 'font/woff2');
    } else if (path.endsWith('.ttf')) {
      res.setHeader('Content-Type', 'font/ttf');
    } else if (path.endsWith('.eot')) {
      res.setHeader('Content-Type', 'application/vnd.ms-fontobject');
    }
  }
};

// Servir archivos estáticos desde la carpeta public
app.use(express.static(publicPath, staticOptions));

// En producción, también servir archivos estáticos desde la raíz
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(__dirname, staticOptions));
}

// Ruta para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV || 'development',
    supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  });
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

// Eliminar un plato
app.delete('/api/platos/:id', async (req, res) => {
  try {
    const platoId = req.params.id;
    if (!platoId) {
      return res.status(400).json({ error: 'Se requiere el ID del plato' });
    }

    console.log('Eliminando plato con ID:', platoId);
    
    // Primero obtenemos el plato para poder eliminar su imagen si existe
    const { data: plato, error: fetchError } = await supabase
      .from('platos')
      .select('*')
      .eq('id', platoId)
      .single();

    if (fetchError) throw fetchError;
    
    // Si el plato tiene una imagen, intentamos eliminarla
    if (plato && plato.imagen_url) {
      try {
        const imagePath = path.join(__dirname, 'public', plato.imagen_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('Imagen eliminada:', imagePath);
        }
      } catch (fileError) {
        console.error('Error al eliminar la imagen del plato:', fileError);
        // Continuamos con la eliminación del registro aunque falle la eliminación de la imagen
      }
    }
    
    // Eliminamos el registro de la base de datos
    const { error: deleteError } = await supabase
      .from('platos')
      .delete()
      .eq('id', platoId);

    if (deleteError) throw deleteError;
    
    console.log('Plato eliminado exitosamente');
    res.status(200).json({ message: 'Plato eliminado correctamente' });
    
  } catch (error) {
    console.error('❌ Error al eliminar el plato:', error);
    res.status(500).json({ 
      error: 'Error al eliminar el plato',
      details: error.message 
    });
  }
});

// Actualizar un plato existente
app.put('/api/platos/:id', upload.single('imagen'), async (req, res) => {
  let oldImagePath = null;
  
  try {
    const platoId = req.params.id;
    if (!platoId) {
      return res.status(400).json({ error: 'Se requiere el ID del plato' });
    }

    console.log('Actualizando plato con ID:', platoId);
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file);
    
    const { titulo, descripcion, valor, activo, imagen_url: imagenUrlFromBody } = req.body;
    
    // Validar campos requeridos
    if (!titulo || !valor) {
      return res.status(400).json({ 
        error: 'Los campos título y valor son obligatorios' 
      });
    }
    
    // Obtener el plato actual para manejar la imagen anterior si es necesario
    const { data: existingPlato, error: fetchError } = await supabase
      .from('platos')
      .select('*')
      .eq('id', platoId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Inicializar datos del plato
    const platoData = { 
      titulo, 
      descripcion: descripcion || '', 
      precio: parseFloat(valor),
      activo: activo === 'on' || activo === true || activo === 'true',
    };
    
    // Manejo de la imagen
    if (req.file) {
      // Si se sube una nueva imagen
      platoData.imagen_url = '/images/platos/' + req.file.filename;
      
      // Guardar la ruta de la imagen anterior para eliminarla después
      if (existingPlato && existingPlato.imagen_url) {
        oldImagePath = path.join(__dirname, 'public', existingPlato.imagen_url);
      }
    } else if (imagenUrlFromBody === '' || imagenUrlFromBody === null) {
      // Si se envía una cadena vacía o null, eliminar la imagen
      platoData.imagen_url = null;
      
      // Guardar la ruta de la imagen anterior para eliminarla después
      if (existingPlato && existingPlato.imagen_url) {
        oldImagePath = path.join(__dirname, 'public', existingPlato.imagen_url);
      }
    }
    // Si no hay cambios en la imagen, mantener la existente
    
    console.log('Actualizando plato con datos:', platoData);
    
    // Actualizar el plato en la base de datos
    const { data: updatedPlato, error: updateError } = await supabase
      .from('platos')
      .update(platoData)
      .eq('id', platoId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    // Si la actualización fue exitosa y hay una imagen anterior, eliminarla
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
        console.log('Imagen anterior eliminada:', oldImagePath);
      } catch (fileError) {
        console.error('Error al eliminar la imagen anterior:', fileError);
        // No fallamos la operación si no se puede eliminar la imagen anterior
      }
    }
    
    console.log('Plato actualizado exitosamente:', updatedPlato);
    res.json(updatedPlato);
    
  } catch (error) {
    console.error('❌ Error al actualizar el plato:', error);
    
    // Si hubo un error y se subió un archivo, eliminarlo
    if (req.file) {
      const tempPath = path.join(__dirname, 'public', 'images', 'platos', req.file.filename);
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
          console.log('Archivo temporal eliminado debido a un error:', tempPath);
        } catch (fileError) {
          console.error('Error al eliminar el archivo temporal:', fileError);
        }
      }
    }
    
    res.status(500).json({ 
      error: 'Error al actualizar el plato',
      details: error.message 
    });
  }
});

// Obtener un plato por ID
app.get('/api/platos/:id', async (req, res) => {
  try {
    const platoId = req.params.id;
    if (!platoId) {
      return res.status(400).json({ error: 'Se requiere el ID del plato' });
    }
    
    console.log('Obteniendo plato con ID:', platoId);
    
    const { data: plato, error } = await supabase
      .from('platos')
      .select('*')
      .eq('id', platoId)
      .single();
      
    if (error) throw error;
    
    if (!plato) {
      return res.status(404).json({ error: 'Plato no encontrado' });
    }
    
    console.log('Plato encontrado:', plato);
    res.json(plato);
    
  } catch (error) {
    console.error('❌ Error al obtener el plato:', error);
    res.status(500).json({ 
      error: 'Error al obtener el plato',
      details: error.message 
    });
  }
});

// Obtener todos los platos para el panel de administración
app.get('/api/platos', async (req, res) => {
  try {
    console.log('Solicitando lista de platos...');
    
    const { data, error } = await supabase
      .from('platos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error en la consulta a Supabase:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data)) {
      console.warn('La respuesta de Supabase no es un arreglo:', data);
      return res.json([]);
    }
    
    console.log(`Se encontraron ${data.length} platos`);
    
    // Mapear los campos para el frontend
    const platos = data.map(item => ({
      id: item.id,
      titulo: item.titulo || 'Sin título',
      descripcion: item.descripcion || '',
      valor: item.precio || 0,
      activo: item.activo !== false, // Por defecto true si no está definido
      imagen_url: item.imagen_url || '',
      // Incluir la fecha de creación para ordenamiento adicional si es necesario
      creado: item.created_at || new Date().toISOString()
    }));
    
    // Ordenar por ID de forma descendente para mostrar los más recientes primero
    platos.sort((a, b) => b.id - a.id);
    
    res.json(platos);
    
  } catch (error) {
    console.error('❌ Error al cargar platos:', error);
    res.status(500).json({ 
      error: 'Error al cargar los platos',
      details: error.message 
    });
  }
});

// Obtener platos activos para la vista pública
app.get('/api/platos-activos', async (req, res) => {
  try {
    console.log('Solicitando platos activos...');
    
    const { data, error } = await supabase
      .from('platos')
      .select('*')
      .eq('activo', true)
      .order('id', { ascending: false }); // Ordenar por ID descendente para mostrar los más recientes primero

    if (error) {
      console.error('Error en la consulta a Supabase:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data)) {
      console.warn('La respuesta de Supabase no es un arreglo:', data);
      return res.json([]);
    }
    
    console.log(`Se encontraron ${data.length} platos activos`);
    
    // Mapear los campos para la vista pública
    const platos = data.map(item => ({
      id: item.id,
      titulo: item.titulo || 'Sin título',
      descripcion: item.descripcion || '',
      precio: item.precio || 0,
      imagen_url: item.imagen_url || '',
      // Asegurarse de que la URL de la imagen sea accesible
      imagen_url_completa: item.imagen_url 
        ? item.imagen_url.startsWith('http') 
          ? item.imagen_url 
          : `${req.protocol}://${req.get('host')}${item.imagen_url}`
        : ''
    }));
    
    // Ordenar por ID de forma descendente para mostrar los más recientes primero
    platos.sort((a, b) => b.id - a.id);
    
    res.json(platos);
    
  } catch (error) {
    console.error('❌ Error al obtener platos activos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los platos',
      details: error.message 
    });
  }
});

// Ruta para el panel de administración
app.get('/admin*', (req, res) => {
  // Try to serve from admin directory first (development)
  const adminPath = path.join(__dirname, 'admin', 'index.html');
  const publicAdminPath = path.join(__dirname, 'public', 'admin', 'index.html');
  
  // Check if the file exists in either location
  const fileToServe = fs.existsSync(publicAdminPath) ? publicAdminPath : 
                     fs.existsSync(adminPath) ? adminPath : null;
  
  if (!fileToServe) {
    console.error('No se pudo encontrar el archivo del panel de administración en ninguna ubicación');
    return res.status(404).send('Panel de administración no encontrado');
  }
  
  console.log(`Sirviendo panel de administración desde: ${fileToServe}`);
  res.sendFile(fileToServe, (err) => {
    if (err) {
      console.error('Error al cargar el panel de administración:', err);
      res.status(500).send('Error al cargar el panel de administración');
    }
  });
});

// Servir archivos estáticos para rutas no manejadas por la API
app.use((req, res, next) => {
  // Si la solicitud comienza con /api, devolver 404
  if (req.path.startsWith('/api/')) {
    console.warn(`Ruta API no encontrada: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ 
      error: 'Endpoint no encontrado',
      path: req.path 
    });
  }
  
  // Si no es una ruta de API, servir archivos estáticos
  next();
});

// Ruta para la página principal
app.get('*', (req, res, next) => {
  // Si es una ruta de API, continuar al siguiente middleware
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Si es un archivo estático, continuar al siguiente middleware
  if (req.path.match(/\.(js|css|json|xml|jpg|jpeg|png|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  
  // Intentar servir el archivo solicitado
  const filePath = path.join(publicPath, req.path);
  
  // Si el archivo existe, servirlo
  if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
    return res.sendFile(filePath);
  }
  
  // Si no es un archivo, servir el index.html (para SPA)
  const indexPath = path.join(publicPath, 'index.html');
  
  // Verificar si el archivo index.html existe
  if (!fs.existsSync(indexPath)) {
    console.error('Archivo index.html no encontrado en:', indexPath);
    return res.status(500).send('Error interno del servidor: archivo de inicio no encontrado');
  }
  
  // Enviar el archivo index.html
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error al cargar la página principal:', err);
      res.status(500).send('Error al cargar la página principal');
    }
  });
});

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  
  // Si los encabezados ya se enviaron, delegar al manejador de errores predeterminado de Express
  if (res.headersSent) {
    return next(err);
  }
  
  // Enviar respuesta de error
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  const host = server.address().address;
  const port = server.address().port;
  const env = process.env.NODE_ENV || 'development';
  
  console.log('='.repeat(60));
  console.log(`🚀 Servidor iniciado en http://${host}:${port}`);
  console.log(`🌍 Entorno: ${env}`);
  console.log(`🔗 Supabase: ${process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`📂 Directorio público: ${path.join(__dirname, 'public')}`);
  console.log(`📂 Directorio de imágenes: ${path.join(__dirname, 'public', 'images', 'platos')}`);
  console.log('='.repeat(60));
  
  // Verificar directorios importantes
  const dirsToCheck = [
    { path: path.join(__dirname, 'public'), name: 'Público' },
    { path: path.join(__dirname, 'public', 'images', 'platos'), name: 'Imágenes de platos' },
    { path: path.join(__dirname, 'admin'), name: 'Admin' }
  ];
  
  dirsToCheck.forEach(dir => {
    const exists = fs.existsSync(dir.path);
    const writable = exists ? (fs.statSync(dir.path).mode & 0o200) !== 0 : false;
    console.log(`📂 ${dir.name}: ${exists ? '✅ Existe' : '❌ No existe'} ${exists ? (writable ? '(Escritura habilitada)' : '(Solo lectura)') : ''}`);
  });
  
  console.log('='.repeat(60));
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  // Mensajes de error amigables
  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requiere privilegios elevados`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} ya está en uso`);
      console.log(`💡 Intenta usar un puerto diferente configurando la variable de entorno PORT`);
      process.exit(1);
      break;
    default:
      console.error('❌ Error desconocido:', error);
      throw error;
  }
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  console.log('\n🔽 Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('👋 Servidor cerrado');
    process.exit(0);
  });
  
  // Forzar cierre después de 5 segundos si es necesario
  setTimeout(() => {
    console.error('⚠️ Forzando cierre del servidor...');
    process.exit(1);
  }, 5000);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('⚠️ Excepción no capturada:', error);
  // No salir del proceso en desarrollo para permitir la depuración
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Manejo de promesas rechazadas no manejadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promesa rechazada no manejada:', reason);
  // Opcional: registrar el error o cerrar recursos
});
