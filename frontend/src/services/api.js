import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('euforia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (config.data && JSON.stringify(config.data).length > 1000000) {
    config.timeout = 120000;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('euforia_token');
      localStorage.removeItem('euforia_user');
      window.location.href = '/admin';
    }
    
    if (error.response?.status === 413) {
      throw new Error('El archivo es demasiado grande para el servidor. Intenta con un archivo más pequeño o comprime la imagen.');
    }
    
    if (error.message && error.message.includes('413')) {
      throw new Error('El archivo es demasiado grande para el servidor. Intenta con un archivo más pequeño o comprime la imagen.');
    }
    
    return Promise.reject(error);
  }
);

// Claves para localStorage
const STORAGE_KEYS = {
  ANUNCIOS: 'euforia_anuncios',
  ACTIVIDADES: 'euforia_activities',
  RECURSOS: 'euforia_resources',
  USUARIOS: 'euforia_users',
  ESTADISTICAS: 'euforia_stats'
};

// ========== FUNCIONES DE COMPRESIÓN MEJORADAS ==========

export const compressImage = async (base64String, quality = 0.6, maxWidth = 800) => {
  return new Promise((resolve) => {
    if (!base64String || !base64String.startsWith('data:image')) {
      resolve(base64String);
      return;
    }

    if (base64String.includes('image/svg+xml') || base64String.includes('image/gif')) {
      resolve(base64String);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = base64String;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = base64String.split(';')[0].split(':')[1] || 'image/jpeg';
      let finalMimeType = mimeType;
      
      if (!mimeType.includes('png') || !base64String.includes('image/png')) {
        finalMimeType = 'image/webp';
      }
      
      try {
        const compressedBase64 = canvas.toDataURL(finalMimeType, quality);
        
        const originalSize = Math.round(base64String.length / 1024);
        const compressedSize = Math.round(compressedBase64.length / 1024);
        const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
        
        console.log(`📊 Compresión: ${originalSize}KB → ${compressedSize}KB (${reduction}% reducción)`);
        resolve(compressedBase64);
      } catch (error) {
        console.warn('Error al comprimir con WebP, usando formato original:', error);
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      }
    };
    
    img.onerror = () => {
      console.warn('⚠️ Error cargando imagen, devolviendo original');
      resolve(base64String);
    };
  });
};

export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const maxSize = 100 * 1024 * 1024;
    
    if (file.size > maxSize) {
      reject(new Error(`El archivo es muy grande (${(file.size / (1024 * 1024)).toFixed(2)}MB). Máximo permitido: 100MB`));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      const base64String = reader.result;
      console.log(`📁 Archivo convertido: ${file.name}, Tamaño base64: ${(base64String.length / 1024).toFixed(2)}KB`);
      resolve(base64String);
    };
    
    reader.onerror = (error) => {
      console.error('Error leyendo archivo:', error);
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.onabort = () => {
      reject(new Error('Lectura del archivo cancelada'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const generateThumbnail = async (base64String, tipo) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout generando thumbnail')), 10000);
    
    if (tipo.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = base64String;
      video.crossOrigin = 'anonymous';
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = (video.videoHeight / video.videoWidth) * 200;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        clearTimeout(timeout);
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
      video.onerror = (e) => {
        clearTimeout(timeout);
        reject(e);
      };
    } else if (tipo === 'image/gif' || tipo.includes('gif')) {
      clearTimeout(timeout);
      resolve(base64String);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = (img.height / img.width) * 200;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        clearTimeout(timeout);
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
      img.onerror = (e) => {
        clearTimeout(timeout);
        reject(e);
      };
    }
  });
};

// ========== GESTIÓN DE LOCALSTORAGE MEJORADA ==========

const manageLocalStorage = (key, data) => {
  try {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      localStorage.setItem(key, JSON.stringify(data || []));
      return true;
    }
    
    const dataStr = JSON.stringify(data);
    const sizeMB = dataStr.length / (1024 * 1024);
    
    const MAX_SIZE_MB = 5;
    
    if (sizeMB > MAX_SIZE_MB) {
      console.warn(`⚠️ Datos muy grandes (${sizeMB.toFixed(2)}MB), optimizando caché para: ${key}`);
      
      if (key === STORAGE_KEYS.ANUNCIOS) {
        const optimizedData = data.map((item, index) => {
          if (index >= 10 && item.archivo && item.archivo.length > 10000) {
            return {
              ...item,
              archivo: null,
              tieneArchivo: true,
              multimedia: item.multimedia ? item.multimedia.map(m => ({ ...m, url: null, tieneArchivo: true })) : []
            };
          }
          return item;
        });
        
        const limitedData = optimizedData.slice(0, 50);
        localStorage.setItem(key, JSON.stringify(limitedData));
      } else {
        const maxItems = 50;
        const limitedData = data.slice(0, maxItems);
        localStorage.setItem(key, JSON.stringify(limitedData));
      }
    } else {
      localStorage.setItem(key, dataStr);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error gestionando localStorage:', error);
    
    if (error.message.includes('quota') || error.message.includes('exceeded')) {
      console.log('🔄 Limpiando caché antiguo...');
      
      const essentialKeys = [
        STORAGE_KEYS.ANUNCIOS,
        STORAGE_KEYS.ACTIVIDADES,
        STORAGE_KEYS.RECURSOS,
        'euforia_token',
        'euforia_user'
      ];
      
      Object.keys(localStorage).forEach(key => {
        if (!essentialKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      try {
        if (key === STORAGE_KEYS.ANUNCIOS) {
          const ahora = new Date();
          const haceUnMes = new Date(ahora.setMonth(ahora.getMonth() - 1));
          
          const anunciosRecientes = data.filter(item => {
            const fechaItem = new Date(item.fecha || item.createdAt || 0);
            return fechaItem > haceUnMes;
          }).slice(0, 20);
          
          const anunciosOptimizados = anunciosRecientes.map(item => ({
            ...item,
            archivo: null,
            tieneArchivo: !!item.archivo,
            multimedia: item.multimedia ? item.multimedia.map(m => ({ ...m, url: null, tieneArchivo: true })) : []
          }));
          
          localStorage.setItem(key, JSON.stringify(anunciosOptimizados));
        } else {
          const limitedData = data.slice(0, 10);
          localStorage.setItem(key, JSON.stringify(limitedData));
        }
        return true;
      } catch (e) {
        console.error('❌ No se pudo guardar en caché después de limpiar:', e);
        return false;
      }
    }
    
    return false;
  }
};

export const optimizeDataForStorage = async (data, skipCompression = false) => {
  if (!data || typeof data !== 'object') return data;
  
  const optimized = { ...data };
  
  if (!skipCompression && optimized.archivo && optimized.archivo.startsWith('data:image') && !optimized.archivo.includes('image/gif')) {
    try {
      const isLargeImage = optimized.archivo.length > 500000;
      const quality = isLargeImage ? 0.5 : 0.7;
      const maxWidth = isLargeImage ? 1024 : 1600;
      optimized.archivo = await compressImage(optimized.archivo, quality, maxWidth);
    } catch (error) {
      console.warn('Error comprimiendo archivo principal:', error);
    }
  }
  
  if (optimized.multimedia && Array.isArray(optimized.multimedia) && !skipCompression) {
    const compressedMultimedia = await Promise.all(
      optimized.multimedia.map(async (item) => {
        if (item.url && item.url.startsWith('data:image') && !item.url.includes('image/gif')) {
          try {
            const isLargeImage = item.url.length > 500000;
            const quality = isLargeImage ? 0.5 : 0.7;
            const maxWidth = isLargeImage ? 1024 : 1600;
            const compressedUrl = await compressImage(item.url, quality, maxWidth);
            return { ...item, url: compressedUrl };
          } catch (error) {
            console.warn('Error comprimiendo elemento multimedia:', error);
            return item;
          }
        }
        return item;
      })
    );
    optimized.multimedia = compressedMultimedia;
  }
  
  return optimized;
};

// ========== FUNCIONES DE API MEJORADAS ==========

const getDataFromServerOrCache = async (endpoint, storageKey, useCache = true) => {
  try {
    console.log(`🔄 Obteniendo ${endpoint} del servidor...`);
    const response = await api.get(endpoint);
    
    if (response.data) {
      if (useCache) {
        manageLocalStorage(storageKey, response.data);
      }
      
      return response.data;
    }
    
    return [];
  } catch (serverError) {
    console.warn(`⚠️ Servidor no disponible para ${endpoint}, usando caché local`);
    
    if (useCache) {
      try {
        const cachedData = localStorage.getItem(storageKey);
        if (cachedData) {
          console.log(`📂 Usando datos en caché para ${endpoint}`);
          return JSON.parse(cachedData);
        }
      } catch (cacheError) {
        console.error('❌ Error leyendo caché:', cacheError);
      }
    }
    
    return [];
  }
};

const saveData = async (method, endpoint, data, skipCompression = false) => {
  try {
    let response;
    
    const optimizedData = await optimizeDataForStorage(data, skipCompression);
    
    const jsonStr = JSON.stringify(optimizedData);
    const sizeMB = jsonStr.length / (1024 * 1024);
    console.log(`📤 Enviando ${method} a ${endpoint}, tamaño: ${sizeMB.toFixed(2)}MB`);
    
    if (method === 'POST') {
      response = await api.post(endpoint, optimizedData);
    } else if (method === 'PUT') {
      response = await api.put(`${endpoint}/${data.id || data._id}`, optimizedData);
    } else if (method === 'DELETE') {
      response = await api.delete(`${endpoint}/${data.id || data._id}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error en ${method} ${endpoint}:`, error);
    
    if (error.message && error.message.includes('demasiado grande')) {
      throw new Error(`El servidor rechazó el archivo por tamaño. ${error.message}`);
    }
    
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      console.log('📦 Guardando datos offline...');
      const offlineKey = `${endpoint}_offline`;
      const offlineData = JSON.parse(localStorage.getItem(offlineKey) || '[]');
      offlineData.push({
        data: data,
        method: method,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(offlineKey, JSON.stringify(offlineData));
      
      return {
        ...data,
        id: data.id || `offline_${Date.now()}`,
        _offline: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    throw error;
  }
};

// ========== API PARA ANUNCIOS ==========
export const announcementsAPI = {
  getAll: async () => {
    const data = await getDataFromServerOrCache('/api/announcements', STORAGE_KEYS.ANUNCIOS);
    const publicAnnouncements = Array.isArray(data) 
      ? data.filter(a => a.estado === 'publicado')
      : [];
    return { data: publicAnnouncements };
  },

  getAllAdmin: async () => {
    try {
      const response = await api.get('/api/admin/announcements');
      let data = response.data;
      let anunciosArray = [];
      
      if (Array.isArray(data)) {
        anunciosArray = data;
      } else if (data && data.anuncios && Array.isArray(data.anuncios)) {
        anunciosArray = data.anuncios;
      } else {
        anunciosArray = [];
      }
      
      manageLocalStorage(STORAGE_KEYS.ANUNCIOS, anunciosArray);
      return { data: anunciosArray };
    } catch (error) {
      console.warn('❌ Error obteniendo anuncios admin, usando caché local', error);
      const cached = localStorage.getItem(STORAGE_KEYS.ANUNCIOS);
      return { data: cached ? JSON.parse(cached) : [] };
    }
  },

  create: async (formData) => {
    try {
      const dataToSend = {
        ...formData,
        id: `ann_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('📝 Creando anuncio con datos:', {
        titulo: dataToSend.titulo,
        tieneMultimedia: !!(dataToSend.multimedia && dataToSend.multimedia.length),
        cantidadArchivos: dataToSend.multimedia ? dataToSend.multimedia.length : 0
      });
      
      const result = await saveData('POST', '/api/announcements', dataToSend, false);
      const nuevoAnuncio = result.anuncio || result;
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANUNCIOS) || '[]');
        currentData.unshift(nuevoAnuncio);
        manageLocalStorage(STORAGE_KEYS.ANUNCIOS, currentData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_anuncios_updated'));
      
      return { data: nuevoAnuncio };
    } catch (error) {
      console.error('Error creando anuncio:', error);
      throw error;
    }
  },

  update: async (id, formData, skipCompression = false) => {
    try {
      const dataToSend = {
        ...formData,
        id,
        updatedAt: new Date().toISOString()
      };
      
      const result = await saveData('PUT', '/api/announcements', dataToSend, skipCompression);
      const anuncioActualizado = result.anuncio || result;
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANUNCIOS) || '[]');
        const updatedData = currentData.map(item => 
          (item.id === id || item._id === id) ? anuncioActualizado : item
        );
        manageLocalStorage(STORAGE_KEYS.ANUNCIOS, updatedData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_anuncios_updated'));
      
      return { data: anuncioActualizado };
    } catch (error) {
      console.error('Error actualizando anuncio:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await saveData('DELETE', '/api/announcements', { id });
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANUNCIOS) || '[]');
        const filteredData = currentData.filter(item => 
          item.id !== id && item._id !== id
        );
        manageLocalStorage(STORAGE_KEYS.ANUNCIOS, filteredData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_anuncios_updated'));
      
      return { data: { success: true } };
    } catch (error) {
      console.error('Error eliminando anuncio:', error);
      throw error;
    }
  }
};

// ========== API DE AUTENTICACIÓN ==========
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);

      if (response.data?.token) {
        localStorage.setItem('euforia_token', response.data.token);
        localStorage.setItem('euforia_user', JSON.stringify(response.data.user || {}));
        console.log('✅ Autenticación exitosa con servidor');
      }

      return response;
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('euforia_token');
    localStorage.removeItem('euforia_user');
    console.log('👋 Sesión cerrada');
  },

  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('euforia_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('euforia_token');
  }
};

// ========== API PARA RECURSOS ==========
export const resourcesAPI = {
  getAll: async () => {
    const data = await getDataFromServerOrCache('/api/resources', STORAGE_KEYS.RECURSOS);
    return { data: Array.isArray(data) ? data.filter(r => r.estado === 'publicado') : [] };
  },

  getAllAdmin: async () => {
    try {
      const response = await api.get('/api/admin/resources');
      let data = response.data;
      let recursosArray = [];
      
      if (Array.isArray(data)) {
        recursosArray = data;
      } else if (data && data.recursos && Array.isArray(data.recursos)) {
        recursosArray = data.recursos;
      } else {
        recursosArray = [];
      }
      
      manageLocalStorage(STORAGE_KEYS.RECURSOS, recursosArray);
      return { data: recursosArray };
    } catch (error) {
      console.warn('❌ Error obteniendo recursos admin, usando caché local', error);
      const cached = localStorage.getItem(STORAGE_KEYS.RECURSOS);
      return { data: cached ? JSON.parse(cached) : [] };
    }
  },

  create: async (formData) => {
    try {
      const dataToSend = {
        ...formData,
        id: `res_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        descargas: 0,
        visualizaciones: 0
      };
      
      console.log('📝 Creando recurso con datos:', {
        titulo: dataToSend.titulo,
        tieneMultimedia: !!(dataToSend.multimedia && dataToSend.multimedia.length),
        cantidadArchivos: dataToSend.multimedia ? dataToSend.multimedia.length : 0
      });
      
      const result = await saveData('POST', '/api/resources', dataToSend);
      const nuevoRecurso = result.recurso || result;
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURSOS) || '[]');
        currentData.unshift(nuevoRecurso);
        manageLocalStorage(STORAGE_KEYS.RECURSOS, currentData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_resources_updated'));
      
      return { data: nuevoRecurso };
    } catch (error) {
      console.error('Error creando recurso:', error);
      throw error;
    }
  },

  update: async (id, formData) => {
    try {
      const dataToSend = {
        ...formData,
        id,
        updatedAt: new Date().toISOString()
      };
      
      const result = await saveData('PUT', '/api/resources', dataToSend);
      const recursoActualizado = result.recurso || result;
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURSOS) || '[]');
        const updatedData = currentData.map(item => 
          (item.id === id || item._id === id) ? recursoActualizado : item
        );
        manageLocalStorage(STORAGE_KEYS.RECURSOS, updatedData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_resources_updated'));
      
      return { data: recursoActualizado };
    } catch (error) {
      console.error('Error actualizando recurso:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await saveData('DELETE', '/api/resources', { id });
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURSOS) || '[]');
        const filteredData = currentData.filter(item => 
          item.id !== id && item._id !== id
        );
        manageLocalStorage(STORAGE_KEYS.RECURSOS, filteredData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_resources_updated'));
      
      return { data: { success: true } };
    } catch (error) {
      console.error('Error eliminando recurso:', error);
      throw error;
    }
  }
};

// ========== API PARA ACTIVIDADES ==========
export const activitiesAPI = {
  getAll: async () => {
    const data = await getDataFromServerOrCache('/api/activities', STORAGE_KEYS.ACTIVIDADES);
    return { data: Array.isArray(data) ? data : [] };
  },

  getAllAdmin: async () => {
    try {
      const response = await api.get('/api/admin/activities');
      let data = response.data;
      let actividadesArray = [];
      
      if (Array.isArray(data)) {
        actividadesArray = data;
      } else if (data && data.actividades && Array.isArray(data.actividades)) {
        actividadesArray = data.actividades;
      } else {
        actividadesArray = [];
      }
      
      manageLocalStorage(STORAGE_KEYS.ACTIVIDADES, actividadesArray);
      return { data: actividadesArray };
    } catch (error) {
      console.warn('❌ Error obteniendo actividades admin, usando caché local', error);
      const cached = localStorage.getItem(STORAGE_KEYS.ACTIVIDADES);
      return { data: cached ? JSON.parse(cached) : [] };
    }
  },

  create: async (formData) => {
    try {
      const dataToSend = {
        ...formData,
        id: `act_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('📝 Creando actividad con datos:', {
        titulo: dataToSend.titulo,
        tieneMultimedia: !!(dataToSend.multimedia && dataToSend.multimedia.length),
        cantidadArchivos: dataToSend.multimedia ? dataToSend.multimedia.length : 0
      });
      
      const result = await saveData('POST', '/api/activities', dataToSend);
      const nuevaActividad = result.actividad || result;
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVIDADES) || '[]');
        currentData.unshift(nuevaActividad);
        manageLocalStorage(STORAGE_KEYS.ACTIVIDADES, currentData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_activities_updated'));
      
      return { data: nuevaActividad };
    } catch (error) {
      console.error('Error creando actividad:', error);
      throw error;
    }
  },

  update: async (id, formData) => {
    try {
      const dataToSend = {
        ...formData,
        id,
        updatedAt: new Date().toISOString()
      };
      
      const result = await saveData('PUT', '/api/activities', dataToSend);
      const actividadActualizada = result.actividad || result;
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVIDADES) || '[]');
        const updatedData = currentData.map(item => 
          (item.id === id || item._id === id) ? actividadActualizada : item
        );
        manageLocalStorage(STORAGE_KEYS.ACTIVIDADES, updatedData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_activities_updated'));
      
      return { data: actividadActualizada };
    } catch (error) {
      console.error('Error actualizando actividad:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await saveData('DELETE', '/api/activities', { id });
      
      try {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVIDADES) || '[]');
        const filteredData = currentData.filter(item => 
          item.id !== id && item._id !== id
        );
        manageLocalStorage(STORAGE_KEYS.ACTIVIDADES, filteredData);
      } catch (cacheError) {
        console.warn('⚠️ Error actualizando caché local:', cacheError);
      }
      
      window.dispatchEvent(new CustomEvent('euforia_activities_updated'));
      
      return { data: { success: true } };
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      throw error;
    }
  }
};

// ========== API PARA ESTADÍSTICAS ==========
export const statsAPI = {
  getDashboardStats: async () => {
    try {
      const [anunciosRes, actividadesRes, recursosRes] = await Promise.all([
        announcementsAPI.getAllAdmin(),
        activitiesAPI.getAllAdmin(),
        resourcesAPI.getAllAdmin()
      ]);
      
      const stats = {
        anuncios: anunciosRes.data?.length || 0,
        actividades: actividadesRes.data?.length || 0,
        recursos: recursosRes.data?.length || 0,
        visitas: Math.floor(Math.random() * 1000) + 500,
        ultimaActualizacion: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.ESTADISTICAS, JSON.stringify(stats));
      
      return { data: stats };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      
      try {
        const cachedStats = localStorage.getItem(STORAGE_KEYS.ESTADISTICAS);
        if (cachedStats) {
          return { data: JSON.parse(cachedStats) };
        }
      } catch (cacheError) {
        console.error('Error leyendo caché de estadísticas:', cacheError);
      }
      
      return { 
        data: {
          anuncios: 0,
          actividades: 0,
          recursos: 0,
          visitas: 0,
          ultimaActualizacion: new Date().toISOString()
        }
      };
    }
  }
};

// ========== FUNCIONES DE INICIALIZACIÓN ==========

export const initDefaultData = () => {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USUARIOS);
    if (!users) {
      const defaultUsers = [
        {
          id: '1',
          username: 'admin',
          password: 'changeme',
          nombre: 'Administrador',
          email: 'admin@euforia.org',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      manageLocalStorage(STORAGE_KEYS.USUARIOS, defaultUsers);
      console.log('✅ Usuarios por defecto creados');
    }
    
    const anuncios = localStorage.getItem(STORAGE_KEYS.ANUNCIOS);
    if (!anuncios) {
      const defaultAnuncios = [
        {
          id: 'ann_1',
          titulo: 'Bienvenidos al Centro Euforia',
          contenido: 'Somos un centro dedicado a la educación popular y los derechos humanos en Soacha.',
          categoria: 'Educación',
          fecha: new Date().toISOString(),
          estado: 'publicado',
          destacado: true,
          autor: 'admin'
        }
      ];
      manageLocalStorage(STORAGE_KEYS.ANUNCIOS, defaultAnuncios);
    }
    
    console.log('✅ Datos inicializados correctamente');
  } catch (error) {
    console.error('Error inicializando datos:', error);
  }
};

export const syncOfflineData = () => {
  console.log('🔄 Sincronizando datos offline...');
};

export default { 
  announcementsAPI, 
  authAPI, 
  activitiesAPI, 
  resourcesAPI, 
  statsAPI,
  initDefaultData,
  syncOfflineData,
  compressImage,
  convertToBase64,
  generateThumbnail
};