import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal que carga el Módulo Inicio */}
        <Route path="/" element={<Home />} />
        
        {/* Ruta que carga el Módulo Catálogo */}
        <Route path="/catalogo" element={<Catalog />} />
        <Route element={<ProductDetails />} path="/joya/:id" /> 
      </Routes>
    </Router>
  );
}

export default App;
