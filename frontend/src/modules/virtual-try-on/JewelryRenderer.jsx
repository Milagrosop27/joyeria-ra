import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const JewelryRenderer = ({ modelUrl, position, rotation, scale, onModelLoaded }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    console.log('JewelryRenderer useEffect ejecutado, modelUrl:', modelUrl);
    if (!containerRef.current) {
      console.log('No se puede inicializar: containerRef.current no existe');
      return;
    }

    console.log('Iniciando inicialización de Three.js...');
    // Inicializar escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Inicializar cámara
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2; // Más cerca para ver mejor el modelo
    cameraRef.current = camera;

    // Inicializar renderizador
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Fondo completamente transparente
    
    // Crear canvas directamente con estilos de transparencia
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.backgroundColor = 'transparent';
    canvas.style.background = 'none';
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'block';
    
    containerRef.current.appendChild(canvas);
    rendererRef.current = renderer;
    console.log('Renderizador Three.js inicializado');

    // Añadir iluminación básica
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    // Función de animación
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cargar modelo 3D si hay URL
    console.log('Verificando carga de modelo: modelUrl:', modelUrl);
    if (modelUrl) {
      const fullModelUrl = modelUrl.startsWith('http') ? modelUrl : `${API_URL}${modelUrl}`;
      console.log('Iniciando carga de modelo:', fullModelUrl);
      
      // Ocultar canvas inicialmente
      if (renderer.domElement) {
        renderer.domElement.style.opacity = '0';
      }
      
      const loader = new GLTFLoader();
      loader.load(
        fullModelUrl,
        (gltf) => {
          console.log('Modelo cargado exitosamente:', gltf);
          const model = gltf.scene;
          modelRef.current = model;
          scene.add(model);
          
          // Mostrar canvas cuando el modelo se carga
          if (renderer.domElement) {
            renderer.domElement.style.opacity = '1';
          }
          
          if (onModelLoaded) {
            onModelLoaded(model);
          }
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading model:', error);
        }
      );
    } else {
      console.warn('No se puede cargar el modelo: no hay modelUrl');
    }

    // Cleanup
    return () => {
      console.log('Limpiando JewelryRenderer');
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
      }
      if (containerRef.current && rendererRef.current?.domElement) {
        if (containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }
    };
  }, [modelUrl, onModelLoaded]);

  // Actualizar posición del modelo en tiempo real
  useEffect(() => {
    if (!modelRef.current || !position) return;
    
    // Convertir coordenadas normalizadas (0-1) a coordenadas de pantalla
    const containerWidth = containerRef.current?.clientWidth || 640;
    const containerHeight = containerRef.current?.clientHeight || 480;
    
    // MediaPipe devuelve coordenadas 0-1 (izquierda-derecha, arriba-abajo)
    // Three.js usa coordenadas centradas (-1 a 1)
    const x = (position.x - 0.5) * 2;
    const y = -(position.y - 0.5) * 2; // Invertir Y para Three.js
    const z = position.z * 2;
    
    modelRef.current.position.set(x, y, z);
  }, [position]);

  // Actualizar rotación del modelo en tiempo real
  useEffect(() => {
    if (!modelRef.current || !rotation) return;
    modelRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
  }, [rotation]);

  // Actualizar escala del modelo en tiempo real
  useEffect(() => {
    if (!modelRef.current || !scale) return;
    modelRef.current.scale.set(scale.x, scale.y, scale.z);
  }, [scale]);

  return (
    <div
      ref={containerRef}
      className="jewelry-renderer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
        background: 'transparent !important',
        backgroundColor: 'transparent !important'
      }}
    />
  );
};

export default JewelryRenderer;
