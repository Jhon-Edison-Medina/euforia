// src/services/cloudinary.js

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'tu_cloud_name';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'euforia_uploads';

/**
 * Sube un archivo (File) a Cloudinary y devuelve la URL segura.
 * @param {File} file - El archivo a subir.
 * @param {Object} options - Opciones adicionales (folder, public_id, etc.).
 * @returns {Promise<string>} - La URL pública del archivo subido.
 */
export const uploadToCloudinary = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  // Opciones adicionales
  if (options.folder) formData.append('folder', options.folder);
  if (options.public_id) formData.append('public_id', options.public_id);
  if (options.tags) formData.append('tags', options.tags);

  // Opciones de transformación (por ejemplo, calidad)
  if (options.quality) formData.append('quality', options.quality);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al subir a Cloudinary');
    }

    const data = await response.json();
    return data.secure_url; // URL pública
  } catch (error) {
    console.error('❌ Error en uploadToCloudinary:', error);
    throw error;
  }
};

/**
 * Sube múltiples archivos en paralelo con límite de concurrencia.
 * @param {File[]} files - Lista de archivos.
 * @param {Object} options - Opciones para cada subida.
 * @param {Function} onProgress - Callback de progreso (recibe índice y total).
 * @returns {Promise<string[]>} - Lista de URLs.
 */
export const uploadMultipleToCloudinary = async (files, options = {}, onProgress) => {
  const BATCH_SIZE = 3;
  const results = [];
  let processed = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(file => uploadToCloudinary(file, options));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    processed += batch.length;
    if (onProgress) onProgress(processed, files.length);
  }
  return results;
};

/**
 * Sube un archivo a Cloudinary y devuelve un objeto listo para guardar
 * en el campo `multimedia` de anuncios/recursos/actividades.
 * @param {File} file - El archivo a subir.
 * @returns {Promise<{url: string, tipo: string, nombre: string, tamaño: number, thumbnail: string}>}
 */
export const subirArchivoMultimedia = async (file) => {
  const secureUrl = await uploadToCloudinary(file);
  const esImagenTransformable = file.type.startsWith('image/') && file.type !== 'image/gif' && file.type !== 'image/svg+xml';

  return {
    url: secureUrl,
    tipo: file.type,
    nombre: file.name,
    tamaño: file.size,
    // Cloudinary genera el thumbnail al vuelo insertando una transformación en la URL
    thumbnail: esImagenTransformable ? secureUrl.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto/') : secureUrl
  };
};