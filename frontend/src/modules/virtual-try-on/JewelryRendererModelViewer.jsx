import { useEffect, useRef } from 'react';
import '@google/model-viewer';

const JewelryRendererModelViewer = ({ modelUrl, onModelLoaded }) => {
  const modelViewerRef = useRef(null);

  useEffect(() => {
    console.log('JewelryRendererModelViewer useEffect ejecutado, modelUrl:', modelUrl);
  }, [modelUrl]);

  const handleLoad = () => {
    console.log('Modelo cargado exitosamente con model-viewer');
    if (onModelLoaded) {
      onModelLoaded();
    }
  };

  const handleError = (error) => {
    console.error('Error cargando modelo con model-viewer:', error);
  };

  return (
    <div
      ref={modelViewerRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px',
        height: '200px',
        pointerEvents: 'none',
        zIndex: 2,
        background: 'transparent'
      }}
    >
      <model-viewer
        src={modelUrl}
        alt="Modelo 3D de joya"
        auto-rotate
        camera-controls
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent'
        }}
        onLoad={handleLoad}
        onError={handleError}
      ></model-viewer>
    </div>
  );
};

export default JewelryRendererModelViewer;
