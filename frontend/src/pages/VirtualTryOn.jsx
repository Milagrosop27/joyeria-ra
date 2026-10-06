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

  // Detectar modo debug desde URL
  const urlParams = new URLSearchParams(window.location.search);
  const isDebugMode = urlParams.get('debug') === '1';
  
  const [jewelry, setJewelry] = useState(null);
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allCategoryJewelries, setAllCategoryJewelries] = useState([]);
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

  // Puntos de anclaje del collar (para debug)
  const anchorPointsRef = useRef({ left: null, right: null });

  // Posiciones de las orejas para aretes (izquierda y derecha)
  const earPositionsRef = useRef({ left: null, right: null });
  const earlobePositionsRef = useRef({ left: null, right: null, faceWidth: 0 });
  const smoothedLobePositionsRef = useRef({ left: null, right: null, faceWidth: 0 });
  const smoothedScaleRef = useRef(0);
  const poseResultsRef = useRef(null); // Para guardar resultados de Pose en modo aretes

  // Constante para ajuste lateral de aretes (fácil de editar)
  const EAR_OFFSET_X = 0.06; // 6% del ancho de cara hacia afuera

  // Sliders de debug (collares y aretes)
  const [debugConfig, setDebugConfig] = useState({
    anchorHeightPercent: 0.65,
    anchorLateralPercent: 0.28,
    scaleY: 1.0,
    offsetX: 0,
    offsetY: 0,
    cutOffset: 0, // Offset del corte en px respecto al punto del cuello (negativo = subir, positivo = bajar)
    noseLipHeightPercent: 0.5, // Altura del lóbulo (% entre nariz y labio)
    lateralOffsetPercent: EAR_OFFSET_X, // Separación lateral del lóbulo (% del ancho de cara)
    earringLobeDropPercent: 0.20, // Bajada al lóbulo desde Pose landmarks (% del alto de cara)
    earringSizePercent: 0.225, // Tamaño del arete (% del alto de la cara)
    earringOffsetX: 0, // Offset X para aretes
    earringOffsetY: 0 // Offset Y para aretes
  });
  
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

  // Refs para suavizado de pulsera
  const smoothedBraceletPositionRef = useRef(null);
  const smoothedBraceletScaleRef = useRef(null);
  const smoothedBraceletRotationRef = useRef(null);

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

        // Precargar GLB de todas las joyas de la misma categoría para cambio rápido
        const API_URL = 'http://localhost:3000';
        const preloadPromises = [];
        sameCategoryJewelries.forEach(jewelry => {
          if (jewelry.models3d && jewelry.models3d.length > 0) {
            const modelUrl = jewelry.models3d[0].file_url;
            const fullUrl = modelUrl?.startsWith('http') ? modelUrl : `${API_URL}${modelUrl}`;
            const promise = fetch(fullUrl)
              .then(response => {
                if (response.ok) {
                  return response.blob();
                }
              })
              .catch(() => {});
            preloadPromises.push(promise);
          }
        });
        console.log('Precargando', preloadPromises.length, 'modelos GLB...');

        // Aplicar configuración del modelo 3D desde la BD
        if (jewelryData.models3d && jewelryData.models3d.length > 0) {
          const model3d = jewelryData.models3d[0];
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

          // También iniciar Pose para obtener landmarks de oreja (7 y 8)
          console.log('Iniciando Pose adicional para landmarks de oreja');
          poseTrackingRef.current = new PoseTracking();
          await poseTrackingRef.current.initialize();
          console.log('✅ Pose adicional inicializado');

          // Configurar callback de Pose para guardar resultados
          poseTrackingRef.current.setOnResults((poseResults) => {
            poseResultsRef.current = poseResults;
          });
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
            trackingStatusRef.current = '✅ Mano detectada';
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
              // En modo aretes, también procesar Pose para obtener landmarks de oreja
              if (trackingType === 'face' && poseTrackingRef.current) {
                await poseTrackingRef.current.processFrame(videoRef.current);
              }
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
        const baseScale = jewelry?.models3d?.[0]?.scale_factor || 1;
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
        // Espejar landmarks para coincidir con el video espejado (scaleX(-1))
        const mirroredLandmarks = landmarks.map((landmark) => ({
          ...landmark,
          x: 1 - landmark.x
        }));
        const faceTracking = new FaceTracking();

        setDebugLandmarks(mirroredLandmarks);

        // Intentar usar landmarks de Pose (7 y 8) para orejas
        let usePoseEars = false;
        let poseEarPositions = null;
        if (poseResultsRef.current && poseResultsRef.current.poseLandmarks) {
          const poseLandmarks = poseResultsRef.current.poseLandmarks;
          const leftEar = poseLandmarks[7]; // Oreja izquierda
          const rightEar = poseLandmarks[8]; // Oreja derecha

          // Verificar visibilidad
          if (leftEar && rightEar && (leftEar.visibility || 0) > 0.5 && (rightEar.visibility || 0) > 0.5) {
            // Espejar landmarks de Pose
            poseEarPositions = {
              left: { x: 1 - leftEar.x, y: leftEar.y, z: leftEar.z },
              right: { x: 1 - rightEar.x, y: rightEar.y, z: rightEar.z }
            };
            usePoseEars = true;
          }
        }

        let earlobePositions;
        if (usePoseEars && poseEarPositions) {
          // Usar Pose landmarks: bajar ~10% del alto de cara hacia el lóbulo
          const faceTop = landmarks[10];
          const chin = landmarks[152];
          const faceHeight = Math.hypot(chin.x - faceTop.x, chin.y - faceTop.y);
          const lobeDropPercent = debugConfig.earringLobeDropPercent ?? 0.10;
          const lateralOffset = faceHeight * (debugConfig.lateralOffsetPercent || 0.10);

          earlobePositions = {
            left: {
              x: poseEarPositions.left.x - lateralOffset,
              y: poseEarPositions.left.y + faceHeight * lobeDropPercent,
              z: poseEarPositions.left.z
            },
            right: {
              x: poseEarPositions.right.x + lateralOffset,
              y: poseEarPositions.right.y + faceHeight * lobeDropPercent,
              z: poseEarPositions.right.z
            },
            faceHeight
          };
        } else {
          // Respaldo: usar estimación facial actual
          earlobePositions = faceTracking.getEarlobePositions(mirroredLandmarks, debugConfig);
        }

        const earPositions = faceTracking.getEarPositions(mirroredLandmarks);
        if (earPositions) {
          earPositionsRef.current = earPositions;
        }
        if (earlobePositions) {
          earlobePositionsRef.current = earlobePositions;

          // Suavizar posiciones con filtro exponencial (alpha = 0.3)
          const alpha = 0.3;
          if (smoothedLobePositionsRef.current.left) {
            smoothedLobePositionsRef.current.left = {
              x: smoothedLobePositionsRef.current.left.x + alpha * (earlobePositions.left.x - smoothedLobePositionsRef.current.left.x),
              y: smoothedLobePositionsRef.current.left.y + alpha * (earlobePositions.left.y - smoothedLobePositionsRef.current.left.y),
              z: smoothedLobePositionsRef.current.left.z + alpha * (earlobePositions.left.z - smoothedLobePositionsRef.current.left.z)
            };
            smoothedLobePositionsRef.current.right = {
              x: smoothedLobePositionsRef.current.right.x + alpha * (earlobePositions.right.x - smoothedLobePositionsRef.current.right.x),
              y: smoothedLobePositionsRef.current.right.y + alpha * (earlobePositions.right.y - smoothedLobePositionsRef.current.right.y),
              z: smoothedLobePositionsRef.current.right.z + alpha * (earlobePositions.right.z - smoothedLobePositionsRef.current.right.z)
            };
            smoothedLobePositionsRef.current.faceWidth = smoothedLobePositionsRef.current.faceWidth + alpha * (earlobePositions.faceWidth - smoothedLobePositionsRef.current.faceWidth);
          } else {
            smoothedLobePositionsRef.current = { ...earlobePositions };
          }

          // Calcular escala basada en alto de la cara (20-25%)
          const faceHeight = earlobePositions.faceHeight || 0.3;
          const baseScale = jewelry?.models3d?.[0]?.scale_factor || 1;
          const targetScale = faceHeight * (debugConfig.earringSizePercent || 0.225) * baseScale;

          // Suavizar escala
          if (smoothedScaleRef.current > 0) {
            smoothedScaleRef.current = smoothedScaleRef.current + alpha * (targetScale - smoothedScaleRef.current);
          } else {
            smoothedScaleRef.current = targetScale;
          }

          scale = {
            x: smoothedScaleRef.current,
            y: smoothedScaleRef.current,
            z: smoothedScaleRef.current
          };
        }

        rotation = faceTracking.getEarringRotation(mirroredLandmarks);

      } else if (type === 'pose' && results.poseLandmarks && results.poseLandmarks.length > 0) {
        const mirroredLandmarks = results.poseLandmarks.map((landmark) => ({
          ...landmark,
          x: 1 - landmark.x
        }));

        debugLandmarksRef.current = mirroredLandmarks;

        const poseTracking = new PoseTracking();
        const necklaceFit = poseTracking.getNecklaceFit(mirroredLandmarks, debugConfig);
        if (necklaceFit) {
          position = necklaceFit.position;
          rotation = necklaceFit.rotation;
          anchorPointsRef.current = necklaceFit.anchorPoints || { left: null, right: null };

          const baseScale = jewelry?.models3d?.[0]?.scale_factor || 1;
          const overlayScale = Math.min(0.28, Math.max(0.11, necklaceFit.span * 0.55 * baseScale));
          scale = {
            x: overlayScale,
            y: overlayScale * debugConfig.scaleY,
            z: overlayScale
          };

          // Aplicar offsets de debug
          position.x += debugConfig.offsetX;
          position.y += debugConfig.offsetY;
        }

      } else if (type === 'face' && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        // Espejar landmarks para coincidir con el video espejado (scaleX(-1))
        const mirroredLandmarks = landmarks.map((landmark) => ({
          ...landmark,
          x: 1 - landmark.x
        }));
        debugLandmarksRef.current = mirroredLandmarks;

        const faceTracking = new FaceTracking();

        // Intentar usar landmarks de Pose (7 y 8) para orejas
        let usePoseEars = false;
        let poseEarPositions = null;
        if (poseResultsRef.current && poseResultsRef.current.poseLandmarks) {
          const poseLandmarks = poseResultsRef.current.poseLandmarks;
          const leftEar = poseLandmarks[7]; // Oreja izquierda
          const rightEar = poseLandmarks[8]; // Oreja derecha

          // Verificar visibilidad
          if (leftEar && rightEar && (leftEar.visibility || 0) > 0.5 && (rightEar.visibility || 0) > 0.5) {
            // Espejar landmarks de Pose
            poseEarPositions = {
              left: { x: 1 - leftEar.x, y: leftEar.y, z: leftEar.z },
              right: { x: 1 - rightEar.x, y: rightEar.y, z: rightEar.z }
            };
            usePoseEars = true;
          }
        }

        let earlobePositions;
        if (usePoseEars && poseEarPositions) {
          // Usar Pose landmarks: bajar ~10% del alto de cara hacia el lóbulo
          const faceTop = landmarks[10];
          const chin = landmarks[152];
          const faceHeight = Math.hypot(chin.x - faceTop.x, chin.y - faceTop.y);
          const lobeDropPercent = debugConfig.earringLobeDropPercent ?? 0.10;
          const lateralOffset = faceHeight * (debugConfig.lateralOffsetPercent || 0.10);

          earlobePositions = {
            left: {
              x: poseEarPositions.left.x - lateralOffset,
              y: poseEarPositions.left.y + faceHeight * lobeDropPercent,
              z: poseEarPositions.left.z
            },
            right: {
              x: poseEarPositions.right.x + lateralOffset,
              y: poseEarPositions.right.y + faceHeight * lobeDropPercent,
              z: poseEarPositions.right.z
            },
            faceHeight
          };
        } else {
          // Respaldo: usar estimación facial actual
          earlobePositions = faceTracking.getEarlobePositions(mirroredLandmarks, debugConfig);
        }

        const earPositions = faceTracking.getEarPositions(mirroredLandmarks);
        if (earPositions) {
          earPositionsRef.current = earPositions;
        }
        if (earlobePositions) {
          earlobePositionsRef.current = earlobePositions;

          // Suavizar posiciones con filtro exponencial (alpha = 0.3)
          const alpha = 0.3;
          if (smoothedLobePositionsRef.current.left) {
            smoothedLobePositionsRef.current.left = {
              x: smoothedLobePositionsRef.current.left.x + alpha * (earlobePositions.left.x - smoothedLobePositionsRef.current.left.x),
              y: smoothedLobePositionsRef.current.left.y + alpha * (earlobePositions.left.y - smoothedLobePositionsRef.current.left.y),
              z: smoothedLobePositionsRef.current.left.z + alpha * (earlobePositions.left.z - smoothedLobePositionsRef.current.left.z)
            };
            smoothedLobePositionsRef.current.right = {
              x: smoothedLobePositionsRef.current.right.x + alpha * (earlobePositions.right.x - smoothedLobePositionsRef.current.right.x),
              y: smoothedLobePositionsRef.current.right.y + alpha * (earlobePositions.right.y - smoothedLobePositionsRef.current.right.y),
              z: smoothedLobePositionsRef.current.right.z + alpha * (earlobePositions.right.z - smoothedLobePositionsRef.current.right.z)
            };
            smoothedLobePositionsRef.current.faceWidth = smoothedLobePositionsRef.current.faceWidth + alpha * (earlobePositions.faceWidth - smoothedLobePositionsRef.current.faceWidth);
          } else {
            smoothedLobePositionsRef.current = { ...earlobePositions };
          }

          // Calcular escala basada en alto de la cara (20-25%)
          const faceHeight = earlobePositions.faceHeight || 0.3;
          const baseScale = jewelry?.models3d?.[0]?.scale_factor || 1;
          const targetScale = faceHeight * (debugConfig.earringSizePercent || 0.225) * baseScale;

          // Suavizar escala
          if (smoothedScaleRef.current > 0) {
            smoothedScaleRef.current = smoothedScaleRef.current + alpha * (targetScale - smoothedScaleRef.current);
          } else {
            smoothedScaleRef.current = targetScale;
          }

          scale = {
            x: smoothedScaleRef.current,
            y: smoothedScaleRef.current,
            z: smoothedScaleRef.current
          };
        }

        rotation = faceTracking.getEarringRotation(mirroredLandmarks);

      } else if (type === 'hand' && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        // Espejar landmarks para coincidir con el video espejado (scaleX(-1))
        const mirroredLandmarks = landmarks.map((landmark) => ({
          ...landmark,
          x: 1 - landmark.x
        }));
        const handTracking = new HandTracking();

        setDebugLandmarks(mirroredLandmarks);

        // Calcular posición, tamaño y rotación de la pulsera
        const braceletPosition = handTracking.getBraceletPosition(mirroredLandmarks, 0.2);
        const braceletScale = handTracking.getBraceletScale(mirroredLandmarks, jewelry?.models3d?.[0]?.scale_factor || 1);
        const braceletRotation = handTracking.getBraceletRotation(mirroredLandmarks, 70); // 70° para aspecto de banda

        if (braceletPosition) {
          // Suavizar posición con filtro exponencial (alpha = 0.3)
          const alpha = 0.3;
          if (smoothedBraceletPositionRef.current) {
            smoothedBraceletPositionRef.current = {
              x: smoothedBraceletPositionRef.current.x + alpha * (braceletPosition.x - smoothedBraceletPositionRef.current.x),
              y: smoothedBraceletPositionRef.current.y + alpha * (braceletPosition.y - smoothedBraceletPositionRef.current.y),
              z: smoothedBraceletPositionRef.current.z + alpha * (braceletPosition.z - smoothedBraceletPositionRef.current.z)
            };
          } else {
            smoothedBraceletPositionRef.current = { ...braceletPosition };
          }
          position = smoothedBraceletPositionRef.current;
        }

        // Suavizar escala
        if (braceletScale) {
          const alpha = 0.3;
          if (smoothedBraceletScaleRef.current) {
            smoothedBraceletScaleRef.current = smoothedBraceletScaleRef.current + alpha * (braceletScale - smoothedBraceletScaleRef.current);
          } else {
            smoothedBraceletScaleRef.current = braceletScale;
          }
          scale = {
            x: smoothedBraceletScaleRef.current,
            y: smoothedBraceletScaleRef.current,
            z: smoothedBraceletScaleRef.current
          };
        }

        // Suavizar rotación
        if (braceletRotation) {
          const alpha = 0.3;
          if (smoothedBraceletRotationRef.current) {
            smoothedBraceletRotationRef.current = {
              x: smoothedBraceletRotationRef.current.x + alpha * (braceletRotation.x - smoothedBraceletRotationRef.current.x),
              y: smoothedBraceletRotationRef.current.y + alpha * (braceletRotation.y - smoothedBraceletRotationRef.current.y),
              z: smoothedBraceletRotationRef.current.z + alpha * (braceletRotation.z - smoothedBraceletRotationRef.current.z)
            };
          } else {
            smoothedBraceletRotationRef.current = { ...braceletRotation };
          }
          rotation = smoothedBraceletRotationRef.current;
        }
      }
    }

    // Actualizar refs directamente para evitar re-renders
    modelPositionRef.current = position;
    modelRotationRef.current = rotation;
    modelScaleRef.current = scale;
    
    // No actualizar estado en cada frame - solo cuando sea necesario
    // El componente JewelryRendererModelViewer leerá de los refs
  };

  const handleJewelryChange = async (newJewelryId) => {
    // Si ya estamos en esa página, no hacer nada
    if (window.location.pathname === `/probador/${newJewelryId}`) {
      return;
    }

    try {
      // Cargar datos completos de la joya
      const jewelryData = await getJewelryById(newJewelryId);
      setJewelry(jewelryData);
      // Actualizar URL sin recargar
      window.history.pushState({}, '', `/probador/${newJewelryId}`);

      // Aplicar configuración del modelo 3D desde la BD
      if (jewelryData.models3d && jewelryData.models3d.length > 0) {
        const model3d = jewelryData.models3d[0];
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
    } catch (error) {
      console.error('Error cargando joya:', error);
    }
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

  const modelUrl = jewelry?.models3d?.[0]?.file_url;
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
        <button onClick={() => window.location.href = '/catalogo'} className="back-button">
          Volver al catálogo
        </button>
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
                {/* Dibujar puntos de landmarks */}
                {debugLandmarks && debugLandmarks.map((landmark, index) => {
                  // FaceMesh no tiene visibility, usar color verde por defecto en modo cara
                  // Hands tampoco tiene visibility, usar verde cuando hay detección
                  const color = trackingType === 'face' || trackingType === 'hand'
                    ? '#00ff00'
                    : (() => {
                        const visibility = landmark.visibility || 0;
                        return visibility > 0.5 ? '#00ff00' : visibility > 0.3 ? '#ffff00' : '#ff0000';
                      })();
                  const radius = trackingType === 'face' ? 3 : (trackingType === 'hand' ? 6 : (index < 11 ? 8 : 5));
                  const opacity = trackingType === 'face' ? 0.7 : (trackingType === 'hand' ? 0.7 : Math.max(0.3, landmark.visibility || 0));

                  return (
                    <circle
                      key={index}
                      cx={landmark.x * 100 + '%'}
                      cy={landmark.y * 100 + '%'}
                      r={radius}
                      fill={color}
                      opacity={opacity}
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

                {/* Punto rojo en el ancla de la pulsera */}
                {trackingType === 'hand' && smoothedBraceletPositionRef.current && (
                  <circle
                    cx={smoothedBraceletPositionRef.current.x * 100 + '%'}
                    cy={smoothedBraceletPositionRef.current.y * 100 + '%'}
                    r="12"
                    fill="red"
                    opacity="0.9"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}

                {/* Puntos de anclaje y línea de corte del collar (solo en modo debug) */}
                {isDebugMode && trackingType === 'pose' && anchorPointsRef.current && anchorPointsRef.current.left && anchorPointsRef.current.right && (
                  <>
                    {/* Línea de corte roja */}
                    {(() => {
                      const parent = document.querySelector('.camera-wrapper');
                      if (!parent) return null;
                      const parentHeight = parent.clientHeight || 480;
                      const midY = (anchorPointsRef.current.left.y + anchorPointsRef.current.right.y) / 2;
                      const cutOffsetPx = debugConfig.cutOffset || 0;
                      const cutY = midY - (cutOffsetPx / parentHeight);
                      return (
                        <line
                          x1="0%"
                          y1={`${cutY * 100}%`}
                          x2="100%"
                          y2={`${cutY * 100}%`}
                          stroke="red"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      );
                    })()}
                    <circle
                      cx={anchorPointsRef.current.left.x * 100 + '%'}
                      cy={anchorPointsRef.current.left.y * 100 + '%'}
                      r="12"
                      fill="red"
                      opacity="0.9"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle
                      cx={anchorPointsRef.current.right.x * 100 + '%'}
                      cy={anchorPointsRef.current.right.y * 100 + '%'}
                      r="12"
                      fill="red"
                      opacity="0.9"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* Puntos de anclaje de aretes (solo en modo debug) */}
                {isDebugMode && trackingType === 'face' && smoothedLobePositionsRef.current && smoothedLobePositionsRef.current.left && smoothedLobePositionsRef.current.right && (
                  <>
                    <circle
                      cx={smoothedLobePositionsRef.current.left.x * 100 + '%'}
                      cy={smoothedLobePositionsRef.current.left.y * 100 + '%'}
                      r="12"
                      fill="red"
                      opacity="0.9"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle
                      cx={smoothedLobePositionsRef.current.right.x * 100 + '%'}
                      cy={smoothedLobePositionsRef.current.right.y * 100 + '%'}
                      r="12"
                      fill="red"
                      opacity="0.9"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
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
                  {trackingType === 'face' ? 'Puntos detectados (478 total)' : 'Puntos detectados (33 total)'}
                </div>
                {trackingType === 'face' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#00ff00', borderRadius: '50%' }}></div>
                    <span>Cara detectada</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
                {trackingType === 'pose' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '15px', height: '15px', background: 'yellow', borderRadius: '50%', border: '2px solid white' }}></div>
                    <span>Cuello detectado</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {fullModelUrl && (
            <JewelryRendererModelViewer
              modelUrl={fullModelUrl}
              positionRef={modelPositionRef}
              rotationRef={modelRotationRef}
              scaleRef={modelScaleRef}
              anchorPointsRef={anchorPointsRef}
              earPositionsRef={earPositionsRef}
              earlobePositionsRef={smoothedLobePositionsRef}
              trackingType={trackingType}
              neckPositionRef={modelPositionRef}
              debugConfig={isDebugMode ? debugConfig : null}
              onModelLoaded={() => console.log('Modelo cargado')}
            />
          )}

          {/* Panel de debug (solo con ?debug=1) */}
          {isDebugMode && trackingType === 'face' && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '12px',
              zIndex: 100,
              maxWidth: '280px',
              border: '1px solid #D4AF37'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#D4AF37' }}>
                Calibración de Aretes
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Altura (nariz-labio): {(debugConfig.noseLipHeightPercent * 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={debugConfig.noseLipHeightPercent}
                  onChange={(e) => setDebugConfig({ ...debugConfig, noseLipHeightPercent: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Separación lateral: {(debugConfig.lateralOffsetPercent * 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.20"
                  step="0.005"
                  value={debugConfig.lateralOffsetPercent}
                  onChange={(e) => setDebugConfig({ ...debugConfig, lateralOffsetPercent: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Bajada al lóbulo: {(debugConfig.earringLobeDropPercent * 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.25"
                  step="0.01"
                  value={debugConfig.earringLobeDropPercent}
                  onChange={(e) => setDebugConfig({ ...debugConfig, earringLobeDropPercent: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Tamaño (% alto cara): {(debugConfig.earringSizePercent * 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0.15"
                  max="0.35"
                  step="0.01"
                  value={debugConfig.earringSizePercent}
                  onChange={(e) => setDebugConfig({ ...debugConfig, earringSizePercent: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Offset X: {debugConfig.earringOffsetX.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="-0.1"
                  max="0.1"
                  step="0.005"
                  value={debugConfig.earringOffsetX}
                  onChange={(e) => setDebugConfig({ ...debugConfig, earringOffsetX: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Offset Y: {debugConfig.earringOffsetY.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="-0.1"
                  max="0.1"
                  step="0.005"
                  value={debugConfig.earringOffsetY}
                  onChange={(e) => setDebugConfig({ ...debugConfig, earringOffsetY: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {isDebugMode && trackingType === 'pose' && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '12px',
              zIndex: 100,
              maxWidth: '280px',
              border: '1px solid #D4AF37'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#D4AF37' }}>
                Calibración de Collar
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Altura anclaje: {(debugConfig.anchorHeightPercent * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.8"
                  step="0.01"
                  value={debugConfig.anchorHeightPercent}
                  onChange={(e) => setDebugConfig({ ...debugConfig, anchorHeightPercent: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Separación lateral: {(debugConfig.anchorLateralPercent * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="0.4"
                  step="0.01"
                  value={debugConfig.anchorLateralPercent}
                  onChange={(e) => setDebugConfig({ ...debugConfig, anchorLateralPercent: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Escala vertical: {debugConfig.scaleY.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={debugConfig.scaleY}
                  onChange={(e) => setDebugConfig({ ...debugConfig, scaleY: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Offset X: {debugConfig.offsetX.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="-0.1"
                  max="0.1"
                  step="0.005"
                  value={debugConfig.offsetX}
                  onChange={(e) => setDebugConfig({ ...debugConfig, offsetX: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Offset Y: {debugConfig.offsetY.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="-0.1"
                  max="0.1"
                  step="0.005"
                  value={debugConfig.offsetY}
                  onChange={(e) => setDebugConfig({ ...debugConfig, offsetY: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  Altura corte: {debugConfig.cutOffset.toFixed(0)} px
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={debugConfig.cutOffset}
                  onChange={(e) => setDebugConfig({ ...debugConfig, cutOffset: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginTop: '10px', fontSize: '10px', color: '#ccc' }}>
                Config: {JSON.stringify(debugConfig)}
              </div>
            </div>
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

      {/* Panel inferior: selector de joyas */}
      <div className="tryon-panel">
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
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <span>{item.name}</span>
                  )}
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
