import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// URL del endpoint de login de Django
const API_LOGIN_URL = 'http://127.0.0.1:8000/api/v1/login/';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(API_LOGIN_URL, {
        username,
        password,
      });

      const token = response.data.token;
      
      // ✅ CRÍTICO: onLoginSuccess SÓLO recibe el token. 
      // La data del usuario (rol) la carga App.js de forma independiente.
      
      // 1. Guardar el token en el almacenamiento local
      localStorage.setItem('authToken', token);
      
      // 2. Informar al componente padre que el login fue exitoso
      onLoginSuccess(token); 
      
      // 3. Redirigir a la página de inicio 
      navigate('/'); 

    } catch (err) {
      if (err.response && err.response.data.non_field_errors) {
        setError('Credenciales inválidas. Por favor, verifica tu usuario y contraseña.');
      } else {
        setError('Error de conexión con el servidor. ¿Está Django corriendo?');
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Usuario:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Entrar</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;