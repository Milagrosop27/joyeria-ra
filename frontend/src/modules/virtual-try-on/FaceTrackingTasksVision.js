import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

class FaceTrackingTasksVision {
  constructor() {
    this.faceLandmarker = null;
    this.isInitialized = false;
    this.onResults = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Inicializando FaceLandmarker de MediaPipe Tasks Vision...');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      this.isInitialized = true;
      console.log('FaceTrackingTasksVision inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando FaceTrackingTasksVision:', error);
      throw error;
    }
  }

  async detectForVideo(videoElement, timestamp) {
    if (!this.isInitialized || !this.faceLandmarker) {
      console.warn('FaceTrackingTasksVision no inicializado');
      return null;
    }

    try {
      const results = this.faceLandmarker.detectForVideo(videoElement, timestamp);
      
      if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        const position = this.calculateEarPosition(landmarks);
        const scale = this.calculateScale(landmarks);
        const rotation = this.calculateRotation(landmarks);
        
        if (this.onResults) {
          this.onResults({
            position,
            scale,
            rotation,
            landmarks
          });
        }
      }
    } catch (error) {
      console.error('Error en detección facial:', error);
    }
  }

  // Calcular posición de la oreja izquierda para aretes
  calculateEarPosition(landmarks) {
    // MediaPipe Face Landmarker usa 478 landmarks
    // Índices aproximados para oreja izquierda: 234, 454
    // Usaremos landmarks alrededor de la zona del oído izquierdo
    
    const leftEye = landmarks[33]; // Ojo izquierdo
    const rightEye = landmarks[263]; // Ojo derecho
    const nose = landmarks[1]; // Punta de la nariz
    
    // Calcular posición aproximada de la oreja izquierda
    // basada en la posición del ojo izquierdo y la nariz
    const earX = leftEye.x - (rightEye.x - leftEye.x) * 0.3;
    const earY = leftEye.y;
    
    return {
      x: earX, // Coordenada normalizada 0-1
      y: earY  // Coordenada normalizada 0-1
    };
  }

  // Calcular escala basada en el tamaño de la cara
  calculateScale(landmarks) {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    // Distancia entre ojos como referencia de escala
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) +
      Math.pow(rightEye.y - leftEye.y, 2)
    );
    
    // Escala base ajustada según la distancia
    const baseScale = 0.5;
    const scale = baseScale / eyeDistance;
    
    return Math.min(Math.max(scale, 0.3), 1.5); // Limitar entre 0.3 y 1.5
  }

  // Calcular rotación basada en la orientación de la cara
  calculateRotation(landmarks) {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    // Calcular ángulo de rotación basado en la línea entre los ojos
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    const rotation = Math.atan2(dy, dx);
    
    return {
      x: 0,
      y: rotation, // Rotación en radianes
      z: 0
    };
  }

  setOnResults(callback) {
    this.onResults = callback;
  }

  cleanup() {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.isInitialized = false;
  }
}

export default FaceTrackingTasksVision;
