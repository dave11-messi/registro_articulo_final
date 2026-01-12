import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ----------------------------------------------------
// ✅ CORRECCIÓN CLAVE: USAR VARIABLE DE ENTORNO
// ----------------------------------------------------
const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API_BASE_URL = `${BASE_URL}/api/v1/solicitudes/`;
// ----------------------------------------------------

// Opciones de trabajo (deben coincidir con tu models.py)
const TIPO_TRABAJO_CHOICES = {
    'ART': 'Artículo Científico',
    'TES_G': 'Tesis de Grado',
    'TES_P': 'Tesis de Posgrado',
};

// ----------------------------------------------------
// 💡 FUNCIÓN AUXILIAR PARA LA DESCARGA (CORREGIDA)
// ----------------------------------------------------
const handleDownloadPDF = (solicitudId, token) => {
    const downloadEndpoint = `/api/v1/solicitudes/${solicitudId}/descargar_pdf/`;
    // Usamos BASE_URL en lugar de la URL codificada:
    const downloadUrl = `${BASE_URL}${downloadEndpoint}?auth_token=${token}`; 
    window.open(downloadUrl, '_blank');
};
// ----------------------------------------------------


function RevisorPanel({ token }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  
  // Estado para manejar el formulario de revisión
  const [revisionData, setRevisionData] = useState({
    recomendacion: '',
    comentarios: '',
    solicitudId: null, // Para saber a qué solicitud se aplica la revisión
  });

  // ----------------------------------------------------
  //  FUNCIÓN PARA OBTENER TODAS LAS SOLICITUDES
  // ----------------------------------------------------
  const fetchAllSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
          'Authorization': `Token ${token}`,
        },
      };

      const response = await axios.get(API_BASE_URL, config);
      
      setSolicitudes(response.data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
      setError('No se pudieron cargar todas las solicitudes. ¿Tienes permisos de administrador/revisor?');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllSolicitudes();
  }, [fetchAllSolicitudes]);


  // ----------------------------------------------------
  //  FUNCIÓN PARA ELIMINAR SOLICITUDES FINALIZADAS (APROBADA O RECHAZADA)
  // ----------------------------------------------------
  const handleDeleteSolicitud = async (solicitudId, titulo) => {
    if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR la solicitud finalizada: "${titulo}" (ID: ${solicitudId})? Esta acción es permanente.`)) {
        return;
    }

    try {
        const config = {
            headers: {
                'Authorization': `Token ${token}`,
            },
        };
        // Llama al NUEVO endpoint DELETE
        await axios.delete(`${API_BASE_URL}${solicitudId}/eliminar_finalizada/`, config);
        
        // Actualizar la lista: quitar la solicitud eliminada
        setSolicitudes(prevSolicitudes => 
            prevSolicitudes.filter(sol => sol.id !== solicitudId)
        );
        alert(`La solicitud "${titulo}" ha sido eliminada exitosamente.`);

    } catch (err) {
        console.error("Error al eliminar solicitud:", err.response ? err.response.data : err);
        alert(`Error al intentar eliminar la solicitud: ${err.response?.data?.detail || 'Error desconocido.'}`);
    }
  };


  // ----------------------------------------------------
  //  FUNCIÓN CLAVE: SELECCIONAR SOLICITUD PARA REVISIÓN (CON SCROLL)
  // ----------------------------------------------------
  const handleSelectForReview = (solicitudId) => {
    setRevisionData({
        recomendacion: '', 
        comentarios: '', 
        solicitudId,
    });
    
    // Desplazamiento suave a la sección del formulario
    const formSection = document.getElementById('review-form-section');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  // ----------------------------------------------------
  //  FUNCIÓN PARA ENVIAR LA REVISIÓN
  // ----------------------------------------------------
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!revisionData.solicitudId || !revisionData.recomendacion) {
        setSubmissionError('Debe seleccionar una solicitud y una recomendación.');
        return;
    }

    try {
      const config = {
          headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
          },
      };

      const URL = `${API_BASE_URL}${revisionData.solicitudId}/add_revision/`;
      
      const payload = {
        recomendacion: revisionData.recomendacion,
        comentarios: revisionData.comentarios,
      };

      await axios.post(URL, payload, config);
      
      // Limpiar formulario y recargar lista de solicitudes
      setRevisionData({ recomendacion: '', comentarios: '', solicitudId: null });
      fetchAllSolicitudes();
      alert('Revisión enviada exitosamente. El estado de la solicitud ha sido actualizado.');
      
    } catch (err) {
        console.error("Error al enviar revisión:", err.response ? err.response.data : err);
        setSubmissionError(`Error al enviar revisión: ${err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error desconocido.'}`);
    }
  };


  if (loading) return <div>Cargando solicitudes para revisión...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Panel de Revisor: Todas las Solicitudes ({solicitudes.length})</h2>
      
      <p style={{marginBottom: '20px', color: 'var(--color-secondary)'}}>
        Aquí se muestran todas las solicitudes pendientes, en revisión, aprobadas y rechazadas.
      </p>

      {solicitudes.length === 0 ? (
        <p>No hay solicitudes pendientes de revisión.</p>
      ) : (
        <ul className="solicitud-list">
          {solicitudes.map((sol) => (
            <li key={sol.id} className={`solicitud-item estado-${sol.estado}`}>
              <h3>{sol.titulo}</h3>
              <p>Solicitante: **{sol.solicitante}**</p>
              <p>Tipo: {TIPO_TRABAJO_CHOICES[sol.tipo_trabajo] || sol.tipo_trabajo}</p>
              <p>Estado: <strong>{sol.estado.toUpperCase().replace('_', ' ')}</strong></p>
              <p>Fecha de Creación: {new Date(sol.fecha_creacion).toLocaleDateString()}</p>
              
              {/* Contenedor de Botones de Acción */}
              <div className="action-buttons-revisor">
                
                {/* ⬇️ BOTÓN DE DESCARGA PDF - AÑADIDO AQUÍ ⬇️ */}
                <button
                    onClick={() => handleDownloadPDF(sol.id, token)}
                    style={{ 
                        marginRight: '10px', 
                        backgroundColor: '#1E90FF', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 12px', 
                        cursor: 'pointer' 
                    }}
                >
                    📥 Descargar PDF
                </button>
                
                {/* Botón de Eliminación (Ahora si el estado es APROBADA O RECHAZADA) */}
                {(sol.estado === 'aprobada' || sol.estado === 'rechazada') && (
                  <button 
                    onClick={() => handleDeleteSolicitud(sol.id, sol.titulo)}
                    className="delete-button"
                  >
                    🗑️ Eliminar {sol.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                  </button>
                )}
                
                {/* Botón de Revisión (Si NO está APROBADA o RECHAZADA) */}
                {(sol.estado !== 'aprobada' && sol.estado !== 'rechazada') && (
                  <button 
                    onClick={() => handleSelectForReview(sol.id)}
                    className="review-button"
                  >
                    ✍️ Revisar Documento
                  </button>
                )}
              </div>
              
              <details>
                <summary>Ver Resumen y Revisiones ({sol.revisiones.length})</summary>
                <p style={{marginTop: '10px'}}>{sol.resumen}</p>
                {sol.revisiones && sol.revisiones.length > 0 && (
                    <div style={{ marginTop: '15px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                    <h4>Historial de Revisiones:</h4>
                    {sol.revisiones.map((rev, index) => (
                        <div key={index} style={{ border: '1px solid #f0f0f0', padding: '10px', marginBottom: '8px', borderRadius: '5px', backgroundColor: '#fafafa' }}>
                        <p>✍️ **Revisor:** {rev.revisor}</p>
                        <p>📝 **Recomendación:** <strong>{rev.recomendacion}</strong></p>
                        <p>💬 **Comentarios:** {rev.comentarios || 'No hay comentarios.'}</p>
                        <p style={{fontSize: '0.8em', color: 'var(--color-secondary)'}}>Fecha: {new Date(rev.fecha_revision).toLocaleDateString()}</p>
                        </div>
                    ))}
                    </div>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}
      
      <hr style={{margin: '40px 0'}} />
      
      {/* ------------------------------------------- */}
      {/* FORMULARIO DE REVISIÓN CONDICIONAL */}
      {/* ------------------------------------------- */}
      <section id="review-form-section"> 
      {revisionData.solicitudId && (
        <form onSubmit={handleReviewSubmit} className="creation-form">
          <h3>Añadir Revisión a Solicitud ID: {revisionData.solicitudId}</h3>
          
          <label>Recomendación:</label>
          <select
            name="recomendacion"
            value={revisionData.recomendacion}
            onChange={(e) => setRevisionData({...revisionData, recomendacion: e.target.value})}
            required
          >
            <option value="">Seleccione...</option>
            <option value="APR">Aprobar</option>
            <option value="RECH">Rechazar</option>
            <option value="RMEN">Revisión Menor (Mantiene En Revisión)</option>
            <option value="RMAY">Revisión Mayor (Mantiene En Revisión)</option>
          </select>
          
          <label>Comentarios (Obligatorio para Rechazo/Revisión):</label>
          <textarea
            name="comentarios"
            value={revisionData.comentarios}
            onChange={(e) => setRevisionData({...revisionData, comentarios: e.target.value})}
            rows="5"
          ></textarea>

          <button type="submit">Enviar Revisión</button>
          {submissionError && <p style={{ color: 'red' }}>{submissionError}</p>}
        </form>
      )}
      </section>
    </div>
  );
}

export default RevisorPanel;