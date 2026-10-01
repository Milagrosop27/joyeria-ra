import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminJewelry from './pages/admin/AdminJewelry';
import AdminEditJewelry from './pages/admin/AdminEditJewelry';
import AdminCategories from './pages/admin/AdminCategories';
import AdminLogin from './pages/admin/AdminLogin';
import PrivateRoute from './components/PrivateRoute';
import VirtualTryOn from './pages/VirtualTryOn';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal que carga el Módulo Inicio */}
        <Route path="/" element={<Home />} />
        
        {/* Ruta que carga el Módulo Catálogo */}
        <Route path="/catalogo" element={<Catalog />} />
        <Route element={<ProductDetails />} path="/joya/:id" />
        
        {/* Rutas del administrador */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/joyas" element={
          <PrivateRoute>
            <AdminJewelry />
          </PrivateRoute>
        } />
        <Route path="/admin/joyas/editar/:id" element={
          <PrivateRoute>
            <AdminEditJewelry />
          </PrivateRoute>
        } />
        <Route path="/admin/categorias" element={
          <PrivateRoute>
            <AdminCategories />
          </PrivateRoute>
        } />
        
        {/* Ruta que carga el Probador Virtual */}
        <Route path="/probador/:id" element={<VirtualTryOn />} /> 
      </Routes>
    </Router>
  );
}

export default App;
