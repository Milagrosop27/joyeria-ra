import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/admin/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    return (
        <div className="admin-dashboard-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Panel de Administración</h1>
                    <p className="admin-subtitle">Gestiona tu joyería RA</p>
                </div>
                <button className="admin-logout-button" onClick={handleLogout}>
                    Cerrar Sesión
                </button>
            </div>

            <div className="admin-menu">
                <Link to="/admin/joyas" style={{ textDecoration: 'none' }}>
                    <div className="admin-card">
                        <h2 className="admin-card-title">Gestionar Joyas</h2>
                        <p className="admin-card-description">Agregar, editar y eliminar joyas del catálogo</p>
                    </div>
                </Link>

                <Link to="/admin/categorias" style={{ textDecoration: 'none' }}>
                    <div className="admin-card">
                        <h2 className="admin-card-title">Gestionar Categorías</h2>
                        <p className="admin-card-description">Administrar las categorías de productos</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
