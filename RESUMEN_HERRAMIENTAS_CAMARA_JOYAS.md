# Resumen de Herramientas - Cámara y Joyas (Virtual Try-On)

## Descripción General
Este documento describe las tecnologías y herramientas utilizadas para implementar el sistema de prueba virtual de joyas, incluyendo el acceso a la cámara del usuario y la visualización de modelos 3D de joyas superpuestos sobre el video en tiempo real.

---

## 1. Acceso a la Cámara (CameraView.jsx)

### Ubicación
`frontend/src/modules/virtual-try-on/CameraView.jsx`

### Tecnología Principal
**Web API: navigator.mediaDevices.getUserMedia()**

### Configuración
```javascript
{
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
}
```

### Características
- **Resolución**: 1280x720 (HD)
- **Modo de cámara**: 'user' (cámara frontal)
- **Espejo**: `transform: scaleX(-1)` para experiencia natural
- **Auto-play**: El video se reproduce automáticamente
- **Muted**: El audio está silenciado (solo video)

### Funcionalidades
1. **Solicitud de permisos**: Solicita acceso a la cámara del usuario
2. **Manejo de errores**: Muestra mensajes de error si no se puede acceder a la cámara
3. **Estado de carga**: Muestra indicador mientras la cámara se inicializa
4. **Callback onVideoReady**: Notifica cuando el video está listo para usar
5. **Callback onError**: Notifica cuando ocurre un error
6. **Cleanup**: Detiene el stream cuando el componente se desmonta

### Código Clave
```javascript
stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
});

videoRef.current.srcObject = stream;
videoRef.current.onloadedmetadata = () => {
  videoRef.current.play();
  setIsStreamActive(true);
  if (onVideoReady) {
    onVideoReady(videoRef.current);
  }
};
```

---

## 2. Renderizado de Joyas 3D (JewelryRenderer.jsx)

### Ubicación
`frontend/src/modules/virtual-try-on/JewelryRenderer.jsx`

### Tecnologías Principales
- **Three.js**: Biblioteca de renderizado 3D para WebGL
- **GLTFLoader**: Loader para modelos 3D en formato .glb/.gltf

### Configuración de Three.js

#### Escena
```javascript
const scene = new THREE.Scene();
```

#### Cámara
```javascript
const camera = new THREE.PerspectiveCamera(
  75, // FOV
  containerRef.current.clientWidth / containerRef.current.clientHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
camera.position.z = 2; // Posición cercana para ver mejor el modelo
```

#### Renderizador WebGL
```javascript
const renderer = new THREE.WebGLRenderer({
  antialias: true, // Suavizado de bordes
  alpha: true, // Fondo transparente
  premultipliedAlpha: false,
  preserveDrawingBuffer: true
});
renderer.setClearColor(0x000000, 0); // Fondo completamente transparente
```

### Iluminación
```javascript
// Luz ambiental
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Luz direccional
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 1, 1).normalize();
scene.add(directionalLight);
```

### Carga de Modelos 3D
```javascript
const loader = new GLTFLoader();
loader.load(
  modelUrl, // URL del modelo .glb/.gltf
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
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
```

### Actualización Dinámica del Modelo
El componente acepta props para actualizar el modelo en tiempo real:
- **position**: {x, y, z} - Posición del modelo 3D
- **rotation**: {x, y, z} - Rotación del modelo 3D
- **scale**: {x, y, z} - Escala del modelo 3D

### Superposición sobre Cámara
```javascript
style={{
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none' // Permite clicks a través del renderizador
}}
```

### Cleanup
```javascript
rendererRef.current.dispose();
rendererRef.current.forceContextLoss();
containerRef.current.removeChild(rendererRef.current.domElement);
sceneRef.current.remove(modelRef.current);
```

---

## 3. Seguimiento de Manos (HandTracking.js)

### Ubicación
`frontend/src/modules/virtual-try-on/HandTracking.js`

### Tecnología Principal
**MediaPipe Hands** - Biblioteca de Google para detección de manos en tiempo real

### Carga desde CDN
```javascript
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
```

### Configuración
```javascript
this.hands.setOptions({
  maxNumHands: 2, // Detectar hasta 2 manos
  modelComplexity: 1, // Complejidad del modelo (0, 1)
  minDetectionConfidence: 0.5, // Confianza mínima de detección
  minTrackingConfidence: 0.5 // Confianza mínima de seguimiento
});
```

### Funcionalidades

#### Inicialización
```javascript
async initialize() {
  this.hands = new window.Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });
}
```

#### Procesamiento de Frames
```javascript
async processFrame(videoElement) {
  await this.hands.send({ image: videoElement });
}
```

#### Obtención de Posición de Muñeca
```javascript
getWristPosition(landmarks) {
  // Índice 0 es la muñeca en MediaPipe Hands
  const wrist = {
    x: landmarks[0].x,
    y: landmarks[0].y,
    z: landmarks[0].z
  };
  return wrist;
}
```

