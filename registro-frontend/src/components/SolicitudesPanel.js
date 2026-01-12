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

// Función auxiliar para la descarga
const handleDownloadPDF = (solicitudId, token) => {
    const downloadEndpoint = `/api/v1/solicitudes/${solicitudId}/descargar_pdf/`;
    const downloadUrl = `${BASE_URL}${downloadEndpoint}?auth_token=${token}`; 
    window.open(downloadUrl, '_blank');
};


function SolicitudesPanel({ token, user }) { 
    // ----------------------------------------------------
    // ✅ DEFINICIÓN DE ESTILOS DENTRO DEL ARCHIVO
    // ----------------------------------------------------
    const styles = {
        container: {
            padding: '20px',
            maxWidth: '900px',
            margin: '0 auto',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        panelHeader: {
            borderBottom: '2px solid #ccc',
            paddingBottom: '10px',
            marginBottom: '20px',
            color: '#333',
        },
        btnPrimary: {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            margin: '10px 0',
        },
        btnSuccess: {
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
        },
        btnSecondary: {
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
        },
        btnDownload: {
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '10px',
        },
        formContainer: {
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '20px',
        },
        formGroup: {
            marginBottom: '15px',
        },
        label: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            color: '#555',
        },
        input: {
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box',
        },
        textarea: {
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box',
            minHeight: '100px',
        },
        formActions: {
            marginTop: '20px',
            textAlign: 'right',
        },
        list: {
            listStyle: 'none',
            padding: 0,
        },
        listItem: {
            backgroundColor: 'white',
            border: '1px solid #eee',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
        loading: {
            textAlign: 'center',
            fontSize: '18px',
            color: '#007bff',
            padding: '50px 0',
        },
        error: {
            textAlign: 'center',
            fontSize: '18px',
            color: '#dc3545',
            padding: '50px 0',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
        }
    };
    // ----------------------------------------------------


    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false); 

    const [newSolicitudData, setNewSolicitudData] = useState({
        titulo: '',
        resumen: '',
        tipo_trabajo: 'ART',
        archivo_adjunto: null,
    });


    // FUNCIÓN PARA OBTENER LAS SOLICITUDES DEL USUARIO
    const fetchUserSolicitudes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = {
                headers: {
                    'Authorization': `Token ${token}`,
                },
            };
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

    // LÓGICA DEL FORMULARIO DE CREACIÓN 
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewSolicitudData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
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

        const formData = new FormData();
        formData.append('titulo', newSolicitudData.titulo);
        formData.append('resumen', newSolicitudData.resumen);
        formData.append('tipo_trabajo', newSolicitudData.tipo_trabajo);
        formData.append('archivo_adjunto', newSolicitudData.archivo_adjunto);

        try {
            const config = {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            };
            
            await axios.post(API_BASE_URL, formData, config);
            
            setNewSolicitudData({ titulo: '', resumen: '', tipo_trabajo: 'ART', archivo_adjunto: null });
            setIsCreating(false);
            fetchUserSolicitudes(); 
            
        } catch (err) {
            console.error("Error al crear solicitud:", err.response ? err.response.data : err);
            setError('Error al crear la solicitud. Verifica todos los campos y el tamaño del archivo.');
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div style={styles.loading}>Cargando tus solicitudes...</div>;
    if (error) return <div style={styles.error}>{error}</div>;


    return (
        <div style={styles.container}>
            <h2 style={styles.panelHeader}>Panel de Solicitudes</h2>

            {/* ✅ FORMULARIO DE CREACIÓN (Visible para CUALQUIER USUARIO AUTENTICADO) */}
            <div className="solicitud-creation-section">
                {!isCreating ? (
                    <button 
                        style={styles.btnPrimary} 
                        onClick={() => setIsCreating(true)}
                    >
                        + Crear Nueva Solicitud
                    </button>
                ) : (
                    <div style={styles.formContainer}>
                        <h3>Nueva Solicitud</h3>
                        <form onSubmit={handleCreateSolicitud} className="solicitud-form">
                            
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Título:</label>
                                <input
                                    type="text"
                                    name="titulo"
                                    value={newSolicitudData.titulo}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Resumen:</label>
                                <textarea
                                    name="resumen"
                                    value={newSolicitudData.resumen}
                                    onChange={handleInputChange}
                                    style={styles.textarea}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Tipo de Trabajo:</label>
                                <select
                                    name="tipo_trabajo"
                                    value={newSolicitudData.tipo_trabajo}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    required
                                >
                                    {Object.entries(TIPO_TRABAJO_CHOICES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Archivo (PDF):</label>
                                <input
                                    type="file"
                                    name="archivo_adjunto"
                                    onChange={handleFileChange}
                                    accept="application/pdf"
                                    required={!newSolicitudData.archivo_adjunto}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formActions}>
                                <button type="submit" disabled={loading} style={styles.btnSuccess}>
                                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreating(false)} 
                                    style={styles.btnSecondary}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
            <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #ddd' }} />
            
            {/* Lista de Solicitudes */}
            <h3 style={{ color: '#555' }}>Historial de Solicitudes</h3>
            
            {solicitudes.length === 0 ? (
                <p>No has enviado ninguna solicitud.</p>
            ) : (
                <ul style={styles.list}>
                    {solicitudes.map(solicitud => (
                        <li key={solicitud.id} style={styles.listItem}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#007bff' }}>{solicitud.titulo}</h4>
                            <p style={{ margin: '0' }}>Tipo: {TIPO_TRABAJO_CHOICES[solicitud.tipo_trabajo]}</p>
                            <p style={{ margin: '0' }}>Estado: **{solicitud.estado}**</p>
                            <p style={{ margin: '0' }}>Fecha de Envío: {new Date(solicitud.fecha_creacion).toLocaleDateString()}</p>
                            <button 
                                style={styles.btnDownload}
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