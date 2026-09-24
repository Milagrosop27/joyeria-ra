import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCatalog } from '../services/jewelryService';
import { getCategories } from '../services/categoryService';
import '../assets/styles/Catalog.css';

const Catalog = () => {
    const [jewelries, setJewelries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                        
                        {/* 1. Enlace hacia los detalles de la joya (clic en la foto o título) */}
                        <Link to={`/joya/${jewelry.id}`} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                            <div className="product-image-placeholder">
                                Imagen: {jewelry.name}
                            </div>
                            <h2 className="product-name">{jewelry.name}</h2>
                        </Link>
                        
                        <p className="product-price">${jewelry.price}</p>
                        <p className="product-description">{jewelry.description}</p>
                        <p className="product-colors">Colores: Oro | Plata | Oro Rosa</p>
                        
                        {/* 2. Enlace directo al probador virtual de Realidad Aumentada */}
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