import { useEffect, useRef, memo } from 'react';
import '@google/model-viewer';

const JewelryRendererModelViewer = memo(({ modelUrl, positionRef, rotationRef, scaleRef, onModelLoaded }) => {
  const modelViewerRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    console.log('JewelryRendererModelViewer useEffect ejecutado, modelUrl:', modelUrl);
  }, [modelUrl]);

  useEffect(() => {
    if (!modelViewerRef.current || !positionRef || !rotationRef || !scaleRef) return;

    const container = modelViewerRef.current;
    const modelViewer = container.querySelector('model-viewer');

    const updateFromRefs = () => {
      if (!container || !modelViewer) return;

      const position = positionRef.current;
      const rotation = rotationRef.current;
      const scale = scaleRef.current;

      if (position) {
        container.style.left = `${position.x * 100}%`;
        container.style.top = `${position.y * 100}%`;
      }

      if (rotation) {
        const roll = rotation.z || 0;
        container.style.transform = `translate(-50%, -28%) rotate(${roll}deg)`;
      }

      if (scale) {
        const parent = container.parentElement;
        const parentWidth = parent?.clientWidth || 640;
        const sizePx = Math.max(70, Math.min(parentWidth * 0.3, parentWidth * (scale.x || 0.22)));
        container.style.width = `${sizePx}px`;
        container.style.height = `${sizePx}px`;
      }

      animationFrameRef.current = requestAnimationFrame(updateFromRefs);
    };

    updateFromRefs();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [positionRef, rotationRef, scaleRef]);

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
        transform: 'translate(-50%, -28%)',
        width: '140px',
        height: '140px',
        pointerEvents: 'none',
        zIndex: 2,
        background: 'transparent',
        clipPath: 'inset(32% 6% 0 6% round 40% 40% 8% 8%)',
        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.28))',
      }}
    >
      <model-viewer
        src={modelUrl}
        alt="Modelo 3D de joya"
        camera-controls={false}
        disable-pan
        disable-zoom
        disable-tap
        interaction-prompt="none"
        environment-image="neutral"
        exposure="1.15"
        shadow-intensity="0.45"
        tone-mapping="commerce"
        camera-orbit="0deg 78deg auto"
        min-camera-orbit="0deg 78deg auto"
        max-camera-orbit="0deg 78deg auto"
        field-of-view="24deg"
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          '--poster-color': 'transparent',
        }}
        onLoad={handleLoad}
        onError={handleError}
      ></model-viewer>
    </div>
  );
});

export default JewelryRendererModelViewer;
