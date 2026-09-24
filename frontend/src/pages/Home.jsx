import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.jpg'; 
import '../assets/styles/Home.css'; 

const Home = () => {
    return (
        <div className="home-container">
            <div className="content-wrapper">
                <img 
                    src={logo} 
                    alt="Logotipo Joyería RA" 
                    className="home-logo" 
                />

                <h1 className="home-title">
                    JOYERÍA RA
                </h1>
                
                <div className="home-divider"></div>
                
                <p className="home-subtitle">
                    Vive una experiencia interactiva. 
                </p>
                
                <Link to="/catalogo" style={{ textDecoration: 'none' }}>
                    <button className="home-button">
                        Explorar joyas
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default Home;