// Sistema de almacenamiento que puede usar localStorage o API
class EuforiaStorage {
  constructor() {
    this.useAPI = false; // Cambiar a true cuando MongoDB esté listo
  }

  // Obtener anuncios
  async getAnnouncements() {
    if (this.useAPI) {
      // Usar API real (cuando MongoDB esté configurado)
      const response = await fetch('http://localhost:5000/api/announcements');
      return await response.json();
    } else {
      // Usar localStorage (por ahora)
      const saved = localStorage.getItem('euforia_announcements');
      return saved ? JSON.parse(saved) : [];
    }
  }

  // Guardar anuncios
  async saveAnnouncements(announcements) {
    if (this.useAPI) {
      // Guardar via API
      // (Implementaremos esto después)
    } else {
      // Guardar en localStorage
      localStorage.setItem('euforia_announcements', JSON.stringify(announcements));
      return true;
    }
  }

  // Más métodos para actividades, recursos, etc.
}

export default new EuforiaStorage();