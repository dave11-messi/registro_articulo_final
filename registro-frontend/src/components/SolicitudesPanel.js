import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// URL base de la API de Solicitudes
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/solicitudes/';

// Opciones de trabajo (deben coincidir con tu models.py)
const TIPO_TRABAJO_CHOICES = [
  { value: 'ART', label: 'Artículo Científico' },
  { value: 'TES_G', label: 'Tesis de Grado' },
  { value: 'TES_P', label: 'Tesis de Posgrado' },
];

// ----------------------------------------------------
// 💡 FUNCIÓN AUXILIAR PARA LA DESCARGA
// ----------------------------------------------------
const handleDownloadPDF = (solicitudId, token) => {
    // 1. Construir la URL completa (usando la ruta que definimos en urls.py)
    const downloadEndpoint = `/api/v1/solicitudes/${solicitudId}/descargar_pdf/`;
    const downloadUrl = `http://127.0.0.1:8000${downloadEndpoint}?auth_token=${token}`; // Asegúrate de que el puerto sea el 8000

    // 2. Abrir la URL en una nueva pestaña. 
    // Esto hace que el navegador reciba la respuesta application/pdf y fuerce la descarga.
    window.open(downloadUrl, '_blank');
};
// ----------------------------------------------------


function SolicitudesPanel({ token, user }) { 
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para el formulario de nueva solicitud
  const [newSolicitud, setNewSolicitud] = useState({
    titulo: '',
    resumen: '',
    tipo_trabajo: 'ART', // Valor por defecto
  });
  const [creationError, setCreationError] = useState(null);

  // ----------------------------------------------------
  //  FUNCIÓN PARA OBTENER SOLICITUDES DEL USUARIO
  // ----------------------------------------------------
  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const config = {
        headers: {
          'Authorization': `Token ${token}`,
        },
      };

      // Petición al endpoint personalizado /mis_solicitudes/
      const response = await axios.get(`${API_BASE_URL}mis_solicitudes/`, config);
      
      setSolicitudes(response.data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
      setError('No se pudieron cargar tus solicitudes. Asegúrate de que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  // Manejo de cambios en el formulario de creación
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSolicitud({
      ...newSolicitud,
      [name]: value,
    });
  };

  // Manejo de envío del formulario de creación
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreationError(null);

    try {
      const config = {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      // La creación usa el endpoint CRUD principal
      await axios.post(API_BASE_URL, newSolicitud, config);
      
      // Limpiar formulario y recargar lista
      setNewSolicitud({ titulo: '', resumen: '', tipo_trabajo: 'ART' });
      fetchSolicitudes();
      
    } catch (err) {
      console.error("Error al crear solicitud:", err.response ? err.response.data : err);
      let errorMessage = 'Error al crear la solicitud. Verifica los campos.';
      if (err.response && err.response.data) {
          errorMessage += ' Detalles: ' + JSON.stringify(err.response.data);
      }
      setCreationError(errorMessage);
    }
  };

  if (loading) return <div>Cargando tus solicitudes...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      {/* ------------------------------------------- */}
      {/* ✅ FORMULARIO DE CREACIÓN */}
      {/* ------------------------------------------- */}
      <form onSubmit={handleCreateSubmit} className="creation-form">
        <h2>Crear Nueva Solicitud</h2>
        
        <label>Título:</label>
        <input
          type="text"
          name="titulo"
          value={newSolicitud.titulo}
          onChange={handleInputChange}
          required
        />
        
        <label>Tipo de Trabajo:</label>
        <select
          name="tipo_trabajo"
          value={newSolicitud.tipo_trabajo}
          onChange={handleInputChange}
          required
        >
          {TIPO_TRABAJO_CHOICES.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <label>Resumen:</label>
        <textarea
          name="resumen"
          value={newSolicitud.resumen}
          onChange={handleInputChange}
          rows="4"
          required
        ></textarea>

        <button type="submit">Enviar Solicitud</button>
        {creationError && <p style={{ color: 'red' }}>{creationError}</p>}
      </form>
      
      <hr />
      
      <h2>Mis Solicitudes ({solicitudes.length})</h2>
      {solicitudes.length === 0 ? (
        <p>No tienes solicitudes registradas. ¡Crea una!</p>
      ) : (
        <ul className="solicitud-list">
          {solicitudes.map((sol) => (
            <li key={sol.id} className={`solicitud-item estado-${sol.estado.toLowerCase()}`}>
              <h3>{sol.titulo}</h3>
              <p>Tipo: {sol.tipo_trabajo}</p>
              <p>Estado: <strong>{sol.estado.toUpperCase()}</strong></p>
              <p>Fecha: {new Date(sol.fecha_creacion).toLocaleDateString()}</p>
              
              {/* ------------------------------------------- */}
              {/* ⬇️ BOTÓN DE DESCARGA PDF - AÑADIDO AQUÍ ⬇️ */}
              {/* ------------------------------------------- */}
              <button
                onClick={() => handleDownloadPDF(sol.id, token)}
                // Puede añadir una condición si solo quiere que se pueda descargar 
                // en ciertos estados, por ejemplo:
                // disabled={!['aprobada', 'rechazada', 'en_revision'].includes(sol.estado)}
                style={{
                    marginTop: '10px', 
                    backgroundColor: '#1E90FF', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 12px', 
                    cursor: 'pointer'
                }}
              >
                📥 Descargar Solicitud PDF
              </button>
              {/* ------------------------------------------- */}
              
              <details>
                    <summary>Ver Resumen y Revisiones ({sol.revisiones.length})</summary>
                    <p>{sol.resumen}</p>
                    {sol.revisiones && sol.revisiones.length > 0 && (
                        <div style={{ marginTop: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                        <h4>Detalles de Revisión:</h4>
                        {sol.revisiones.map((rev, index) => (
                            <div key={index} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '5px' }}>
                            <p>✍️ **Revisor:** {rev.revisor}</p>
                            <p>📝 **Recomendación:** **{rev.recomendacion}**</p>
                            <p>💬 **Comentarios:** {rev.comentarios || 'No hay comentarios.'}</p>
                            </div>
                        ))}
                        </div>
                    )}
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SolicitudesPanel;