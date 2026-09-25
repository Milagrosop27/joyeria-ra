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

    return {
      x: pitch,
      y: yaw,
      z: roll
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
