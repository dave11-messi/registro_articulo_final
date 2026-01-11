import React from 'react';
// IMPORTANTE: Debes tener una imagen llamada 'splash-articulos.svg' 
// en tu carpeta 'src' o 'public'. Si usas otra extensión (.png, .jpg), 
// ajusta la importación.
import illustration from './assets/splash-articulos.svg.png'

function SplashImage() {
  return (
    <div className="splash-card">
      <img 
        src={illustration} 
        alt="Ilustración de investigación, libros y artículos" 
        className="splash-image" 
      />
      <div className="splash-text-content">
        <h2>Gestión de Documentos Científicos</h2>
        <p>
          Utiliza la navegación superior para acceder al **Panel de Solicitudes** (para ver tu historial) o al **Panel de Revisor** (para iniciar la revisión de trabajos pendientes).
        </p>
        <p className="splash-note">
          📖 Artículos Científicos | 🎓 Tesis de Grado y Posgrado
        </p>
      </div>
    </div>
  );
}

export default SplashImage;