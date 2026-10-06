class FaceTracking {
  constructor() {
    this.faceMesh = null;
    this.isInitialized = false;
    this.onResults = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Cargar FaceMesh desde CDN
    if (!window.FaceMesh) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    console.log('Inicializando FaceMesh desde CDN...');
    this.faceMesh = new window.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults((results) => {
      if (this.onResults) {
        this.onResults(results);
      }
    });

    await this.faceMesh.initialize();
    this.isInitialized = true;
    console.log('FaceTracking inicializado');
  }

  async processFrame(videoElement) {
    if (!this.faceMesh) {
      await this.initialize();
    }

    await this.faceMesh.send({ image: videoElement });
  }

  setOnResults(callback) {
    this.onResults = callback;
  }

  // Obtener posición de las orejas para aretes (puntos del borde lateral)
  getEarPositions(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    // Índices de landmarks para lóbulos de orejas en MediaPipe Face Mesh
    // Borde lateral cara: 234 (izq), 454 (der)
    // Mandíbula inferior: 132 (izq), 361 (der)

    const leftEar = {
      x: landmarks[234].x,
      y: landmarks[234].y,
      z: landmarks[234].z
    };

    const rightEar = {
      x: landmarks[454].x,
      y: landmarks[454].y,
      z: landmarks[454].z
    };

    return {
      left: leftEar,
      right: rightEar
    };
  }

  // Calcular posición de los lóbulos para anclaje de aretes
  getEarlobePositions(landmarks, config = {}) {
    if (!landmarks || landmarks.length === 0) return null;

    // Parámetros configurables
    const noseLipHeightPercent = config.noseLipHeightPercent ?? 0.5; // Altura entre nariz (2) y labio (13)
    const lateralOffsetPercent = config.lateralOffsetPercent ?? 0.10; // 8-12% del ancho hacia afuera

    // Base de nariz: 2, labio superior: 13
    // Borde lateral cara: 234 (izq), 454 (der)
    // Alto de cara: 10 (parte superior), 152 (mentón)
    const noseBase = landmarks[2];
    const upperLip = landmarks[13];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const faceTop = landmarks[10];
    const chin = landmarks[152];

    // Calcular ancho de la cara (distancia entre 234 y 454)
    const faceWidth = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);
    const lateralOffset = faceWidth * lateralOffsetPercent;

    // Calcular alto de la cara (distancia entre 10 y 152)
    const faceHeight = Math.hypot(chin.x - faceTop.x, chin.y - faceTop.y);

    // Calcular altura del lóbulo: entre nariz y labio
    const lobeY = noseBase.y + (upperLip.y - noseBase.y) * noseLipHeightPercent;

    // Calcular lóbulo izquierdo: altura entre nariz/labio, desplazado hacia afuera
    const leftLobe = {
      x: leftCheek.x - lateralOffset,
      y: lobeY,
      z: leftCheek.z
    };

    // Calcular lóbulo derecho: altura entre nariz/labio, desplazado hacia afuera
    const rightLobe = {
      x: rightCheek.x + lateralOffset,
      y: lobeY,
      z: rightCheek.z
    };

    return {
      left: leftLobe,
      right: rightLobe,
      faceWidth,
      faceHeight
    };
  }

  // Calcular rotación de aretes basada en dirección de caída (desde lóbulo hacia abajo)
  getEarringRotation(landmarks) {
    if (!landmarks || landmarks.length === 0) return { x: 0, y: 0, z: 0 };

    // Lóbulos: 234 (izq), 454 (der)
    // Puntos inferiores: 132 (izq), 361 (der)
    const leftLobe = landmarks[234];
    const rightLobe = landmarks[454];
    const leftBottom = landmarks[132];
    const rightBottom = landmarks[361];

    // Calcular ángulo de caída para cada oreja (rotación Z)
    const leftDropAngle = Math.atan2(leftBottom.y - leftLobe.y, leftBottom.x - leftLobe.x);
    const rightDropAngle = Math.atan2(rightBottom.y - rightLobe.y, rightBottom.x - rightLobe.x);

    // Promedio de ambos ángulos para rotación general
    const avgDropAngle = (leftDropAngle + rightDropAngle) / 2;

    // Convertir a grados y ajustar para que el arete cuelgue verticalmente
    const roll = (avgDropAngle * (180 / Math.PI)) + 90;

    return {
      x: 0,
      y: 0,
      z: roll
    };
  }

  // Calcular rotación basada en la orientación de la cara
  getFaceRotation(landmarks) {
    if (!landmarks || landmarks.length === 0) return { x: 0, y: 0, z: 0 };

    // Usar puntos de referencia para calcular la rotación
    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    // Rotación Y (yaw) - basada en la diferencia entre mejillas
    const yaw = Math.atan2(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);

    // Rotación X (pitch) - basada en la posición de la nariz
    const pitch = Math.atan2(nose.y - 0.5, nose.z);

    // Rotación Z (roll) - basada en la inclinación de la cara
    const roll = Math.atan2(leftCheek.y - rightCheek.y, leftCheek.x - rightCheek.x);

    // Convertir a grados para model-viewer
    return {
      x: pitch * (180 / Math.PI),
      y: yaw * (180 / Math.PI),
      z: roll * (180 / Math.PI)
    };
  }

  cleanup() {
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }
    this.isInitialized = false;
  }
}

export default FaceTracking;
