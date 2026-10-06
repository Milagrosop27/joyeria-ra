import { useState, useEffect } from 'react';
import { getCategories } from '../../services/categoryService';
import { getJewelryById, updateJewelry } from '../../services/jewelryService';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../assets/styles/Admin.css';

const AdminEditJewelry = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        price: '',
        short_description: '',
        is_active: 1
    });
    const [imageFile, setImageFile] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        loadCategories();
        loadJewelry();
    }, [id]);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    };

    const loadJewelry = async () => {
        try {
            const data = await getJewelryById(id);
            setFormData({
                name: data.name || '',
                category_id: data.category_id || '',
                price: data.price || '',
                short_description: data.short_description || '',
                is_active: data.is_active !== undefined ? data.is_active : 1
            });
            setCurrentImageUrl(data.image_url || '');
        } catch (error) {
            console.error('Error cargando joya:', error);
            setMessage('Error al cargar la joya');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await updateJewelry(id, formData, imageFile);
            setMessage('Joya actualizada exitosamente');
        } catch (error) {
            setMessage('Error al actualizar la joya');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="admin-container">Cargando...</div>;
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => navigate('/admin/joyas')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ArrowLeft size={24} color="#D4AF37" />
                    </button>
                    <h1 className="admin-title" style={{ margin: 0 }}>Editar Joya</h1>
                </div>
            </div>

            <div className="admin-form-container">
                {message && (
                    <div className={`admin-message ${message.includes('exitosamente') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Nombre de la Joya</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="admin-form-input"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Categoría</label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleInputChange}
                            required
                            className="admin-form-select"
                        >
                            <option value="">Seleccionar categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Precio</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            step="0.01"
                            className="admin-form-input"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Descripción</label>
                        <textarea
                            name="short_description"
                            value={formData.short_description}
                            onChange={handleInputChange}
                            className="admin-form-textarea"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Estado</label>
                        <select
                            name="is_active"
                            value={formData.is_active}
                            onChange={handleInputChange}
                            className="admin-form-select"
                        >
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Imagen de Vista Previa (opcional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="admin-form-file"
                        />
                        {currentImageUrl && (
                            <div style={{ marginTop: '10px' }}>
                                <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Imagen actual:</p>
                                <img
                                    src={currentImageUrl}
                                    alt="Imagen actual de la joya"
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        objectFit: 'contain',
                                        border: '1px solid #D4AF37',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="admin-submit-btn"
                    >
                        {loading ? 'Guardando...' : 'Actualizar Joya'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminEditJewelry;