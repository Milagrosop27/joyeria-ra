import { useState } from 'react';
import { loginAdmin } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Admin.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            await loginAdmin({ email, password });
            navigate('/admin');
        } catch (err) {
            setError('Credenciales inválidas');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Login Administrador</h2>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="admin-form-input"
                        />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="admin-form-input"
                        />
                    </div>
                    <button type="submit" className="admin-submit-btn">
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
