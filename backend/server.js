import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'euforia_secret_key_2024';

// Configurar CORS para permitir credenciales
// CORS_ORIGIN puede tener varias URLs separadas por coma (ej: la de desarrollo y la del frontend desplegado)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentar límites de Express para archivos grandes
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Crear carpeta uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Multer con límites más altos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});

// ==================== ESQUEMAS DE MONGOOSE ====================

// Subesquema para múltiples archivos
const multimediaSchema = new mongoose.Schema({
  url: { type: String, required: true },      // base64 o ruta
  tipo: { type: String, required: true },     // 'image', 'video', 'image/gif', etc.
  nombre: String,
  tamaño: Number,
  thumbnail: String
}, { _id: true });

// Esquema para Anuncios
const announcementSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  contenido: { type: String, required: true },
  categoria: { 
    type: String, 
    required: true,
    enum: ['Educación', 'Derechos Humanos', 'Medio Ambiente', 'Género', 'Evento', 'Investigación', 'Salud', 'Comunidad']
  },
  fecha: { type: Date, default: Date.now },
  fechaEvento: Date,
  archivo: String, // Mantenemos campos antiguos para compatibilidad
  tipoArchivo: String,
  nombreArchivo: String,
  tamañoArchivo: Number,
  destacado: { type: Boolean, default: false },
  estado: { 
    type: String, 
    enum: ['borrador', 'publicado', 'archivado'], 
    default: 'publicado' 
  },
  autor: String,
  etiquetas: [String],
  visualizaciones: { type: Number, default: 0 },
  multimedia: [multimediaSchema]
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);

// Esquema para Recursos
const resourceSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  tipo: { 
    type: String, 
    required: true,
    enum: ['documento', 'video', 'audio', 'enlace', 'imagen']
  },
  categoria: { 
    type: String, 
    required: true,
    enum: ['educacion', 'derechos', 'genero', 'comunidad', 'salud', 'medio_ambiente']
  },
  url: String, // para tipo enlace
  multimedia: [multimediaSchema], // para archivos subidos
  estado: { 
    type: String, 
    enum: ['borrador', 'publicado', 'archivado'], 
    default: 'publicado' 
  },
  autor: String,
  descargas: { type: Number, default: 0 },
  visualizaciones: { type: Number, default: 0 }
}, { timestamps: true });

const Resource = mongoose.model('Resource', resourceSchema);

// Esquema para Actividades
const activitySchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  fecha: Date,
  hora: String,
  duracion: String,
  ubicacion: String,
  tipo: { 
    type: String, 
    required: true,
    enum: ['taller', 'charla', 'evento', 'curso', 'reunion']
  },
  categoria: { 
    type: String, 
    required: true,
    enum: ['educacion', 'derechos', 'genero', 'comunidad', 'salud', 'cultural']
  },
  cupo: Number,
  estado: { 
    type: String, 
    enum: ['programada', 'en-curso', 'completada', 'cancelada'], 
    default: 'programada' 
  },
  multimedia: [multimediaSchema], // materiales de apoyo
  autor: String
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);

// Esquema para Usuarios
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: String,
  role: { type: String, default: 'admin' },
  activo: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ==================== MIDDLEWARE DE AUTENTICACIÓN MEJORADO ====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Headers recibidos:', req.headers);
  console.log('🔐 Authorization header:', authHeader);
  console.log('🔐 Token extraído:', token ? `${token.substring(0, 20)}...` : 'No token');

  if (!token) {
    console.log('❌ No se proporcionó token');
    return res.status(401).json({ 
      message: 'Token de autenticación requerido',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('❌ Error verificando token:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expirado. Por favor, inicie sesión nuevamente.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          message: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(403).json({ 
        message: 'Error de autenticación',
        code: 'AUTH_ERROR'
      });
    }

    try {
      const user = await User.findOne({ 
        username: decoded.username, 
        activo: true 
      });

      if (!user) {
        console.log('❌ Usuario no encontrado o inactivo:', decoded.username);
        return res.status(403).json({ 
          message: 'Usuario no autorizado',
          code: 'USER_NOT_FOUND'
        });
      }

      if (decoded.tokenVersion !== user.tokenVersion) {
        console.log('❌ Token version mismatch');
        return res.status(403).json({ 
          message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
          code: 'TOKEN_VERSION_MISMATCH'
        });
      }

      console.log('✅ Token válido para usuario:', decoded.username);
      req.user = decoded;
      next();
    } catch (dbError) {
      console.error('❌ Error en base de datos durante autenticación:', dbError);
      return res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'DB_ERROR'
      });
    }
  });
};

