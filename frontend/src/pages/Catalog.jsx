import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sparkles, ShoppingBag } from 'lucide-react';
import { getCatalog } from '../services/jewelryService';
import { getCategories } from '../services/categoryService';
import '../assets/styles/Catalog.css';

const Catalog = () => {
    const [jewelries, setJewelries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Imágenes temporales por nombre de joya
    const temporaryImages = {
        'Aretes Elegantes': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
        'Aretes Modernos': 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&h=400&fit=crop',
        'Pulsera Clásica': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
        'Collar Elegance': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
        'Collar Moderno': 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop',
        'Collar Clásico': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop'
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Consumimos ambas APIs en paralelo
                const [catalogData, categoriesData] = await Promise.all([
                    getCatalog(),
                    getCategories()
                ]);
                setJewelries(catalogData);
                setCategories(categoriesData);
            } catch (err) {
                setError('No se pudo cargar la colección.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    if (loading) return <div className="catalog-container"><p style={{textAlign: 'center'}}>Cargando colección...</p></div>;
    if (error) return <div className="catalog-container"><p style={{textAlign: 'center', color: 'red'}}>{error}</p></div>;

    // Lógica de filtro por categorías
    const filteredJewelries = selectedCategory
        ? jewelries.filter(jewelry => jewelry.category_id === selectedCategory)
        : jewelries;

    return (
        <div className="catalog-container">
            {/* Menú desplegable */}
            <div className="dropdown-container">
                <button className="dropdown-toggle" onClick={toggleMenu}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                
                {isMenuOpen && (
                    <div className="dropdown-menu">
                        <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
                            <div className="dropdown-item">
                                <Sparkles className="dropdown-icon" size={20} />
                                <span>Inicio</span>
                            </div>
                        </Link>
                        <Link to="/catalogo" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
                            <div className="dropdown-item">
                                <ShoppingBag className="dropdown-icon" size={20} />
                                <span>Catálogo</span>
                            </div>
                        </Link>
                    </div>
                )}
            </div>

            <div className="catalog-header">
                <h1 className="catalog-title">Nuestra Colección</h1>
                <p className="catalog-subtitle">Explora y pruébate nuestras piezas exclusivas</p>
            </div>

            {/* Filtro de Categorías */}
            <div className="category-filter">
                <button 
                    className={`filter-button ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                >
                    Todas
                </button>
                {categories.map(category => (
                    <button 
                        key={category.id} 
                        className={`filter-button ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(category.id)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="catalog-grid">
                {filteredJewelries.map((jewelry) => (
                    <div key={jewelry.id} className="product-card">
                        
                        {/* Imagen de la joya (sin link) */}
                        {temporaryImages[jewelry.name] ? (
                            <img 
                                src={temporaryImages[jewelry.name]} 
                                alt={jewelry.name}
                                className="product-image"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className="product-image-placeholder" style={{ display: temporaryImages[jewelry.name] ? 'none' : 'flex' }}>
                            Imagen: {jewelry.name}
                        </div>
                        
                        {/* Nombre de la joya (sin link) */}
                        <h2 className="product-name">{jewelry.name}</h2>
                        
                        <p className="product-price">${jewelry.price}</p>
                        <p className="product-description">{jewelry.short_description || jewelry.description}</p>
                        <p className="product-colors">Colores: Oro | Plata | Oro Rosa</p>
                        
                        {/* Enlace directo al probador virtual de Realidad Aumentada */}
                        <Link to={`/probador/${jewelry.id}`} style={{ width: '100%', textDecoration: 'none' }}>
                            <button className="try-on-button">
                                Probar virtualmente
                            </button>
                        </Link>
                        
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Catalog;