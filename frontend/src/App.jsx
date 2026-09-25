import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminJewelry from './pages/admin/AdminJewelry';
import AdminCategories from './pages/admin/AdminCategories';
import AdminLogin from './pages/admin/AdminLogin';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas del usuario */}
        <Route path="/" element={<Home />} />
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
        <Route path="/admin/categorias" element={
          <PrivateRoute>
            <AdminCategories />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
