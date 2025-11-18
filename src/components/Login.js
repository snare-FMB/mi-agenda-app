import { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistro, setIsRegistro] = useState(false);
  const [error, setError] = useState('');

  const loginConGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (error) {
      setError('Error al iniciar sesión con Google: ' + error.message);
    }
  };

  const loginConEmail = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistro) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else if (error.code === 'auth/user-not-found') {
        setError('Usuario no encontrado');
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else {
        setError('Error: ' + error.message);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🗓️ Mi Agenda Personal</h1>
        <p className="subtitle">Organiza tus tareas con prioridades</p>

        {error && <div className="error-message">{error}</div>}

        <button onClick={loginConGoogle} className="google-btn">
          Continuar con Google
        </button>

        <div className="divider">
          <span>o</span>
        </div>

        <form onSubmit={loginConEmail}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
          <button type="submit" className="email-btn">
            {isRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="toggle-text">
          {isRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <span onClick={() => { setIsRegistro(!isRegistro); setError(''); }}>
            {isRegistro ? ' Inicia sesión' : ' Regístrate'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