#### Cálculo de Rotación de Mano
```javascript
getHandRotation(landmarks) {
  const wrist = landmarks[0];
  const middleFinger = landmarks[12];
  
  const yaw = Math.atan2(middleFinger.x - wrist.x, middleFinger.z - wrist.z);
  const pitch = Math.atan2(middleFinger.y - wrist.y, middleFinger.z - wrist.z);
  const roll = Math.atan2(middleFinger.y - wrist.y, middleFinger.x - wrist.x);
  
  return { x: pitch, y: yaw, z: roll };
}
```

### Estado Actual
**NOTA**: El seguimiento de manos está implementado pero actualmente desactivado en el componente principal `VirtualTryOn.jsx`. La funcionalidad está disponible para futura implementación.

---

## 4. Integración en VirtualTryOn.jsx

### Ubicación
`frontend/src/pages/VirtualTryOn.jsx`

### Flujo de Trabajo

1. **Carga de Datos de Joya**
   - Obtiene información de la joya desde la API
   - Carga variantes de color
   - Carga URL del modelo 3D

2. **Inicialización de Cámara**
   - Renderiza `CameraView` component
   - Recibe callback `onVideoReady` cuando la cámara está lista

3. **Renderizado de Modelo 3D**
   - Renderiza `JewelryRenderer` component
   - Pasa `modelUrl` para cargar el modelo
   - Actualiza posición, rotación y escala dinámicamente

4. **Seguimiento (Futuro)**
   - `HandTracking` para pulseras
   - `FaceTracking` para aretes
   - `PoseTracking` para collares

### Estructura del Componente
```javascript
<div className="camera-wrapper">
  <CameraView onVideoReady={handleVideoReady} onError={setError} />
  {modelUrl && (
    <JewelryRenderer
      modelUrl={modelUrl}
      onModelLoaded={() => console.log('Modelo cargado')}
    />
  )}
</div>
```

---

## 5. Dependencias del Proyecto

### package.json (Frontend)
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "three": "^0.x",
    "lucide-react": "^0.x"
  }
}
```

### Bibliotecas Externas (CDN)
- **MediaPipe Hands**: `https://cdn.jsdelivr.net/npm/@mediapipe/hands/`
- **MediaPipe Face Mesh**: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/`
- **MediaPipe Pose**: `https://cdn.jsdelivr.net/npm/@mediapipe/pose/`

---

## 6. Consideraciones Importantes

### Transparencia
- El renderizador WebGL está configurado con `alpha: true` y fondo transparente
- Esto permite que el modelo 3D se superponga sobre el video de la cámara

### Performance
- La cámara se configura a 720p para balance entre calidad y rendimiento
- Three.js usa `requestAnimationFrame` para animación fluida
- MediaPipe usa Web Workers para procesamiento en segundo plano

### Permisos
- La cámara requiere permiso explícito del usuario
- Los permisos se solicitan automáticamente por el navegador
- Se maneja el caso de permisos denegados con mensajes de error

### Compatibilidad
- Requiere navegador moderno con soporte para:
  - WebRTC (getUserMedia)
  - WebGL
  - ES6+ JavaScript

---

## 7. Archivos Relacionados

### Componentes Principales
- `VirtualTryOn.jsx` - Página principal del probador virtual
- `CameraView.jsx` - Componente de cámara
- `JewelryRenderer.jsx` - Componente de renderizado 3D
- `JewelryRendererModelViewer.jsx` - Variante del renderizador

### Seguimiento (Actualmente Inactivo)
- `HandTracking.js` - Seguimiento de manos
- `FaceTracking.js` - Seguimiento de rostro
- `PoseTracking.js` - Seguimiento de pose corporal

### Estilos
- `VirtualTryOn.css` - Estilos del probador virtual

### Servicios
- `jewelryService.js` - Servicio API para joyas
- `categoryService.js` - Servicio API para categorías

---

## 8. Próximos Pasos Sugeridos

1. **Activar Seguimiento de Manos**: Integrar `HandTracking` para posicionamiento automático de pulseras
2. **Activar Seguimiento de Rostro**: Integrar `FaceTracking` para posicionamiento automático de aretes
3. **Activar Seguimiento de Pose**: Integrar `PoseTracking` para posicionamiento automático de collares
4. **Optimizar Modelos 3D**: Reducir tamaño de archivos para carga más rápida
5. **Agregar Controles de Usuario**: Permitir ajuste manual de posición, rotación y escala
6. **Mejorar Iluminación**: Agregar iluminación más realista basada en el ambiente

---

## 9. Referencias

### Documentación
- [Three.js Documentation](https://threejs.org/docs/)
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- [WebRTC getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

### Formatos de Modelos 3D
- **GLTF**: Formato de transmisión GL (recomendado)
- **GLB**: Versión binaria de GLTF (más compacto)

---

**Fecha de creación**: 25 de septiembre de 2026  
**Versión**: 1.0  
**Proyecto**: Joyería RA - Virtual Try-On
