import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                // Consumimos tu ruta pública para buscar una joya específica
                const response = await axios.get(`http://localhost:3000/api/jewelry/${id}`);
                setProduct(response.data);
            } catch (err) {
                setError('No se encontró la información de esta joya.');
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [id]);

    if (loading) return <div className="details-wrapper"><p style={{textAlign: 'center'}}>Cargando detalles...</p></div>;
    if (error) return <div className="details-wrapper"><p style={{textAlign: 'center', color: 'red'}}>{error}</p></div>;

    return (
        <div className="details-wrapper">
            <div className="details-container">
                {/* Columna Izquierda: Fotografía */}
                <div className="details-image-section">
                    Espacio para fotografía real de: {product.name}
                </div>

                {/* Columna Derecha: Información y Compra */}
                <div className="details-info-section">
                    <h1 className="details-title">{product.name}</h1>
                    <p className="details-price">${product.price}</p>
                    
                    <p className="details-description">{product.short_description}</p>
                    
                    <div className="details-colors">
                        <p className="details-colors-title">Colores disponibles</p>
                        <p className="details-colors-list">Dorado | Plateado | Oro Rosa</p>
                    </div>

                    {/* Botón que dirigirá al probador virtual de la categoría correspondiente */}
                    <Link to={`/probador/${product.id}`} style={{ width: '100%', textDecoration: 'none' }}>
                        <button className="details-try-button">
                            Probar virtualmente
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;