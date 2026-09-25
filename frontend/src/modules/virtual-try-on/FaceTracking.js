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

  // Obtener posición de las orejas para aretes
  getEarPositions(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    // Índices de landmarks para orejas en MediaPipe Face Mesh
    // Oreja izquierda: 234, 132
    // Oreja derecha: 454, 361

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

    return {
      x: pitch,
      y: yaw,
      z: roll
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
