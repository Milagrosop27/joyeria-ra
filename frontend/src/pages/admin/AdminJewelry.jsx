import { useState, useEffect } from 'react';
import { getCategories } from '../../services/categoryService';
import { uploadGLB, createJewelry, getCatalog, deactivateJewelry } from '../../services/jewelryService';
import { ArrowLeft, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Admin.css';

const AdminJewelry = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [jewelryList, setJewelryList] = useState([]);
    const [filteredJewelry, setFilteredJewelry] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        price: '',
        short_description: '',
        variant_name: '',
        variant_hex_code: '#000000',
        glb_file: '',
        file_size_kb: 0
    });
    const [imageFile, setImageFile] = useState(null);
    const [glbFile, setGlbFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [uploadingGLB, setUploadingGLB] = useState(false);
    const [listLoading, setListLoading] = useState(true);

    useEffect(() => {
        loadCategories();
        loadJewelryList();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            setFilteredJewelry(jewelryList.filter(j => j.category_id == selectedCategory));
        } else {
            setFilteredJewelry(jewelryList);
        }
    }, [selectedCategory, jewelryList]);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    };

    const loadJewelryList = async () => {
        try {
            const data = await getCatalog();
            setJewelryList(data);
        } catch (error) {
            console.error('Error cargando joyas:', error);
        } finally {
            setListLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas desactivar esta joya?')) {
            return;
        }

        try {
            await deactivateJewelry(id);
            setMessage('Joya desactivada exitosamente');
            await loadJewelryList();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error al desactivar la joya');
            console.error(error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleGLBChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setGlbFile(file);
        setUploadingGLB(true);
        setMessage('Subiendo archivo GLB...');

        try {
            const result = await uploadGLB(file);
            setFormData(prev => ({
                ...prev,
                glb_file: result.file_url,
                file_size_kb: result.file_size_kb
            }));
            setMessage('Archivo GLB subido exitosamente');
        } catch (error) {
            setMessage('Error al subir el archivo GLB');
            console.error(error);
        } finally {
            setUploadingGLB(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await createJewelry(formData, imageFile);
            setMessage('Joya registrada exitosamente');
            // Reset form
            setFormData({
                name: '',
                category_id: '',
                price: '',
                short_description: '',
                variant_name: '',
                variant_hex_code: '#000000',
                glb_file: '',
                file_size_kb: 0
            });
            setImageFile(null);
            setGlbFile(null);
            // Reload list and go back to list view
            await loadJewelryList();
            setView('list');
        } catch (error) {
            setMessage('Error al registrar la joya');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (view === 'list') {
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
                        <h1 className="admin-title" style={{ margin: 0 }}>Gestionar Joyas</h1>
                    </div>
                    <button
                        onClick={() => setView('create')}
                        className="admin-submit-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <Plus size={20} />
                        Nueva Joya
                    </button>
                </div>

                <div className="admin-form-container">
                    {message && (
                        <div className={`admin-message ${message.includes('exitosamente') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    {/* Filtro por categoría */}
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                        <Filter size={20} color="#D4AF37" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                padding: '10px 15px',
                                borderRadius: '4px',
                                border: '1px solid #D4AF37',
                                backgroundColor: '#2a2a2a',
                                color: 'white',
                                fontSize: '14px',
                                minWidth: '200px'
                            }}
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <span style={{ color: '#999', fontSize: '14px' }}>
                            Mostrando {filteredJewelry.length} de {jewelryList.length} joyas
                        </span>
                    </div>

                    {listLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>
                    ) : filteredJewelry.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {selectedCategory ? 'No hay joyas en esta categoría' : 'No hay joyas registradas'}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #D4AF37' }}>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Nombre</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Categoría</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Precio</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Estado</th>
                                    <th style={{ padding: '15px', textAlign: 'center', color: '#D4AF37' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJewelry.map(jewelry => {
                                    const categoryName = categories.find(c => c.id == jewelry.category_id)?.name || jewelry.category_id;
                                    return (
                                        <tr key={jewelry.id} style={{ borderBottom: '1px solid #333' }}>
                                            <td style={{ padding: '15px' }}>{jewelry.name}</td>
                                            <td style={{ padding: '15px' }}>{categoryName}</td>
                                            <td style={{ padding: '15px' }}>${parseFloat(jewelry.price).toFixed(2)}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    padding: '5px 10px',
                                                    borderRadius: '4px',
                                                    backgroundColor: jewelry.is_active ? '#28a745' : '#dc3545',
                                                    color: 'white'
                                                }}>
                                                    {jewelry.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => navigate(`/admin/joyas/editar/${jewelry.id}`)}
                                                        style={{
                                                            background: '#D4AF37',
                                                            border: 'none',
                                                            color: 'white',
                                                            padding: '8px 16px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        <Edit size={16} />
                                                        Editar
                                                    </button>
                                                    {jewelry.is_active && (
                                                        <button
                                                            onClick={() => handleDelete(jewelry.id)}
                                                            style={{
                                                                background: '#dc3545',
                                                                border: 'none',
                                                                color: 'white',
                                                                padding: '8px 16px',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px'
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => setView('list')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ArrowLeft size={24} color="#D4AF37" />
                    </button>
                    <h1 className="admin-title" style={{ margin: 0 }}>Registrar Nueva Joya</h1>
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
                        <label className="admin-form-label">Nombre de Variante</label>
                        <input
                            type="text"
                            name="variant_name"
                            value={formData.variant_name}
                            onChange={handleInputChange}
                            required
                            className="admin-form-input"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Color de Variante</label>
                        <input
                            type="color"
                            name="variant_hex_code"
                            value={formData.variant_hex_code}
                            onChange={handleInputChange}
                            style={{ width: '100px', height: '40px', marginTop: '5px' }}
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Imagen de Vista Previa</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="admin-form-file"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Archivo GLB</label>
                        <input
                            type="file"
                            accept=".glb"
                            onChange={handleGLBChange}
                            disabled={uploadingGLB}
                            required
                            className="admin-form-file"
                        />
                        {uploadingGLB && <span style={{ marginLeft: '10px', color: '#D4AF37' }}>Subiendo...</span>}
                        {formData.glb_file && <span style={{ marginLeft: '10px', color: '#28a745' }}>✓ Subido</span>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploadingGLB || !formData.glb_file}
                        className="admin-submit-btn"
                    >
                        {loading ? 'Guardando...' : 'Guardar Joya'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminJewelry;
