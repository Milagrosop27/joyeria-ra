import * as faceapi from 'face-api.js';

class FaceTrackingFaceApi {
  constructor() {
    this.isInitialized = false;
    this.onResults = null;
    this.detectionInterval = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Cargando modelos de face-api.js...');
      
      // Cargar modelos desde CDN
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);
      
      this.isInitialized = true;
      console.log('FaceTrackingFaceApi inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando face-api.js:', error);
      throw error;
    }
  }

  async startDetection(videoElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!videoElement) {
      console.error('Elemento de video no proporcionado');
      return;
    }

    console.log('Iniciando detección facial...');

    // Iniciar detección continua
    this.detectionInterval = setInterval(async () => {
      try {
        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections.length > 0 && this.onResults) {
          const landmarks = detections[0].landmarks;
          const positions = this.getEarPositions(landmarks);
          const rotation = this.getFaceRotation(landmarks);
          
          this.onResults({
            positions,
            rotation,
            landmarks
          });
        }
      } catch (error) {
        console.error('Error en detección facial:', error);
      }
    }, 100); // Detección cada 100ms
  }

  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    console.log('Detección facial detenida');
  }

  // Obtener posición de las orejas para aretes
  getEarPositions(landmarks) {
    if (!landmarks) return null;

    // face-api.js usa 68 landmarks
    // Oreja izquierda: landmarks alrededor del índice 0-16
    // Oreja derecha: landmarks alrededor del índice 16-27
    
    const leftEar = landmarks.getLeftEye();
    const rightEar = landmarks.getRightEye();
    const nose = landmarks.getNose();

    // Calcular posición aproximada de las orejas basada en ojos y nariz
    const leftEarPosition = {
      x: leftEar[0].x,
      y: leftEar[0].y
    };

    const rightEarPosition = {
      x: rightEar[3].x,
      y: rightEar[3].y
    };

    return {
      left: leftEarPosition,
      right: rightEarPosition
    };
  }

  // Calcular rotación basada en la orientación de la cara
  getFaceRotation(landmarks) {
    if (!landmarks) return { x: 0, y: 0, z: 0 };

    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();

    // Calcular ángulo de rotación basado en la línea entre los ojos
    const dx = rightEye[3].x - leftEye[0].x;
    const dy = rightEye[3].y - leftEye[0].y;
    const rotation = Math.atan2(dy, dx);

    return {
      x: 0,
      y: rotation,
      z: 0
    };
  }

  setOnResults(callback) {
    this.onResults = callback;
  }

  cleanup() {
    this.stopDetection();
    this.isInitialized = false;
  }
}

export default FaceTrackingFaceApi;
