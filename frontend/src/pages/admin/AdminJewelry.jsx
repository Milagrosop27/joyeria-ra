import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminJewelry, createJewelry, updateJewelry, deleteJewelry } from '../../services/adminJewelryService';
import { getCategories } from '../../services/categoryService';
import '../../assets/styles/admin/AdminJewelry.css';

const AdminJewelry = () => {
    const [jewelries, setJewelries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingJewelry, setEditingJewelry] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        category_id: ''
    });
    const [modelFile, setModelFile] = useState(null);

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [jewelriesData, categoriesData] = await Promise.all([
                    getAdminJewelry(),
                    getCategories()
                ]);
                setJewelries(jewelriesData);
                setCategories(categoriesData);
            } catch (err) {
                setError('No se pudo cargar los datos.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const handleAddNew = () => {
        setEditingJewelry(null);
        setFormData({
            name: '',
            description: '',
            short_description: '',
            category_id: ''
        });
        setModelFile(null);
        setShowForm(true);
    };

    const handleEdit = (jewelry) => {
        setEditingJewelry(jewelry);
        setFormData({
            name: jewelry.name,
            description: jewelry.description || '',
            short_description: jewelry.short_description || '',
            category_id: jewelry.category_id || ''
        });
        setModelFile(null);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta joya?')) {
            try {
                await deleteJewelry(id, token);
                setJewelries(jewelries.filter(j => j.id !== id));
            } catch (err) {
                setError('Error al eliminar joya');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('short_description', formData.short_description);
        data.append('category_id', formData.category_id);
        if (modelFile) {
            data.append('model_file', modelFile);
        }
        if (editingJewelry && !modelFile) {
            data.append('existing_model_file', editingJewelry.model_file || '');
        }

        try {
            if (editingJewelry) {
                await updateJewelry(editingJewelry.id, data, token);
                setJewelries(jewelries.map(j => j.id === editingJewelry.id ? { ...j, ...formData } : j));
            } else {
                const response = await createJewelry(data, token);
                setJewelries([...jewelries, response.data]);
            }
            setShowForm(false);
            setEditingJewelry(null);
            setFormData({
                name: '',
                description: '',
                short_description: '',
                category_id: ''
            });
            setModelFile(null);
        } catch (err) {
            setError('Error al guardar joya');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingJewelry(null);
        setFormData({
            name: '',
            description: '',
            short_description: '',
            category_id: ''
        });
        setModelFile(null);
    };

    if (loading) return <div className="admin-container"><p style={{textAlign: 'center'}}>Cargando...</p></div>;
    if (error) return <div className="admin-container"><p style={{textAlign: 'center', color: 'red'}}>{error}</p></div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <Link to="/admin" style={{ textDecoration: 'none' }}>
                    <button className="admin-back-button">← Volver</button>
                </Link>
                <h1 className="admin-title">Gestión de Joyas</h1>
                <button className="admin-add-button" onClick={handleAddNew}>
                    + Agregar Nueva Joya
                </button>
            </div>

            {showForm ? (
                <div className="admin-form-container">
                    <h2 className="admin-form-title">{editingJewelry ? 'Editar Joya' : 'Nueva Joya'}</h2>
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
                            <label>Descripción corta</label>
                            <input 
                                type="text" 
                                value={formData.short_description}
                                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                            />
                        </div>
                        <div className="admin-form-group">
                            <label>Descripción</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="admin-form-group">
                            <label>Categoría</label>
                            <select 
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label>Archivo 3D (.glb)</label>
                            <input 
                                type="file" 
                                accept=".glb,.gltf"
                                onChange={(e) => setModelFile(e.target.files[0])}
                            />
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-cancel-button" onClick={handleCancel}>
                                Cancelar
                            </button>
                            <button type="submit" className="admin-submit-button">
                                {editingJewelry ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="admin-grid">
                    {jewelries.map((jewelry) => (
                        <div key={jewelry.id} className="admin-item-card">
                            <div className="admin-item-info">
                                <h3 className="admin-item-name">{jewelry.name}</h3>
                                <p className="admin-item-desc">{jewelry.description}</p>
                                <p className="admin-item-desc">Categoría: {categories.find(c => c.id === jewelry.category_id)?.name || 'Sin categoría'}</p>
                            </div>
                            <div className="admin-item-actions">
                                <button className="admin-edit-button" onClick={() => handleEdit(jewelry)}>
                                    Editar
                                </button>
                                <button className="admin-delete-button" onClick={() => handleDelete(jewelry.id)}>
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

export default AdminJewelry;
