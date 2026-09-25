import { Link } from 'react-router-dom';
import { Sparkles, Gem, Crown, Heart, ShoppingBag, Star, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/images/logo.jpg'; 
import '../assets/styles/Home.css'; 

const Home = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="home-container">
            {/* Símbolos flotantes */}
            <div className="floating-symbol">✦</div>
            <div className="floating-symbol">◆</div>
            <div className="floating-symbol">✧</div>
            <div className="floating-symbol">◇</div>
            <div className="floating-symbol">✦</div>
            <div className="floating-symbol">◆</div>

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

            <div className="content-wrapper">
                <img 
                    src={logo} 
                    alt="Milagros" 
                    className="home-logo" 
                />

                <h1 className="home-title">
                    Joyería RA
                </h1>
                
                <div className="home-divider"></div>
                
                <p className="home-subtitle">
                    Joyería Elegante & Exclusiva
                </p>

                <p className="home-description">
                    Descubre nuestra colección exclusiva de joyería artesanal. 
                    Cada pieza es diseñada con pasión y creada con los más finos materiales.
                </p>

                {/* Grid de características */}
                <div className="features-grid">
                    <div className="feature-item">
                        <Sparkles className="feature-icon" size={32} />
                        <h3 className="feature-title">Diseño Único</h3>
                        <p className="feature-text">Piezas exclusivas creadas a mano</p>
                    </div>
                    <div className="feature-item">
                        <ShoppingBag className="feature-icon" size={32} />
                        <h3 className="feature-title">Calidad Premium</h3>
                        <p className="feature-text">Materiales de la más alta calidad</p>
                    </div>
                    <div className="feature-item">
                        <Sparkles className="feature-icon" size={32} />
                        <h3 className="feature-title">Prueba Virtual</h3>
                        <p className="feature-text">Prueba nuestras joyas con AR</p>
                    </div>
                    <div className="feature-item">
                        <ShoppingBag className="feature-icon" size={32} />
                        <h3 className="feature-title">Envío Seguro</h3>
                        <p className="feature-text">Entrega garantizada y segura</p>
                    </div>
                </div>
                
                <Link to="/catalogo" style={{ textDecoration: 'none' }}>
                    <button className="home-button">
                        Ver Catálogo
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default Home;