// Función para limpiar y optimizar localStorage
export const cleanupLocalStorage = () => {
  const storageKeys = ['euforia_anuncios', 'euforia_resources', 'euforia_activities'];
  
  storageKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Limitar a 10 elementos máximo
        if (parsed.length > 10) {
          const limited = parsed.slice(0, 10);
          localStorage.setItem(key, JSON.stringify(limited));
          console.log(`✅ ${key} limitado a 10 elementos`);
        }
        
        // Remover archivos grandes
        const optimized = parsed.map(item => {
          if (item.archivo && item.archivo.length > 100000) {
            return { ...item, archivo: null, hasLargeFile: true };
          }
          return item;
        });
        
        localStorage.setItem(key, JSON.stringify(optimized));
      }
    } catch (error) {
      console.error(`Error limpiando ${key}:`, error);
    }
  });
  
  // Limpiar sessionStorage de archivos temporales antiguos
  const now = Date.now();
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key.startsWith('temp_file_')) {
      try {
        const timestamp = parseInt(key.split('_')[2]);
        if (now - timestamp > 24 * 60 * 60 * 1000) { // Más de 24 horas
          sessionStorage.removeItem(key);
        }
      } catch (e) {
        sessionStorage.removeItem(key);
      }
    }
  }
};