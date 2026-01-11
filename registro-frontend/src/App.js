import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SolicitudesPanel from './components/SolicitudesPanel';
import RevisorPanel from './components/RevisorPanel'; 
import Navigation from './components/Navigation'; // Importar el nuevo componente
import './App.css';
import axios from 'axios'; 
import SplashImage from './components/SplashImage';

// Endpoint para obtener la info del usuario desde Django
const API_USER_INFO_URL = 'http://127.0.0.1:8000/api/v1/user/info/'; 

// Componente de página de inicio simple después del login
const HomePanel = ({ user }) => {
    if (!user) return <Navigate to="/login" replace />;
    
    // Si NO es staff (Solicitante), lo enviamos directo a Solicitudes
    if (!user.is_staff) {
        return <Navigate to="/solicitudes" replace />;
    }
    
    // Si es Staff, le mostramos el mensaje de bienvenida y la barra de navegación
    return (
        <div className="home-panel-container">
            <h2 className="welcome-message">👋 Bienvenido, Revisor **{user.username}**.</h2>
            <SplashImage /> {/* <-- INTEGRACIÓN DEL COMPONENTE DE IMAGEN */}
            <p className="navigation-hint">Selecciona una opción en la barra superior para empezar a trabajar.</p>
        </div>
    );
};


function App() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  // user contendrá la data real: {id, username, is_staff, email}
  const [user, setUser] = useState(null); 
  const [isProfileLoading, setIsProfileLoading] = useState(true); 

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsProfileLoading(false); 
  };

  // FUNCIÓN PARA CARGAR EL ROL DEL USUARIO
  const fetchUserData = useCallback(async (authToken) => {
    setIsProfileLoading(true);
    try {
      const response = await axios.get(API_USER_INFO_URL, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      // ✅ Guardamos la data con is_staff (snake_case)
      setUser(response.data); 
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
      handleLogout(); 
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserData(token);
    } else {
      setIsProfileLoading(false); 
    }
  }, [token, fetchUserData]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    // La data del usuario se cargará inmediatamente después en el useEffect
  };

  // Componente Auxiliar para rutas protegidas
  const PrivateRoute = ({ element: Element, ...rest }) => {
    if (!token) {
      return <Navigate to="/login" />;
    }
    // Pasamos el token y el objeto user para que los componentes puedan usar la data del usuario
    return <Element token={token} user={user} />; 
  };
  
  if (isProfileLoading) {
    return (
      <div className="App">
        <header className="App-header"><h1>Sistema de Registro y Revisión</h1></header>
        <main className="main-content">
          <div>Cargando perfil de usuario...</div>
        </main>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Sistema de Registro y Revisión</h1>
          {/* ✅ NAVEGACIÓN COMPLETA REEMPLAZA AL BOTÓN DE LOGOUT */}
          <Navigation user={user} onLogout={handleLogout} />
        </header>
        
        <main className="main-content">
          <Routes>
            {/* Si está logueado, va a HomePanel. Si no, va a Login. */}
            <Route path="/" element={token ? <HomePanel user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
            
            <Route 
              path="/solicitudes" 
              element={<PrivateRoute element={SolicitudesPanel} />} 
            />
            
            {/* Si es staff, puede ver el panel de revisor. Si no, lo redirige. */}
            <Route 
              path="/revisor" 
              element={user && user.is_staff ? <PrivateRoute element={RevisorPanel} /> : <Navigate to="/solicitudes" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer>
          <p>© 2025 Backend con Django REST Framework</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;