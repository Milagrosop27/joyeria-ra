class HandTracking {
  constructor() {
    this.hands = null;
    this.isInitialized = false;
    this.onResults = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Cargar Hands desde CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
    script.async = true;
    script.onload = () => {
      this.hands = new window.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults((results) => {
        if (this.onResults) {
          this.onResults(results);
        }
      });

      this.isInitialized = true;
      console.log('HandTracking inicializado');
    };
    document.head.appendChild(script);
  }

  async processFrame(videoElement) {
    if (!this.hands) {
      await this.initialize();
    }

    await this.hands.send({ image: videoElement });
  }

  setOnResults(callback) {
    this.onResults = callback;
  }

  // Obtener posición de la muñeca para pulseras
  getWristPosition(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    // Índice 0 es la muñeca en MediaPipe Hands
    const wrist = {
      x: landmarks[0].x,
      y: landmarks[0].y,
      z: landmarks[0].z
    };

    return wrist;
  }

  // Obtener posición de la pulsera: landmark 0 desplazado hacia antebrazo 20%
  getBraceletPosition(landmarks, forearmOffsetPercent = 0.2) {
    if (!landmarks || landmarks.length === 0) return null;

    // Landmark 0: muñeca, Landmark 9: dedo medio (base)
    const wrist = landmarks[0];
    const middleFingerBase = landmarks[9];

    // Vector de 9 hacia 0 (hacia la muñeca/antebrazo)
    const direction = {
      x: wrist.x - middleFingerBase.x,
      y: wrist.y - middleFingerBase.y,
      z: wrist.z - middleFingerBase.z
    };

    // Desplazar 20% hacia el antebrazo desde la muñeca
    const position = {
      x: wrist.x + direction.x * forearmOffsetPercent,
      y: wrist.y + direction.y * forearmOffsetPercent,
      z: wrist.z + direction.z * forearmOffsetPercent
    };

    return position;
  }

  // Calcular tamaño de pulsera: 0.9 × distancia landmarks 5-17 (ancho de palma)
  getBraceletScale(landmarks, scaleFactor = 1) {
    if (!landmarks || landmarks.length === 0) return 1;

    // Landmark 5: pulgar (base), Landmark 17: meñique (base)
    const thumbBase = landmarks[5];
    const pinkyBase = landmarks[17];

    // Distancia entre 5 y 17 (ancho de palma)
    const palmWidth = Math.sqrt(
      Math.pow(pinkyBase.x - thumbBase.x, 2) +
      Math.pow(pinkyBase.y - thumbBase.y, 2)
    );

    // Diámetro = 0.9 × ancho de palma × scale_factor
    const diameter = 0.9 * palmWidth * scaleFactor;

    return diameter;
  }

  // Calcular rotación de pulsera: ángulo del vector 9→0 (perpendicular al antebrazo)
  getBraceletRotation(landmarks, rotationXOffset = 0) {
    if (!landmarks || landmarks.length === 0) return { x: 0, y: 0, z: 0 };

    // Landmark 9: dedo medio (base), Landmark 0: muñeca
    const middleFingerBase = landmarks[9];
    const wrist = landmarks[0];

    // Vector de 9 hacia 0 (dirección del antebrazo)
    const dx = wrist.x - middleFingerBase.x;
    const dy = wrist.y - middleFingerBase.y;

    // Ángulo del vector en el plano 2D (para rotación Z)
    const angle = Math.atan2(dy, dx);

    // Convertir a grados
    const angleDeg = angle * (180 / Math.PI);

    // Rotación Z para que la banda quede perpendicular al antebrazo
    // Rotación X ajustable para aplanar la vista del aro
    return {
      x: rotationXOffset,
      y: 0,
      z: angleDeg + 90 // +90 para perpendicular
    };
  }

  // Calcular relación 5-17 / 0-9 para detectar mano de canto
  getHandSideRatio(landmarks) {
    if (!landmarks || landmarks.length === 0) return 0;

    // Landmark 5: pulgar (base), Landmark 17: meñique (base)
    const thumbBase = landmarks[5];
    const pinkyBase = landmarks[17];

    // Landmark 9: dedo medio (base), Landmark 0: muñeca
    const middleFingerBase = landmarks[9];
    const wrist = landmarks[0];

    // Distancia 5-17 (ancho de palma)
    const palmWidth = Math.sqrt(
      Math.pow(pinkyBase.x - thumbBase.x, 2) +
      Math.pow(pinkyBase.y - thumbBase.y, 2)
    );

    // Distancia 0-9 (largo de mano)
    const handLength = Math.sqrt(
      Math.pow(middleFingerBase.x - wrist.x, 2) +
      Math.pow(middleFingerBase.y - wrist.y, 2)
    );

    if (handLength === 0) return 0;

    return palmWidth / handLength;
  }

  // Verificar si la muñeca está cerca del borde del cuadro
  isWristNearBorder(landmarks, borderMargin = 0.03) {
    if (!landmarks || landmarks.length === 0) return false;

    const wrist = landmarks[0];

    // Verificar si está a menos de borderMargin del borde
    return (
      wrist.x < borderMargin ||
      wrist.x > (1 - borderMargin) ||
      wrist.y < borderMargin ||
      wrist.y > (1 - borderMargin)
    );
  }

  // Obtener posiciones de ambas muñecas
  getBothWristsPositions(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return null;
    }

    const wrists = [];

    for (const landmarks of results.multiHandLandmarks) {
      const wrist = this.getWristPosition(landmarks);
      if (wrist) {
        wrists.push(wrist);
      }
    }

    return wrists;
  }

  // Calcular rotación de la mano basada en los puntos de referencia
  getHandRotation(landmarks) {
    if (!landmarks || landmarks.length === 0) return { x: 0, y: 0, z: 0 };

    // Usar muñeca (0) y dedo medio (12) para calcular rotación
    const wrist = landmarks[0];
    const middleFinger = landmarks[12];

    // Rotación Y (yaw) - basada en la posición del dedo medio
    const yaw = Math.atan2(middleFinger.x - wrist.x, middleFinger.z - wrist.z);

    // Rotación X (pitch) - basada en la posición vertical
    const pitch = Math.atan2(middleFinger.y - wrist.y, middleFinger.z - wrist.z);

    // Rotación Z (roll) - basada en la inclinación de la mano
    const roll = Math.atan2(middleFinger.y - wrist.y, middleFinger.x - wrist.x);

    // Convertir a grados para model-viewer
    return {
      x: pitch * (180 / Math.PI),
      y: yaw * (180 / Math.PI),
      z: roll * (180 / Math.PI)
    };
  }

  // Detectar qué mano es (izquierda o derecha)
  getHandType(results, index) {
    if (!results.multiHandedness || !results.multiHandedness[index]) {
      return 'unknown';
    }

    return results.multiHandedness[index].label; // 'Left' o 'Right'
  }

  cleanup() {
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    this.isInitialized = false;
  }
}

export default HandTracking;