// ==================== RUTAS PÚBLICAS ====================

// Health Check mejorado
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend de Euforia funcionando',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Ruta de prueba simple (pública)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Obtener anuncios públicos
app.get('/api/announcements', async (req, res) => {
  try {
    const { categoria, destacado, limit } = req.query;
    
    const filter = { estado: 'publicado' };
    if (categoria) filter.categoria = categoria;
    if (destacado === 'true') filter.destacado = true;
    
    const anuncios = await Announcement.find(filter)
      .sort({ fecha: -1 })
      .limit(parseInt(limit) || 50);
    
    res.json(anuncios);
  } catch (error) {
    console.error('Error obteniendo anuncios:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener recursos públicos
app.get('/api/resources', async (req, res) => {
  try {
    const { categoria, tipo, limit } = req.query;
    
    const filter = { estado: 'publicado' };
    if (categoria) filter.categoria = categoria;
    if (tipo) filter.tipo = tipo;
    
    const recursos = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50);
    
    res.json(recursos);
  } catch (error) {
    console.error('Error obteniendo recursos:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener actividades públicas
app.get('/api/activities', async (req, res) => {
  try {
    const { categoria, tipo, estado, limit } = req.query;
    
    // Construir filtro dinámicamente
    const filter = {};
    if (categoria) filter.categoria = categoria;
    if (tipo) filter.tipo = tipo;
    if (estado) {
      // Si se proporciona estado, filtrar por ese estado (puede ser múltiple separado por comas)
      if (estado.includes(',')) {
        filter.estado = { $in: estado.split(',') };
      } else {
        filter.estado = estado;
      }
    }
    // Si no se envía estado, se devuelven todas (sin filtro de estado)
    
    const actividades = await Activity.find(filter)
      .sort({ fecha: 1 }) // orden ascendente por fecha (más próximas primero)
      .limit(parseInt(limit) || 50);
    
    res.json(actividades);
  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== AUTENTICACIÓN MEJORADA ====================

// Login mejorado
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔑 Intento de login para:', username);
    
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Usuario y contraseña son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const user = await User.findOne({ username, activo: true });
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(401).json({ 
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const validPassword = password === user.password;
    
    if (!validPassword) {
      console.log('❌ Contraseña incorrecta para:', username);
      return res.status(401).json({ 
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const tokenPayload = {
      username: user.username,
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET);

    console.log('✅ Login exitoso para:', username);
    
    res.json({ 
      success: true,
      token, 
      user: { 
        username: user.username, 
        role: user.role,
        email: user.email
      },
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      code: 'LOGIN_ERROR'
    });
  }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    message: 'Token válido'
  });
});

// Logout (invalidar token)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (user) {
      user.tokenVersion += 1;
      await user.save();
    }
    
    res.json({ 
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== RUTAS PROTEGIDAS - ANUNCIOS ====================

console.log('🟢 Registrando rutas de anuncios...');

// Crear anuncio
app.post('/api/announcements', authenticateToken, async (req, res) => {
  console.log('📥 POST /api/announcements called by', req.user?.username);
  try {
    console.log('📝 Creando anuncio para usuario:', req.user.username);
    
    const { 
      titulo, 
      contenido, 
      categoria, 
      destacado, 
      estado, 
      fechaEvento,
      archivo,
      tipoArchivo,
      nombreArchivo,
      tamañoArchivo,
      multimedia
    } = req.body;
    
    if (!titulo || !contenido || !categoria) {
      return res.status(400).json({ 
        message: 'Título, contenido y categoría son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    const esGif = nombreArchivo && nombreArchivo.toLowerCase().endsWith('.gif');
    const tipoArchivoFinal = esGif ? 'image/gif' : tipoArchivo;

    const nuevoAnuncio = new Announcement({
      titulo,
      contenido,
      categoria,
      destacado: destacado === true || destacado === 'true',
      estado: estado || 'publicado',
      fechaEvento: fechaEvento ? new Date(fechaEvento) : null,
      archivo,
      tipoArchivo: tipoArchivoFinal,
      nombreArchivo,
      tamañoArchivo,
      multimedia: multimedia || [],
      autor: req.user.username
    });

    await nuevoAnuncio.save();
    console.log('✅ Anuncio creado exitosamente ID:', nuevoAnuncio._id);
    
    res.status(201).json({
      success: true,
      message: 'Anuncio creado exitosamente',
      anuncio: nuevoAnuncio
    });
  } catch (error) {
    console.error('❌ Error creando anuncio:', error);
    
    let statusCode = 400;
    let errorMessage = error.message;
    
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Ya existe un anuncio con ese título';
      statusCode = 409;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      code: 'CREATE_ERROR'
    });
  }
});
console.log('✅ Ruta POST /api/announcements registrada');

// Obtener todos los anuncios (admin)
app.get('/api/admin/announcements', authenticateToken, async (req, res) => {
  console.log('📥 GET /api/admin/announcements called by', req.user?.username);
  try {
    console.log('📋 Obteniendo anuncios admin para:', req.user.username);
    
    const anuncios = await Announcement.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: anuncios.length,
      anuncios
    });
  } catch (error) {
    console.error('Error obteniendo anuncios admin:', error);
    res.status(500).json({ 
      message: error.message,
      code: 'FETCH_ERROR'
    });
  }
});
console.log('✅ Ruta GET /api/admin/announcements registrada');

// Actualizar anuncio
app.put('/api/announcements/:id', authenticateToken, async (req, res) => {
  console.log('📥 PUT /api/announcements/:id called by', req.user?.username);
  try {
    const updateData = { ...req.body };
    updateData.updatedAt = new Date();

    if (updateData.nombreArchivo && updateData.nombreArchivo.toLowerCase().endsWith('.gif')) {
      updateData.tipoArchivo = 'image/gif';
    }

    const anuncio = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!anuncio) {
      return res.status(404).json({ 
        message: 'Anuncio no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Anuncio actualizado exitosamente',
      anuncio
    });
  } catch (error) {
    console.error('Error actualizando anuncio:', error);
    res.status(400).json({ 
      message: error.message,
      code: 'UPDATE_ERROR'
    });
  }
});
console.log('✅ Ruta PUT /api/announcements/:id registrada');

// Eliminar anuncio
app.delete('/api/announcements/:id', authenticateToken, async (req, res) => {
  console.log('📥 DELETE /api/announcements/:id called by', req.user?.username);
  try {
    const anuncio = await Announcement.findByIdAndDelete(req.params.id);
    
    if (!anuncio) {
      return res.status(404).json({ 
        message: 'Anuncio no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.json({ 
      success: true,
      message: 'Anuncio eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando anuncio:', error);
    res.status(500).json({ 
      message: error.message,
      code: 'DELETE_ERROR'
    });
  }
});
console.log('✅ Ruta DELETE /api/announcements/:id registrada');

// ==================== RUTAS PROTEGIDAS - RECURSOS ====================

console.log('🟢 Registrando rutas de recursos...');

// Crear recurso
app.post('/api/resources', authenticateToken, async (req, res) => {
  console.log('📥 POST /api/resources called by', req.user?.username);
  try {
    console.log('📝 Creando recurso para usuario:', req.user.username);
    
    const { 
      titulo, 
      descripcion, 
      tipo, 
      categoria, 
      url,
      multimedia,
      estado 
    } = req.body;
    
    if (!titulo || !descripcion || !tipo || !categoria) {
      return res.status(400).json({ 
        message: 'Título, descripción, tipo y categoría son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    const nuevoRecurso = new Resource({
      titulo,
      descripcion,
      tipo,
      categoria,
      url: url || '',
      multimedia: multimedia || [],
      estado: estado || 'publicado',
      autor: req.user.username
    });

    await nuevoRecurso.save();
    console.log('✅ Recurso creado exitosamente ID:', nuevoRecurso._id);
    
    res.status(201).json({
      success: true,
      message: 'Recurso creado exitosamente',
      recurso: nuevoRecurso
    });
  } catch (error) {
    console.error('❌ Error creando recurso:', error);
    res.status(400).json({ 
      message: error.message,
      code: 'CREATE_ERROR'
    });
  }
});
console.log('✅ Ruta POST /api/resources registrada');

// Obtener todos los recursos (admin)
app.get('/api/admin/resources', authenticateToken, async (req, res) => {
  console.log('📥 GET /api/admin/resources called by', req.user?.username);
  try {
    console.log('📋 Obteniendo recursos admin para:', req.user.username);
    
    const recursos = await Resource.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: recursos.length,
      recursos
    });
  } catch (error) {
    console.error('Error obteniendo recursos admin:', error);
    res.status(500).json({ 
      message: error.message,
      code: 'FETCH_ERROR'
    });
  }
});
console.log('✅ Ruta GET /api/admin/resources registrada');

// Actualizar recurso
app.put('/api/resources/:id', authenticateToken, async (req, res) => {
  console.log('📥 PUT /api/resources/:id called by', req.user?.username);
  try {
    const updateData = { ...req.body };
    delete updateData._id; // evitar conflictos
    updateData.updatedAt = new Date();

    const recurso = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!recurso) {
      return res.status(404).json({ 
        message: 'Recurso no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Recurso actualizado exitosamente',
      recurso
    });
  } catch (error) {
    console.error('Error actualizando recurso:', error);
    res.status(400).json({ 
      message: error.message,
      code: 'UPDATE_ERROR'
    });
  }
});
console.log('✅ Ruta PUT /api/resources/:id registrada');

// Eliminar recurso
app.delete('/api/resources/:id', authenticateToken, async (req, res) => {
  console.log('📥 DELETE /api/resources/:id called by', req.user?.username);
  try {
    const recurso = await Resource.findByIdAndDelete(req.params.id);
    
    if (!recurso) {
      return res.status(404).json({ 
        message: 'Recurso no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.json({ 
      success: true,
      message: 'Recurso eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando recurso:', error);
    res.status(500).json({ 
      message: error.message,
      code: 'DELETE_ERROR'
    });
  }
});
console.log('✅ Ruta DELETE /api/resources/:id registrada');

// ==================== RUTAS PROTEGIDAS - ACTIVIDADES ====================

console.log('🟢 Registrando rutas de actividades...');

// Crear actividad
app.post('/api/activities', authenticateToken, async (req, res) => {
  console.log('📥 POST /api/activities called by', req.user?.username);
  try {
    console.log('📝 Creando actividad para usuario:', req.user.username);
    
    const { 
      titulo, 
      descripcion, 
      fecha, 
      hora, 
      duracion, 
      ubicacion, 
      tipo, 
      categoria, 
      cupo, 
      estado,
      multimedia 
    } = req.body;
    
    if (!titulo || !descripcion || !tipo || !categoria) {
      return res.status(400).json({ 
        message: 'Título, descripción, tipo y categoría son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    const nuevaActividad = new Activity({
      titulo,
      descripcion,
      fecha: fecha ? new Date(fecha) : null,
      hora,
      duracion,
      ubicacion,
      tipo,
      categoria,
      cupo,
      estado: estado || 'programada',
      multimedia: multimedia || [],
      autor: req.user.username
    });

    await nuevaActividad.save();
    console.log('✅ Actividad creada exitosamente ID:', nuevaActividad._id);
    
    res.status(201).json({
      success: true,
      message: 'Actividad creada exitosamente',
      actividad: nuevaActividad
    });
  } catch (error) {
    console.error('❌ Error creando actividad:', error);
    res.status(400).json({ 
      message: error.message,
      code: 'CREATE_ERROR'
    });
  }
});
console.log('✅ Ruta POST /api/activities registrada');

// Obtener todas las actividades (admin)
app.get('/api/admin/activities', authenticateToken, async (req, res) => {
  console.log('📥 GET /api/admin/activities called by', req.user?.username);
  try {
    console.log('📋 Obteniendo actividades admin para:', req.user.username);
    
    const actividades = await Activity.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: actividades.length,
      actividades
    });
  } catch (error) {
    console.error('Error obteniendo actividades admin:', error);
    res.status(500).json({ 
      message: error.message,
      code: 'FETCH_ERROR'
    });
  }
});
console.log('✅ Ruta GET /api/admin/activities registrada');

// Actualizar actividad
app.put('/api/activities/:id', authenticateToken, async (req, res) => {
  console.log('📥 PUT /api/activities/:id called by', req.user?.username);
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();

    const actividad = await Activity.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!actividad) {
      return res.status(404).json({ 
        message: 'Actividad no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Actividad actualizada exitosamente',
      actividad
    });
  } catch (error) {
    console.error('Error actualizando actividad:', error);
    res.status(400).json({ 
      message: error.message,
      code: 'UPDATE_ERROR'
    });
  }
});
console.log('✅ Ruta PUT /api/activities/:id registrada');

// Eliminar actividad
app.delete('/api/activities/:id', authenticateToken, async (req, res) => {
  console.log('📥 DELETE /api/activities/:id called by', req.user?.username);
  try {
    const actividad = await Activity.findByIdAndDelete(req.params.id);
    
    if (!actividad) {
      return res.status(404).json({ 
        message: 'Actividad no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.json({ 
      success: true,
      message: 'Actividad eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando actividad:', error);
    res.status(500).json({ 
      message: error.message,
      code: 'DELETE_ERROR'
    });
  }
});
console.log('✅ Ruta DELETE /api/activities/:id registrada');

// ==================== RUTAS DE DIAGNÓSTICO ====================

// Ruta para verificar autenticación
app.get('/api/debug/auth', authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Ruta para probar sin autenticación
app.get('/api/debug/public', (req, res) => {
  res.json({
    message: 'Esta es una ruta pública',
    timestamp: new Date().toISOString()
  });
});

// ==================== INICIALIZACIÓN DE LA BASE DE DATOS ====================

async function initializeDatabase() {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI no está configurada en el archivo .env');
      console.log('⚠️ Usando base de datos local...');
      await mongoose.connect('mongodb://localhost:27017/euforia');
      console.log('✅ Conectado a MongoDB local');
    } else {
      await mongoose.connect(mongoUri);
      console.log('✅ Conectado a MongoDB Atlas correctamente');
      console.log('📊 Base de datos:', mongoose.connection.name);
      console.log('🔗 Host:', mongoose.connection.host);
    }

    // Crear usuario administrador por defecto si no existe
    const existingUser = await User.findOne({ username: 'admin' });
    if (!existingUser) {
      const adminUser = new User({
        username: 'admin',
        password: 'euforia2024',
        email: 'euforiacddhheducacion@gmail.com',
        role: 'admin',
        activo: true
      });
      await adminUser.save();
      console.log('👤 Usuario administrador creado: admin / euforia2024');
    } else {
      console.log('👤 Usuario administrador ya existe');
    }

    console.log('🎉 Base de datos inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.error('💡 Soluciones posibles:');
    console.error('   1. Verifica tu conexión a internet');
    console.error('   2. Revisa la cadena de conexión en .env');
    console.error('   3. Verifica usuario/contraseña en MongoDB Atlas');
    console.error('   4. Asegúrate de que tu IP está en la whitelist de Atlas');
    console.log('⚠️ Continuando en modo offline/local');
  }
}

// ==================== MANEJO DE ERRORES GLOBAL ====================

app.use((err, req, res, next) => {
  console.error('❌ Error global no manejado:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'El archivo es demasiado grande. Máximo permitido: 500MB',
        code: 'FILE_TOO_LARGE'
      });
    }
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 BACKEND EUFORIA - SERVIDOR REINICIADO');
  console.log('='.repeat(60));
  console.log(`📍 Puerto: http://localhost:${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📁 Debug Auth: http://localhost:${PORT}/api/debug/auth`);
  console.log(`👤 Usuario: admin`);
  console.log(`🔒 Contraseña: euforia2024`);
  console.log('='.repeat(60));
  
  initializeDatabase();
});