import { useEffect, useRef, useState } from 'react';

const CameraView = ({ onVideoReady, onError }) => {
  const videoRef = useRef(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState(null);

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
            if (onVideoReady) {
              onVideoReady(videoRef.current);
            }
          };
        }
      } catch (err) {
        console.error('Error accediendo a la cámara:', err);
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
        setIsStreamActive(false);
        if (onError) {
          onError(err);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady, onError]);

  return (
    <div className="camera-container">
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
          transform: 'scaleX(-1)' // Espejo para experiencia natural
        }}
      />
      {!isStreamActive && !error && (
        <div className="camera-loading">
          <p>Cargando cámara...</p>
        </div>
      )}
    </div>
  );
};

export default CameraView;
