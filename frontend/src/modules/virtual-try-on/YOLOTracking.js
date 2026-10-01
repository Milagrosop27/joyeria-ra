class YOLOTracking {
  constructor() {
    this.isInitialized = false;
    this.onResults = null;
    this.model = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Inicializando YOLOv8 Pose...');
      
      // Cargar ONNX Runtime Web para ejecutar YOLO en el navegador
      if (!window.ort) {
        await this.loadONNXRuntime();
      }

      // Cargar el modelo YOLOv8 Pose
      // Usaremos el modelo pre-entrenado de Ultralytics
      const modelUrl = 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-pose.onnx';
      
      this.model = await window.ort.InferenceSession.create(modelUrl);
      
      this.isInitialized = true;
      console.log('YOLOv8 Pose inicializado exitosamente');
      
    } catch (error) {
      console.error('Error inicializando YOLOv8 Pose:', error);
      throw new Error('No se pudo cargar el modelo YOLOv8. Usando fallback a MediaPipe.');
    }
  }

  async loadONNXRuntime() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async processFrame(videoElement) {
    if (!this.model) {
      await this.initialize();
    }

    try {
      // Crear canvas para procesar el frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Redimensionar para YOLO (640x640 es el tamaño óptimo)
      const inputSize = 640;
      canvas.width = inputSize;
      canvas.height = inputSize;
      
      // Dibujar el frame en el canvas
      ctx.drawImage(videoElement, 0, 0, inputSize, inputSize);
      
      // Obtener los datos del canvas
      const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
      
      // Preprocesar para YOLO
      const input = this.preprocessImage(imageData, inputSize);
      
      // Crear tensor de entrada
      const inputTensor = new window.ort.Tensor('float32', input, [1, 3, inputSize, inputSize]);
      
      // Ejecutar inferencia
      const outputs = await this.model.run({ images: inputTensor });
      
      // Procesar los resultados
      const results = this.postprocessOutputs(outputs, inputSize);
      
      if (this.onResults) {
        this.onResults(results);
      }
      
    } catch (error) {
      console.error('Error procesando frame con YOLO:', error);
    }
  }

  preprocessImage(imageData, size) {
    // Convertir RGB a formato YOLO (normalizado 0-1)
    const data = imageData.data;
    const input = new Float32Array(3 * size * size);
    
    for (let i = 0; i < size * size; i++) {
      const pixelIndex = i * 4;
      // YOLO usa formato RGB normalizado
      input[i] = data[pixelIndex] / 255.0; // R
      input[size * size + i] = data[pixelIndex + 1] / 255.0; // G
      input[2 * size * size + i] = data[pixelIndex + 2] / 255.0; // B
    }
    
    return input;
  }

  postprocessOutputs(outputs, inputSize) {
    // YOLOv8 Pose retorna keypoints en formato específico
    // Formato: [x, y, confidence] para cada keypoint
    
    const keypoints = outputs.output0?.data || [];
    
    // YOLOv8 Pose keypoints (17 puntos COCO):
    // 0: nariz, 1: ojo izquierdo, 2: ojo derecho, 3: oreja izquierda, 4: oreja derecha
    // 5: hombro izquierdo, 6: hombro derecho, 7: codo izquierdo, 8: codo derecho
    // 9: muñeca izquierda, 10: muñeca derecha, 11: cadera izquierda, 12: cadera derecha
    // 13: rodilla izquierda, 14: rodilla derecha, 15: tobillo izquierdo, 16: tobillo derecho
    
    const landmarks = [];
    const numKeypoints = 17;
    
    for (let i = 0; i < numKeypoints; i++) {
      const x = keypoints[i * 3];
      const y = keypoints[i * 3 + 1];
      const confidence = keypoints[i * 3 + 2];
      
      landmarks.push({
        x: x / inputSize, // Normalizar a 0-1
        y: y / inputSize,
        z: 0, // YOLO no proporciona profundidad
        confidence: confidence
      });
    }
    
    return {
      landmarks,
      confidence: 0.5 // Umbral de confianza
    };
  }

  setOnResults(callback) {
    this.onResults = callback;
  }

  // Obtener posición del cuello usando keypoints de YOLO
  getNeckPosition(landmarks) {
    if (!landmarks || landmarks.length < 17) return null;

    // YOLO keypoints: 5 = hombro izquierdo, 6 = hombro derecho
    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];
    
    // 0 = nariz, 1 = ojo izquierdo, 2 = ojo derecho
    const nose = landmarks[0];
    const leftEye = landmarks[1];
    const rightEye = landmarks[2];

    // Verificar confianza de los puntos
    if (leftShoulder.confidence < 0.3 || rightShoulder.confidence < 0.3) {
      console.log('Hombros no detectados con suficiente confianza');
      return null;
    }

    // Calcular punto medio entre hombros
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // Calcular centro de la cara
    const faceCenterX = (nose.x + leftEye.x + rightEye.x) / 3;
    const faceCenterY = (nose.y + leftEye.y + rightEye.y) / 3;

    // Calcular longitud del cuello dinámicamente
    const neckLength = faceCenterY - shoulderMidY;
    
    // Posición del cuello: 15% de la longitud desde hombros
    const neck = {
      x: shoulderMidX,
      y: shoulderMidY + (neckLength * 0.15),
      z: 0
    };

    console.log('=== YOLO DETECCIÓN DE CUELLO ===');
    console.log('Longitud del cuello:', neckLength);
    console.log('Posición cuello:', neck);
    console.log('Confianza hombros:', { left: leftShoulder.confidence, right: rightShoulder.confidence });
    
    return neck;
  }

  // Obtener posición de orejas para aretes
  getEarPositions(landmarks) {
    if (!landmarks || landmarks.length < 5) return null;

    // YOLO keypoints: 3 = oreja izquierda, 4 = oreja derecha
    const leftEar = landmarks[3];
    const rightEar = landmarks[4];

    if (leftEar.confidence < 0.3 || rightEar.confidence < 0.3) {
      return null;
    }

    return {
      left: { x: leftEar.x, y: leftEar.y, z: 0 },
      right: { x: rightEar.x, y: rightEar.y, z: 0 }
    };
  }

  // Obtener posición de muñecas para pulseras
  getWristPosition(landmarks) {
    if (!landmarks || landmarks.length < 11) return null;

    // YOLO keypoints: 9 = muñeca izquierda, 10 = muñeca derecha
    const leftWrist = landmarks[9];
    const rightWrist = landmarks[10];

    // Usar la muñeca con mayor confianza
    const wrist = leftWrist.confidence > rightWrist.confidence ? leftWrist : rightWrist;

    if (wrist.confidence < 0.3) {
      return null;
    }

    return {
      x: wrist.x,
      y: wrist.y,
      z: 0
    };
  }

  // Obtener ancho de hombros para escala
  getShoulderWidth(landmarks) {
    if (!landmarks || landmarks.length < 7) return 1;

    const leftShoulder = landmarks[5];
    const rightShoulder = landmarks[6];

    const width = Math.sqrt(
      Math.pow(rightShoulder.x - leftShoulder.x, 2) +
      Math.pow(rightShoulder.y - leftShoulder.y, 2)
    );

    return width;
  }

  cleanup() {
    this.model = null;
    this.isInitialized = false;
  }
}

export default YOLOTracking;
