import { useEffect, useRef, useState, memo } from 'react';

const CameraView = memo(({ onVideoReady, onError }) => {
  const videoRef = useRef(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState(null);
  
  // Usar refs para los callbacks para evitar que el useEffect se re-ejecute
  const onVideoReadyRef = useRef(onVideoReady);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onVideoReadyRef.current = onVideoReady;
    onErrorRef.current = onError;
  }, [onVideoReady, onError]);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsStreamActive(true);
            if (onVideoReadyRef.current) {
              onVideoReadyRef.current(videoRef.current);
            }
          };
        }
      } catch (err) {
        console.error('Error accediendo a la cámara:', err);
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
        setIsStreamActive(false);
        if (onErrorRef.current) {
          onErrorRef.current(err);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Sin dependencias - solo se ejecuta una vez

  return (
    <div className="camera-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {error && (
        <div className="camera-error">
          <p>{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="camera-feed"
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Espejo para experiencia natural
          display: isStreamActive ? 'block' : 'none'
        }}
      />
      {!isStreamActive && !error && (
        <div className="camera-loading">
          <p>Cargando cámara...</p>
        </div>
      )}
    </div>
  );
});

export default CameraView;
