class PoseTracking {
  constructor() {
    this.pose = null;
    this.isInitialized = false;
    this.onResults = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Cargar Pose desde CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
    script.async = true;
    script.onload = () => {
      this.pose = new window.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.pose.onResults((results) => {
        if (this.onResults) {
          this.onResults(results);
        }
      });

      this.isInitialized = true;
      console.log('PoseTracking inicializado');
    };
    document.head.appendChild(script);
  }

  async processFrame(videoElement) {
    if (!this.pose) {
      await this.initialize();
    }

    await this.pose.send({ image: videoElement });
  }

  setOnResults(callback) {
    this.onResults = callback;
  }

  // Obtener posición del cuello para collares
  getNeckPosition(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    // Índices de landmarks para cuello en MediaPipe Pose
    // Usamos puntos entre hombros (11, 12) y parte superior del torso
    
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    // Calcular punto medio entre hombros (base del cuello)
    const neck = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2
    };

    return neck;
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

    return {
      x: pitch,
      y: yaw,
      z: roll
    };
  }

  // Obtener ancho de hombros para escalar el collar
  getShoulderWidth(landmarks) {
    if (!landmarks || landmarks.length === 0) return 1;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    const width = Math.sqrt(
      Math.pow(rightShoulder.x - leftShoulder.x, 2) +
      Math.pow(rightShoulder.y - leftShoulder.y, 2)
    );

    return width;
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
