import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SolicitudesPanel.css'; // Asegúrate de tener este archivo o un estilo similar

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

// Función auxiliar para la descarga
const handleDownloadPDF = (solicitudId, token) => {
    const downloadEndpoint = `/api/v1/solicitudes/${solicitudId}/descargar_pdf/`;
    const downloadUrl = `${BASE_URL}${downloadEndpoint}?auth_token=${token}`; 
    window.open(downloadUrl, '_blank');
};


// ----------------------------------------------------
// ✅ CORRECCIÓN: Aceptar 'user' en las props.
// ----------------------------------------------------
function SolicitudesPanel({ token, user }) { 
// ----------------------------------------------------
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false); // Nuevo estado para mostrar/ocultar el formulario

    const [newSolicitudData, setNewSolicitudData] = useState({
        titulo: '',
        resumen: '',
        tipo_trabajo: 'ART',
        archivo_adjunto: null,
    });


    // ----------------------------------------------------
    // FUNCIÓN PARA OBTENER LAS SOLICITUDES DEL USUARIO
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
            // Endpoint para obtener las solicitudes del usuario logueado
            const response = await axios.get(`${API_BASE_URL}mis_solicitudes/`, config);
            
            setSolicitudes(response.data);
        } catch (err) {
            console.error("Error al cargar solicitudes:", err);
            setError('No se pudieron cargar tus solicitudes. (Verifica la URL)');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUserSolicitudes();
    }, [fetchUserSolicitudes]);

    // ----------------------------------------------------
    // ✅ LÓGICA DEL FORMULARIO DE CREACIÓN (AÑADIDA)
    // ----------------------------------------------------
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewSolicitudData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        // Solo guarda el primer archivo seleccionado
        setNewSolicitudData(prev => ({ ...prev, archivo_adjunto: e.target.files[0] }));
    };

    const handleCreateSolicitud = async (e) => {
        e.preventDefault();
        
        if (!newSolicitudData.archivo_adjunto) {
            alert("Por favor, adjunta el archivo PDF.");
            return;
        }

        setLoading(true);
        setError(null);

        // Crear objeto FormData para enviar datos mixtos (texto + archivo)
        const formData = new FormData();
        formData.append('titulo', newSolicitudData.titulo);
        formData.append('resumen', newSolicitudData.resumen);
        formData.append('tipo_trabajo', newSolicitudData.tipo_trabajo);
        formData.append('archivo_adjunto', newSolicitudData.archivo_adjunto);

        try {
            const config = {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data', // Crucial para archivos
                },
            };
            
            await axios.post(API_BASE_URL, formData, config);
            
            // Limpiar formulario y recargar lista
            setNewSolicitudData({ titulo: '', resumen: '', tipo_trabajo: 'ART', archivo_adjunto: null });
            setIsCreating(false);
            fetchUserSolicitudes(); // Recargar la lista para ver la nueva solicitud
            
        } catch (err) {
            console.error("Error al crear solicitud:", err.response ? err.response.data : err);
            setError('Error al crear la solicitud. Verifica todos los campos y el tamaño del archivo.');
        } finally {
            setLoading(false);
        }
    };
    // ----------------------------------------------------

    if (loading) return <div className="panel-loading">Cargando tus solicitudes...</div>;
    if (error) return <div className="panel-error">{error}</div>;

    // Los revisores (staff) no deberían usar este panel para crear
    const isSolicitante = user && !user.is_staff;


    return (
        <div className="solicitudes-panel-container">
            <h2>Panel de Solicitudes</h2>

            {/* ------------------------------------------- */}
            {/* ✅ FORMULARIO DE CREACIÓN DE SOLICITUD (Visible solo para Solicitantes) */}
            {/* ------------------------------------------- */}
            {isSolicitante && (
                <div className="solicitud-creation-section">
                    {!isCreating ? (
                        <button 
                            className="btn btn-primary new-solicitud-btn" 
                            onClick={() => setIsCreating(true)}
                        >
                            + Crear Nueva Solicitud
                        </button>
                    ) : (
                        <div className="form-container">
                            <h3>Nueva Solicitud</h3>
                            <form onSubmit={handleCreateSolicitud} className="solicitud-form">
                                
                                <label>Título:</label>
                                <input
                                    type="text"
                                    name="titulo"
                                    value={newSolicitudData.titulo}
                                    onChange={handleInputChange}
                                    required
                                />

                                <label>Resumen:</label>
                                <textarea
                                    name="resumen"
                                    value={newSolicitudData.resumen}
                                    onChange={handleInputChange}
                                    required
                                />

                                <label>Tipo de Trabajo:</label>
                                <select
                                    name="tipo_trabajo"
                                    value={newSolicitudData.tipo_trabajo}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {Object.entries(TIPO_TRABAJO_CHOICES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>

                                <label>Archivo (PDF):</label>
                                <input
                                    type="file"
                                    name="archivo_adjunto"
                                    onChange={handleFileChange}
                                    accept="application/pdf"
                                    required={!newSolicitudData.archivo_adjunto} // Requerido al inicio
                                />

                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="btn btn-success">
                                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCreating(false)} 
                                        className="btn btn-secondary"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
            <hr />
            
            {/* Lista de Solicitudes */}
            <h3>Historial de Solicitudes</h3>
            
            {solicitudes.length === 0 ? (
                <p>No has enviado ninguna solicitud.</p>
            ) : (
                <ul className="solicitud-list">
                    {solicitudes.map(solicitud => (
                        <li key={solicitud.id} className="solicitud-item">
                            <h4>{solicitud.titulo}</h4>
                            <p>Tipo: {TIPO_TRABAJO_CHOICES[solicitud.tipo_trabajo]}</p>
                            <p>Estado: **{solicitud.estado}**</p>
                            <p className="solicitud-date">Fecha de Envío: {new Date(solicitud.fecha_creacion).toLocaleDateString()}</p>
                            <button 
                                className="btn btn-download"
                                onClick={() => handleDownloadPDF(solicitud.id, token)}
                            >
                                Descargar PDF
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SolicitudesPanel;