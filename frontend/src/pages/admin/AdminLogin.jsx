import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/authService';
import '../../assets/styles/admin/AdminLogin.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Validación básica
        if (!email || !password) {
            setError('Por favor ingresa email y contraseña');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await loginAdmin({ email, password });
            navigate('/admin');
        } catch (err) {
            setError('Usuario o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-wrapper">
                <h1 className="admin-login-title">Acceso Administrador</h1>
                <p className="admin-login-subtitle">Joyería RA</p>
                
                {error && <p className="admin-login-error">{error}</p>}
                
                <form className="admin-login-form" onSubmit={handleLogin}>
                    <div className="admin-form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ingresa tu email"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="admin-form-group">
                        <label>Contraseña</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingresa tu contraseña"
                            disabled={loading}
                        />
                    </div>
                    
                    <button type="submit" className="admin-login-button" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
