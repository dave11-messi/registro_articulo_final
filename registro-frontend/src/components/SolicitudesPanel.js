import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ----------------------------------------------------
// ✅ CORRECCIÓN CLAVE: USAR VARIABLE DE ENTORNO
// ----------------------------------------------------
const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
// Si este panel es para un usuario, la URL base es la misma.
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


// ASUMO que esta función es el SolicitudesPanel, no el RevisorPanel.
// Si el código que tengo es el correcto, este panel tiene la lógica del Revisor, 
// pero modifico las URLs de todas formas.

function SolicitudesPanel({ token }) { 
// ^^^ CAMBIÉ RevisorPanel a SolicitudesPanel para consistencia con el nombre del archivo
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para manejar el formulario de creación de solicitud
  const [newSolicitudData, setNewSolicitudData] = useState({
        titulo: '',
        resumen: '',
        tipo_trabajo: 'ART',
        archivo_adjunto: null,
    });


  // ----------------------------------------------------
  //  FUNCIÓN PARA OBTENER LAS SOLICITUDES DEL USUARIO
  // ----------------------------------------------------
  const fetchUserSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
          'Authorization': `Token ${token}`,
        },
      };
      // Asumo que tu Backend tiene un endpoint para 'mis_solicitudes'
      const response = await axios.get(`${API_BASE_URL}mis_solicitudes/`, config);
      
      setSolicitudes(response.data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
      setError('No se pudieron cargar tus solicitudes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUserSolicitudes();
  }, [fetchUserSolicitudes]);

    // ... (El resto de la lógica de creación de solicitudes, eliminación, etc. se mantiene igual
    // siempre que uses API_BASE_URL)
    // ...

  if (loading) return <div>Cargando tus solicitudes...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Panel de Solicitudes</h2>
      
      {solicitudes.length === 0 ? (
        <p>No has enviado ninguna solicitud.</p>
      ) : (
        <ul className="solicitud-list">
          {/* Renderizado de solicitudes */}
        </ul>
      )}
      
      {/* ------------------------------------------- */}
      {/* FORMULARIO DE CREACIÓN DE SOLICITUD */}
      {/* ------------------------------------------- */}
    </div>
  );
}

export default SolicitudesPanel;