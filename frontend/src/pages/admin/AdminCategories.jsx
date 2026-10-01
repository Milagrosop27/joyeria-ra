import { useState, useEffect } from 'react';
import { getCategories } from '../../services/categoryService';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Admin.css';

const AdminCategories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => navigate('/admin')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ArrowLeft size={24} color="#D4AF37" />
                    </button>
                    <h1 className="admin-title" style={{ margin: 0 }}>Gestión de Categorías</h1>
                </div>
            </div>

            <div className="admin-table-container">
                {categories.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                        No hay categorías registradas
                    </p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Tipo de Tracking</th>
                                <th>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td>{cat.id}</td>
                                    <td>{cat.name}</td>
                                    <td>{cat.tracking_type}</td>
                                    <td>{cat.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminCategories;
