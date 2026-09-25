import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import axios from 'axios';
import CameraView from '../modules/virtual-try-on/CameraView';
import JewelryRendererModelViewer from '../modules/virtual-try-on/JewelryRendererModelViewer';
import FaceTrackingTasksVision from '../modules/virtual-try-on/FaceTrackingTasksVision';
import HandTracking from '../modules/virtual-try-on/HandTracking';
import PoseTracking from '../modules/virtual-try-on/PoseTracking';
import { getCatalog, getJewelryById } from '../services/jewelryService';
import { getCategories } from '../services/categoryService';
import '../assets/styles/VirtualTryOn.css';

const VirtualTryOn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [jewelry, setJewelry] = useState(null);
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allCategoryJewelries, setAllCategoryJewelries] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tracking
  const [trackingType, setTrackingType] = useState(null); // 'face', 'hand', 'pose'
  const faceTrackingRef = useRef(null);
  const handTrackingRef = useRef(null);
  const poseTrackingRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Posición y rotación del modelo 3D
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0, z: 0 });
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });
  const [modelScale, setModelScale] = useState({ x: 1, y: 1, z: 1 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar joya específica
        const jewelryData = await getJewelryById(id);
        setJewelry(jewelryData);
        
        // Cargar categorías
        const categoriesData = await getCategories();
        setCategories(categoriesData);
        
        // Determinar categoría de la joya
        const jewelryCategory = categoriesData.find(cat => cat.id === jewelryData.category_id);
        setCategory(jewelryCategory);
        
        // Determinar tipo de tracking según nombre de categoría
        if (jewelryCategory && jewelryCategory.name) {
          const categoryName = jewelryCategory.name.toLowerCase();
          if (categoryName.includes('arete') || categoryName.includes('arito')) {
            setTrackingType('face');
          } else if (categoryName.includes('pulsera')) {
            setTrackingType('hand');
          } else if (categoryName.includes('collar')) {
            setTrackingType('pose');
          }
        }
        
        // Cargar todas las joyas de la misma categoría
        const catalogData = await getCatalog();
        const sameCategoryJewelries = catalogData.filter(j => j.category_id === jewelryData.category_id);
        setAllCategoryJewelries(sameCategoryJewelries);
        
        // Establecer variante por defecto
        if (jewelryData.variants && jewelryData.variants.length > 0) {
          setSelectedVariant(jewelryData.variants[0]);
        }
        
      } catch (err) {
        setError('No se pudo cargar la información de la joya.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Inicializar tracking cuando se determine el tipo
  useEffect(() => {
    // Tracking automático deshabilitado temporalmente
    // MediaPipe Tasks Vision no funciona correctamente
    console.log('Tracking automático deshabilitado. El modelo 3D se muestra con auto-rotate.');
  }, [trackingType]);

  // Procesar frames de video para tracking
  const handleVideoReady = (videoElement) => {
    videoRef.current = videoElement;
    console.log('Video listo. Tracking automático deshabilitado.');
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const handleJewelryChange = (newJewelryId) => {
    navigate(`/probador/${newJewelryId}`);
  };

  if (loading) {
    return (
      <div className="virtual-tryon-container">
        <div className="loading-message">
          <p>Cargando probador virtual...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="virtual-tryon-container">
        <div className="error-message">
          <p>{error}</p>
          <Link to="/catalogo">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const modelUrl = selectedVariant?.models3d?.[0]?.file_url || jewelry?.variants?.[0]?.models3d?.[0]?.file_url;

  return (
    <div className="virtual-tryon-container">
      {/* Header */}
      <div className="tryon-header">
        <div className="header-content">
          <Camera className="header-icon" size={32} />
          <div className="header-text">
            <h1>Probador Virtual</h1>
            <p>{category?.name} - {jewelry?.name}</p>
          </div>
        </div>
        <Link to="/catalogo" className="back-button">
          Volver al catálogo
        </Link>
      </div>

      {/* Área principal de cámara y renderizado */}
      <div className="tryon-main">
        <div className="camera-wrapper">
          <CameraView onVideoReady={handleVideoReady} onError={setError} />
          {modelUrl && (
            <JewelryRendererModelViewer
              modelUrl={modelUrl}
              onModelLoaded={() => console.log('Modelo cargado')}
            />
          )}
        </div>
      </div>

      {/* Panel inferior: selector de variantes y joyas */}
      <div className="tryon-panel">
        {/* Selector de variantes */}
        {jewelry?.variants && jewelry.variants.length > 0 && (
          <div className="variant-selector">
            <h3>Variantes de color</h3>
            <div className="variant-buttons">
              {jewelry.variants.map((variant) => (
                <button
                  key={variant.id}
                  className={`variant-button ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                  onClick={() => handleVariantChange(variant)}
                  style={{ backgroundColor: variant.hex_code || variant.color }}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Joyas de la misma categoría (todas sin duplicados) */}
        <div className="jewelries-section">
          <h3>{category?.name}</h3>
          <div className="jewelry-carousel">
            {/* Todas las joyas en orden, remarcar la seleccionada */}
            {allCategoryJewelries.map((item) => (
              <div
                key={item.id}
                className={`mini-jewelry-card ${item.id === jewelry.id ? 'selected' : ''}`}
                onClick={() => item.id !== jewelry.id && handleJewelryChange(item.id)}
              >
                <div className="mini-jewelry-image">
                  {item.name}
                </div>
                <p className="mini-jewelry-name">{item.name}</p>
                {item.id === jewelry.id && <div className="selected-badge">Seleccionado</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;
