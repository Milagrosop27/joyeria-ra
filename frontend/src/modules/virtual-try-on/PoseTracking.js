class PoseTracking {
  constructor() {
    this.pose = null;
    this.isInitialized = false;
    this.onResults = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('Inicializando MediaPipe Pose (detecta 33 puntos clave automáticamente)...');

    // Check if script is already loaded
    if (window.Pose) {
      console.log('Script ya cargado, usando instancia existente');
      return this._createPoseInstance();
    }

    // Cargar Pose desde CDN con Promise
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
      script.async = true;
      script.onload = () => {
        console.log('Script de MediaPipe Pose cargado');
        this._createPoseInstance().then(resolve).catch(reject);
      };
      script.onerror = () => {
        reject(new Error('Error cargando script de MediaPipe Pose'));
      };
      document.head.appendChild(script);
    });
  }

  async _createPoseInstance() {
    this.pose = new window.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
      // Usar modo ligero para evitar conflictos de WebGL
      modelComplexity: 0, // 0 = lite, 1 = full, 2 = heavy
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.3, // Bajado de 0.5 a 0.3 para mayor sensibilidad
      minTrackingConfidence: 0.3 // Bajado de 0.5 a 0.3 para mayor sensibilidad
    });

    this.pose.onResults((results) => {
      if (this.onResults) {
        this.onResults(results);
      }
    });

    this.isInitialized = true;
    console.log('✅ MediaPipe Pose inicializado - Detecta 33 puntos clave automáticamente');
  }

  async processFrame(videoElement) {
    if (!this.isInitialized || !this.pose) {
      console.log('Pose no inicializado, inicializando...');
      await this.initialize();
      
      // Wait a bit more to ensure Pose is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.pose) {
      console.error('❌ Error: Pose sigue siendo null después de inicializar');
      return;
    }

    await this.pose.send({ image: videoElement });
  }

  setOnResults(callback) {
    this.onResults = callback;
  }

  // MediaPipe Pose (BlazePose) — 33 puntos:
  // 0 nariz, 7 oreja izq, 8 oreja der, 11 hombro izq, 12 hombro der
  // 13-16 brazos, 23-24 caderas, 25-28 rodillas/tobillos

  getNeckPosition(landmarks) {
    if (!landmarks || landmarks.length < 13) {
      return null;
    }

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];

    if (!leftShoulder || !rightShoulder) {
      return null;
    }

    const leftVis = leftShoulder.visibility ?? 1;
    const rightVis = rightShoulder.visibility ?? 1;
    if (leftVis < 0.3 || rightVis < 0.3) {
      return null;
    }

    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // El cuello está entre los hombros y la cara (Y crece hacia abajo)
    const faceY = nose ? nose.y : shoulderMidY - 0.12;
    const faceX = nose ? nose.x : shoulderMidX;

    return {
      x: shoulderMidX * 0.75 + faceX * 0.25,
      y: shoulderMidY * 0.65 + faceY * 0.35,
      z: ((leftShoulder.z ?? 0) + (rightShoulder.z ?? 0)) / 2
    };
  }

  // Pose de collar en coordenadas de pantalla (ya espejadas como el video)
  getNecklaceFit(landmarks) {
    const neck = this.getNeckPosition(landmarks);
    if (!neck) return null;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const visualLeft = leftShoulder.x <= rightShoulder.x ? leftShoulder : rightShoulder;
    const visualRight = leftShoulder.x <= rightShoulder.x ? rightShoulder : leftShoulder;

    const roll =
      Math.atan2(visualRight.y - visualLeft.y, visualRight.x - visualLeft.x) * (180 / Math.PI);

    const span = Math.hypot(
      rightShoulder.x - leftShoulder.x,
      rightShoulder.y - leftShoulder.y
    );

    return {
      position: neck,
      rotation: { x: 0, y: 0, z: roll },
      span
    };
  }

  // Silueta de cabeza + cuello para tapar la parte trasera del collar
  getNeckOcclusionPolygon(landmarks, neck) {
    if (!landmarks || landmarks.length < 13) return null;

    const nose = landmarks[0];
    const earA = landmarks[7];
    const earB = landmarks[8];
    const shA = landmarks[11];
    const shB = landmarks[12];
    if (!nose || !earA || !earB || !shA || !shB) return null;

    const leftEar = earA.x <= earB.x ? earA : earB;
    const rightEar = earA.x <= earB.x ? earB : earA;
    const leftSh = shA.x <= shB.x ? shA : shB;
    const rightSh = shA.x <= shB.x ? shB : shA;

    const earSpan = Math.max(0.08, Math.hypot(rightEar.x - leftEar.x, rightEar.y - leftEar.y));
    const bottomY = (neck?.y ?? (leftEar.y + rightEar.y) / 2) + earSpan * 0.08;

    const widen = earSpan * 0.12;
    const crown = {
      x: nose.x,
      y: Math.min(leftEar.y, rightEar.y, nose.y) - earSpan * 0.95
    };

    return [
      crown,
      { x: rightEar.x + widen, y: rightEar.y },
      { x: rightEar.x * 0.7 + rightSh.x * 0.3 + widen * 0.4, y: (rightEar.y + bottomY) / 2 },
      { x: rightEar.x * 0.45 + rightSh.x * 0.55 + (nose.x - rightEar.x) * 0.12, y: bottomY },
      { x: leftEar.x * 0.45 + leftSh.x * 0.55 + (nose.x - leftEar.x) * 0.12, y: bottomY },
      { x: leftEar.x * 0.7 + leftSh.x * 0.3 - widen * 0.4, y: (leftEar.y + bottomY) / 2 },
      { x: leftEar.x - widen, y: leftEar.y }
    ];
  }

  // Obtener posición del torso para collares largos
  getTorsoPosition(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    // Usar puntos del torso (11, 12 hombros, 23, 24 caderas)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Calcular centro del torso
    const torso = {
      x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
      y: (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4,
      z: (leftShoulder.z + rightShoulder.z + leftHip.z + rightHip.z) / 4
    };

    return torso;
  }

  // Calcular rotación del torso
  getTorsoRotation(landmarks) {
    if (!landmarks || landmarks.length === 0) return { x: 0, y: 0, z: 0 };

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Rotación Y (yaw) - basada en la orientación de los hombros
    const yaw = Math.atan2(rightShoulder.x - leftShoulder.x, rightShoulder.z - leftShoulder.z);

    // Rotación X (pitch) - basada en la inclinación del torso
    const pitch = Math.atan2(
      (rightHip.y + leftHip.y) / 2 - (rightShoulder.y + leftShoulder.y) / 2,
      (rightHip.z + leftHip.z) / 2 - (rightShoulder.z + leftShoulder.z) / 2
    );

    // Rotación Z (roll) - basada en la inclinación lateral
    const roll = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);

    // Convertir a grados para model-viewer
    return {
      x: pitch * (180 / Math.PI),
      y: yaw * (180 / Math.PI),
      z: roll * (180 / Math.PI)
    };
  }

  // Obtener ancho del cuello (usando orejas) para escalar el collar
  getNeckWidth(landmarks) {
    if (!landmarks || landmarks.length < 9) return 1;

    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    if (!leftEar || !rightEar) return 1;

    // Calcular distancia euclidiana entre orejas (ancho del cuello)
    const width = Math.sqrt(
      Math.pow(rightEar.x - leftEar.x, 2) +
      Math.pow(rightEar.y - leftEar.y, 2)
    );

    // Multiplicar por un factor mucho mayor para collar que rodee todo el cuello
    return width * 5.0;
  }

  // Obtener ancho de hombros para escalar el collar (método alternativo)
  getShoulderWidth(landmarks) {
    if (!landmarks || landmarks.length < 13) return 1;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    if (!leftShoulder || !rightShoulder) return 1;

    // Calcular distancia euclidiana entre hombros
    const width = Math.sqrt(
      Math.pow(rightShoulder.x - leftShoulder.x, 2) +
      Math.pow(rightShoulder.y - leftShoulder.y, 2)
    );

    // Multiplicar por un factor para collar más grande
    return width * 3.0;
  }

  cleanup() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
  }
}

export default PoseTracking;
