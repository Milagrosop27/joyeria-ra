import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../assets/styles/admin/AdminCategories.css';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/categories');
                setCategories(response.data);
            } catch (err) {
                setError('No se pudo cargar las categorías.');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleAddNew = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        setShowForm(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, description: category.description || '' });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
            try {
                await axios.delete(`http://localhost:3000/api/categories/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(categories.filter(c => c.id !== id));
            } catch (err) {
                setError('Error al eliminar categoría');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await axios.put(`http://localhost:3000/api/categories/${editingCategory.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c));
            } else {
                const response = await axios.post('http://localhost:3000/api/categories', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories([...categories, response.data]);
            }
            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        } catch (err) {
            setError('Error al guardar categoría');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    if (loading) return <div className="admin-container"><p style={{textAlign: 'center'}}>Cargando...</p></div>;
    if (error) return <div className="admin-container"><p style={{textAlign: 'center', color: 'red'}}>{error}</p></div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <Link to="/admin" style={{ textDecoration: 'none' }}>
                    <button className="admin-back-button">← Volver</button>
                </Link>
                <h1 className="admin-title">Gestión de Categorías</h1>
                <button className="admin-add-button" onClick={handleAddNew}>
                    + Agregar Nueva Categoría
                </button>
            </div>

            {showForm ? (
                <div className="admin-form-container">
                    <h2 className="admin-form-title">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <div className="admin-form-group">
                            <label>Nombre</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="admin-form-group">
                            <label>Descripción</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-cancel-button" onClick={handleCancel}>
                                Cancelar
                            </button>
                            <button type="submit" className="admin-submit-button">
                                {editingCategory ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="admin-grid">
                    {categories.map((category) => (
                        <div key={category.id} className="admin-item-card">
                            <div className="admin-item-info">
                                <h3 className="admin-item-name">{category.name}</h3>
                                <p className="admin-item-desc">{category.description || 'Sin descripción'}</p>
                            </div>
                            <div className="admin-item-actions">
                                <button className="admin-edit-button" onClick={() => handleEdit(category)}>
                                    Editar
                                </button>
                                <button className="admin-delete-button" onClick={() => handleDelete(category.id)}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
