import { useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../../services/authService';
import { Package, Tag } from 'lucide-react';
import '../../assets/styles/Admin.css';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutAdmin();
        navigate('/admin/login');
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="admin-title">Panel de Administración</h1>
                <button onClick={handleLogout} className="admin-logout-btn">
                    Cerrar Sesión
                </button>
            </div>

            <div className="admin-dashboard-grid">
                <div className="admin-card" onClick={() => navigate('/admin/joyas')}>
                    <Package className="admin-card-icon" size={48} />
                    <h3 className="admin-card-title">Joyas</h3>
                    <p className="admin-card-description">Gestionar catálogo de joyas</p>
                </div>

                <div className="admin-card" onClick={() => navigate('/admin/categorias')}>
                    <Tag className="admin-card-icon" size={48} />
                    <h3 className="admin-card-title">Categorías</h3>
                    <p className="admin-card-description">Gestionar categorías de productos</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;