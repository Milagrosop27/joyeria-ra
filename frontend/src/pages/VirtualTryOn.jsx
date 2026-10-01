import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import axios from 'axios';
import CameraView from '../modules/virtual-try-on/CameraView';
import JewelryRendererModelViewer from '../modules/virtual-try-on/JewelryRendererModelViewer';
import NeckOccluder from '../modules/virtual-try-on/NeckOccluder';
import YOLOTracking from '../modules/virtual-try-on/YOLOTracking';
import FaceTracking from '../modules/virtual-try-on/FaceTracking';
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
  const [useYOLO, setUseYOLO] = useState(false); // Desactivado - usar solo MediaPipe Pose
  const faceTrackingRef = useRef(null);
  const handTrackingRef = useRef(null);
  const poseTrackingRef = useRef(null);
  const yoloTrackingRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Posición y rotación del modelo 3D - usar refs para evitar re-renders en cada frame
  const modelPositionRef = useRef({ x: 0.5, y: 0.5, z: 0 });
  const modelRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const modelScaleRef = useRef({ x: 1, y: 1, z: 1 });
  
  // Estado solo para inicialización y cambios importantes
  const [modelPosition, setModelPosition] = useState({ x: 0.5, y: 0.5, z: 0 });
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });
  const [modelScale, setModelScale] = useState({ x: 1, y: 1, z: 1 });
  const [arSupported, setArSupported] = useState(true);
  
  // Para visualización de landmarks de depuración - usar refs para evitar re-renders
  const debugLandmarksRef = useRef(null);
  const [debugLandmarks, setDebugLandmarks] = useState(null); // Solo para inicial
  const [debugNeck, setDebugNeck] = useState(null);
  const [showDebug, setShowDebug] = useState(true);
  const trackingStatusRef = useRef('Inicializando...');
  const [trackingStatus, setTrackingStatus] = useState('Inicializando...'); // Solo para inicial

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar soporte AR
        const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        const hasWebGL = (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
          } catch (e) {
            return false;
          }
        })();
        
        setArSupported(hasMediaDevices && hasWebGL);
        
        if (!hasMediaDevices) {
          setError('Tu dispositivo no soporta acceso a la cámara. La experiencia AR no está disponible.');
          setLoading(false);
          return;
        }

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
          console.log('Categoría detectada:', categoryName);
          
          if (categoryName.includes('arete') || categoryName.includes('arito') || categoryName.includes('anillo')) {
            setTrackingType('face');
            console.log('✓ Tracking type: face (aretes/anillos)');
          } else if (categoryName.includes('pulsera')) {
            setTrackingType('hand');
            console.log('✓ Tracking type: hand (pulseras)');
          } else if (categoryName.includes('collar')) {
            setTrackingType('pose');
            console.log('✓ Tracking type: pose (collares)');
          } else {
            console.log('⚠️ Categoría no reconocida, usando pose por defecto');
            setTrackingType('pose');
          }
        } else {
          console.log('⚠️ No se pudo determinar categoría, usando pose por defecto');
          setTrackingType('pose');
        }
        
        // Cargar todas las joyas de la misma categoría
        const catalogData = await getCatalog();
        const sameCategoryJewelries = catalogData.filter(j => j.category_id === jewelryData.category_id);
        setAllCategoryJewelries(sameCategoryJewelries);
        
        // Establecer variante por defecto
        if (jewelryData.variants && jewelryData.variants.length > 0) {
          setSelectedVariant(jewelryData.variants[0]);
          
          // Aplicar configuración del modelo 3D desde la BD
          const variant = jewelryData.variants[0];
          if (variant.models3d && variant.models3d.length > 0) {
            const model3d = variant.models3d[0];
            setModelScale({
              x: model3d.scale_factor || 1,
              y: model3d.scale_factor || 1,
              z: model3d.scale_factor || 1
            });
            setModelRotation({
              x: model3d.rotation_x || 0,
              y: model3d.rotation_y || 0,
              z: model3d.rotation_z || 0
            });
          }
        }
        
      } catch (err) {
        setError('No se pudo cargar la información de la joya.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Inicializar tracking cuando se determine el tipo (solo una vez)
  useEffect(() => {
    if (!trackingType) {
      console.log('No se puede iniciar tracking: trackingType es null');
      return;
    }

    console.log('Iniciando tracking para tipo:', trackingType);

    let trackingInstance;
    let animationId;

    const startTracking = async () => {
      try {
        console.log('=== INICIANDO TRACKING ===');
        console.log('Tipo de tracking:', trackingType);

        // Inicializar el tipo correcto de tracking según la categoría
        if (trackingType === 'face') {
          console.log('Usando MediaPipe Face Mesh (detecta orejas para aretes)');
          setTrackingStatus('⏳ Cargando MediaPipe Face Mesh...');
          trackingInstance = new FaceTracking();
          await trackingInstance.initialize();
          console.log('✅ MediaPipe Face Mesh inicializado');
        } else if (trackingType === 'hand') {
          console.log('Usando MediaPipe Hands (detecta manos para pulseras)');
          setTrackingStatus('⏳ Cargando MediaPipe Hands...');
          trackingInstance = new HandTracking();
          await trackingInstance.initialize();
          console.log('✅ MediaPipe Hands inicializado');
        } else {
          console.log('Usando MediaPipe Pose (detecta 33 puntos clave para collares)');
          setTrackingStatus('⏳ Cargando MediaPipe Pose...');
          trackingInstance = new PoseTracking();
          await trackingInstance.initialize();
          console.log('✅ MediaPipe Pose inicializado');
        }

        // Configurar callback - SOLO usar refs, NO actualizar estado en cada frame
        trackingInstance.setOnResults((results) => {
          if (trackingType === 'face' && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            trackingStatusRef.current = '✅ Cara detectada - ' + results.multiFaceLandmarks[0].length + ' puntos clave';
          } else if (trackingType === 'hand' && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            trackingStatusRef.current = '✅ Mano detectada - ' + results.multiHandLandmarks[0].length + ' puntos clave';
          } else if (trackingType === 'pose' && results.poseLandmarks && results.poseLandmarks.length > 0) {
            trackingStatusRef.current = '✅ Cuerpo detectado - ' + results.poseLandmarks.length + ' puntos clave';
          } else {
            trackingStatusRef.current = '⏳ Buscando...';
          }

          handleTrackingResults(results, trackingType, false);
        });
        
        console.log('Callback configurado. Iniciando procesamiento de frames...');
        
        let isProcessing = false;
        let mediaPipeFailed = false;
        
        const processFrame = async () => {
          if (videoRef.current && trackingInstance && !isProcessing && !mediaPipeFailed) {
            // Verificar que el video tiene dimensiones válidas y está activo
            if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0 || 
                videoRef.current.readyState !== 4) {
              // Video no está listo, esperar
              animationId = requestAnimationFrame(processFrame);
              return;
            }
            
            isProcessing = true;
            try {
              await trackingInstance.processFrame(videoRef.current);
            } catch (error) {
              console.error('Error procesando frame:', error);
              // Si MediaPipe falla, marcar como fallado y detener el bucle
              if (error.message && error.message.includes('Aborted')) {
                mediaPipeFailed = true;
                console.error('MediaPipe colapsó, deteniendo tracking');
                return;
              }
            } finally {
              isProcessing = false;
            }
          }
          animationId = requestAnimationFrame(processFrame);
        };

        // Iniciar el bucle de procesamiento
        console.log('Iniciando bucle de frames...');
        processFrame();
      } catch (error) {
        console.error('Error inicializando tracking:', error);
        setError('Error al inicializar el tracking de cuerpo: ' + error.message);
        setTrackingStatus('❌ Error: ' + error.message);
      }
    };

    // Esperar a que el video esté listo antes de iniciar tracking
    if (videoRef.current) {
      startTracking();
    } else {
      console.log('Video no está listo aún, esperando...');
      const checkVideo = setInterval(() => {
        if (videoRef.current) {
          clearInterval(checkVideo);
          startTracking();
        }
      }, 500);
      
      return () => clearInterval(checkVideo);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (trackingInstance) {
        trackingInstance.cleanup();
      }
    };
  }, [trackingType]); // Solo depende de trackingType, no de useYOLO

  // Actualizar UI de estado y landmarks cada 500ms (separado del tracking)
  useEffect(() => {
    if (!trackingType) return;
    
    const uiUpdateInterval = setInterval(() => {
      setTrackingStatus(trackingStatusRef.current);
      if (debugLandmarksRef.current) {
        setDebugLandmarks(debugLandmarksRef.current);
      }
      setDebugNeck({ ...modelPositionRef.current });
    }, 500);
    
    return () => clearInterval(uiUpdateInterval);
  }, [trackingType]);

  // Procesar frames de video para tracking
  const handleVideoReady = (videoElement) => {
    videoRef.current = videoElement;
    console.log('Video listo para tracking. Elemento de video:', videoElement);
    console.log('Dimensiones del video:', videoElement.videoWidth, 'x', videoElement.videoHeight);
  };

  // Procesar resultados del tracking - usar refs para evitar re-renders en cada frame
  const handleTrackingResults = (results, type, isYOLO = false) => {
    if (!results) return;

    let position = modelPositionRef.current;
    let rotation = modelRotationRef.current;
    let scale = modelScaleRef.current;

    if (isYOLO) {
      // Resultados de YOLO
      const landmarks = results.landmarks;
      
      if (!landmarks || landmarks.length === 0) {
        console.log('YOLO no detectó landmarks');
        return;
      }

      console.log('YOLO landmarks detectados:', landmarks.length);
      setDebugLandmarks(landmarks);

      const yoloTracking = new YOLOTracking();

      if (type === 'pose') {
        // Collar - usar cuello
        const neckPosition = yoloTracking.getNeckPosition(landmarks);
        if (neckPosition) {
          position = neckPosition;
          console.log('YOLO - Posición del cuello:', position);
        }

        // Escalar según ancho de hombros
        const shoulderWidth = yoloTracking.getShoulderWidth(landmarks);
        const baseScale = selectedVariant?.models3d?.[0]?.scale_factor || 1;
        scale = {
          x: shoulderWidth * baseScale * 1.2,
          y: shoulderWidth * baseScale * 1.2,
          z: shoulderWidth * baseScale * 1.2
        };

      } else if (type === 'face') {
        // Aretes - usar orejas
        const earPositions = yoloTracking.getEarPositions(landmarks);
        if (earPositions) {
          position = {
            x: earPositions.left.x,
            y: earPositions.left.y,
            z: 0
          };
        }

      } else if (type === 'hand') {
        // Pulseras - usar muñeca
        const wristPosition = yoloTracking.getWristPosition(landmarks);
        if (wristPosition) {
          position = wristPosition;
        }
      }
    } else {
      // Resultados de MediaPipe (fallback)
      if (type === 'face' && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const faceTracking = new FaceTracking();
        
        setDebugLandmarks(landmarks);
        
        const earPositions = faceTracking.getEarPositions(landmarks);
        if (earPositions) {
          position = {
            x: earPositions.left.x,
            y: earPositions.left.y,
            z: earPositions.left.z
          };
        }

        rotation = faceTracking.getFaceRotation(landmarks);
        
        // Escalar aretes basado en distancia entre orejas
        const earDistance = Math.sqrt(
          Math.pow(earPositions.right.x - earPositions.left.x, 2) +
          Math.pow(earPositions.right.y - earPositions.left.y, 2)
        );
        const baseScale = selectedVariant?.models3d?.[0]?.scale_factor || 1;
        scale = {
          x: earDistance * baseScale * 2.0,
          y: earDistance * baseScale * 2.0,
          z: earDistance * baseScale * 2.0
        };

      } else if (type === 'pose' && results.poseLandmarks && results.poseLandmarks.length > 0) {
        const mirroredLandmarks = results.poseLandmarks.map((landmark) => ({
          ...landmark,
          x: 1 - landmark.x
        }));

        debugLandmarksRef.current = mirroredLandmarks;

        const poseTracking = new PoseTracking();
        const necklaceFit = poseTracking.getNecklaceFit(mirroredLandmarks);
        if (necklaceFit) {
          position = necklaceFit.position;
          rotation = necklaceFit.rotation;
          const baseScale = selectedVariant?.models3d?.[0]?.scale_factor || 1;
          const overlayScale = Math.min(0.28, Math.max(0.11, necklaceFit.span * 0.55 * baseScale));
          scale = {
            x: overlayScale,
            y: overlayScale,
            z: overlayScale
          };
        }

      } else if (type === 'face' && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const mirroredLandmarks = landmarks.map((landmark) => ({
          ...landmark,
          x: 1 - landmark.x
        }));

        debugLandmarksRef.current = mirroredLandmarks;

        const faceTracking = new FaceTracking();
        const earPositions = faceTracking.getEarPositions(mirroredLandmarks);
        if (earPositions) {
          position = {
            x: earPositions.left.x,
            y: earPositions.left.y,
            z: earPositions.left.z
          };
        }

        rotation = faceTracking.getFaceRotation(mirroredLandmarks);

        // Escalar aretes basado en distancia entre orejas
        const earDistance = Math.sqrt(
          Math.pow(earPositions.right.x - earPositions.left.x, 2) +
          Math.pow(earPositions.right.y - earPositions.left.y, 2)
        );
        const baseScale = selectedVariant?.models3d?.[0]?.scale_factor || 1;
        scale = {
          x: earDistance * baseScale * 2.0,
          y: earDistance * baseScale * 2.0,
          z: earDistance * baseScale * 2.0
        };

      } else if (type === 'hand' && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const handTracking = new HandTracking();
        
        setDebugLandmarks(landmarks);
        
        const wristPosition = handTracking.getWristPosition(landmarks);
        if (wristPosition) {
          position = {
            x: wristPosition.x,
            y: wristPosition.y,
            z: wristPosition.z
          };
        }

        rotation = handTracking.getHandRotation(landmarks);
        
        // Escalar pulseras basado en tamaño de la mano
        const wrist = landmarks[0];
        const middleFinger = landmarks[12];
        const handSize = Math.sqrt(
          Math.pow(middleFinger.x - wrist.x, 2) +
          Math.pow(middleFinger.y - wrist.y, 2)
        );
        const baseScale = selectedVariant?.models3d?.[0]?.scale_factor || 1;
        scale = {
          x: handSize * baseScale * 3.0,
          y: handSize * baseScale * 3.0,
          z: handSize * baseScale * 3.0
        };
      }
    }

    // Actualizar refs directamente para evitar re-renders
    modelPositionRef.current = position;
    modelRotationRef.current = rotation;
    modelScaleRef.current = scale;
    
    // No actualizar estado en cada frame - solo cuando sea necesario
    // El componente JewelryRendererModelViewer leerá de los refs
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
          {!arSupported && (
            <p style={{ fontSize: '0.9rem', marginTop: '10px', color: '#999' }}>
              La experiencia AR requiere acceso a la cámara y soporte WebGL.
            </p>
          )}
          <Link to="/catalogo">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const modelUrl = selectedVariant?.models3d?.[0]?.file_url || jewelry?.variants?.[0]?.models3d?.[0]?.file_url;
  const API_URL = 'http://localhost:3000';
  const fullModelUrl = modelUrl?.startsWith('http') ? modelUrl : `${API_URL}${modelUrl}`;

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
          
          {/* Mensaje pequeño de estado del tracking en esquina */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '500',
            textAlign: 'left',
            zIndex: 10,
            border: '1px solid #D4AF37'
          }}>
            {trackingStatus}
          </div>
          
          {/* Visualización de landmarks de depuración */}
          {showDebug && debugLandmarks && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 4
            }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Dibujar TODOS los 33 puntos de MediaPipe Pose */}
                {debugLandmarks && debugLandmarks.map((landmark, index) => {
                  const visibility = landmark.visibility || 0;
                  const color = visibility > 0.5 ? '#00ff00' : visibility > 0.3 ? '#ffff00' : '#ff0000';
                  const radius = index < 11 ? 8 : 5; // Puntos de cara/hombros más grandes
                  
                  return (
                    <circle
                      key={index}
                      cx={landmark.x * 100 + '%'}
                      cy={landmark.y * 100 + '%'}
                      r={radius}
                      fill={color}
                      opacity={Math.max(0.3, visibility)}
                    />
                  );
                })}
                
                {trackingType === 'pose' && debugNeck && (
                  <circle
                    cx={debugNeck.x * 100 + '%'}
                    cy={debugNeck.y * 100 + '%'}
                    r="15"
                    fill="yellow"
                    opacity="0.8"
                    stroke="white"
                    strokeWidth="3"
                  />
                )}
              </svg>
              
              {/* Leyenda */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0,0,0,0.85)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                zIndex: 4,
                maxWidth: '200px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#D4AF37' }}>
                  Puntos detectados (33 total)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', background: '#00ff00', borderRadius: '50%' }}></div>
                  <span>Visible (alta confianza)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', background: '#ffff00', borderRadius: '50%' }}></div>
                  <span>Parcialmente visible</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '10px', height: '10px', background: '#ff0000', borderRadius: '50%' }}></div>
                  <span>No visible / baja confianza</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '15px', height: '15px', background: 'yellow', borderRadius: '50%', border: '2px solid white' }}></div>
                  <span>Cuello detectado</span>
                </div>
              </div>
            </div>
          )}
          
          {fullModelUrl && (
            <JewelryRendererModelViewer
              modelUrl={fullModelUrl}
              positionRef={modelPositionRef}
              rotationRef={modelRotationRef}
              scaleRef={modelScaleRef}
              onModelLoaded={() => console.log('Modelo cargado')}
            />
          )}

          {/* NeckOccluder desactivado - los landmarks de Pose no siguen bien la cara */}
          {/* {trackingType === 'pose' && (
            <NeckOccluder
              videoRef={videoRef}
              landmarksRef={debugLandmarksRef}
              neckRef={modelPositionRef}
            />
          )} */}
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
