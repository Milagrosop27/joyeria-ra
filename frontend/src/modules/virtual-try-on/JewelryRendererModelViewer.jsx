import { useEffect, useRef, memo, useState } from 'react';
import '@google/model-viewer';

const JewelryRendererModelViewer = memo(({ modelUrl, positionRef, rotationRef, scaleRef, anchorPointsRef, earPositionsRef, earlobePositionsRef, trackingType, neckPositionRef, debugConfig, onModelLoaded }) => {
  const modelViewerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const leftModelViewerRef = useRef(null);
  const rightModelViewerRef = useRef(null);
  const [leftSrc, setLeftSrc] = useState(modelUrl);
  const [rightSrc, setRightSrc] = useState(modelUrl);
  const [singleSrc, setSingleSrc] = useState(modelUrl);
  const [leftLoaded, setLeftLoaded] = useState(false);
  const [rightLoaded, setRightLoaded] = useState(false);
  const [singleLoaded, setSingleLoaded] = useState(false);

  // Actualizar src cuando cambia modelUrl - sin desmontar
  useEffect(() => {
    if (trackingType === 'face') {
      setLeftLoaded(false);
      setRightLoaded(false);
      setLeftSrc(modelUrl);
      setRightSrc(modelUrl);
    } else {
      setSingleLoaded(false);
      setSingleSrc(modelUrl);
    }
  }, [modelUrl, trackingType]);

  useEffect(() => {
    if (!modelViewerRef.current || !positionRef || !rotationRef || !scaleRef) return;

    const container = modelViewerRef.current;
    const modelViewer = container.querySelector('model-viewer');

    const updateFromRefs = () => {
      if (!container || !modelViewer) return;

      const position = positionRef.current;
      const rotation = rotationRef.current;
      const scale = scaleRef.current;
      const anchorPoints = anchorPointsRef?.current;
      const earPositions = earPositionsRef?.current;
      const earlobePositions = earlobePositionsRef?.current;

      // Modo aretes: dos instancias del mismo modelo
      if (trackingType === 'face' && earlobePositions && earlobePositions.left && earlobePositions.right) {
        const parent = container.parentElement;
        const parentWidth = parent?.clientWidth || 640;
        const parentHeight = parent?.clientHeight || 480;

        const offsetX = debugConfig?.earringOffsetX || 0;
        const offsetY = debugConfig?.earringOffsetY || 0;

        const earScale = scale.x || 0.15;
        const sizePx = Math.max(50, parentWidth * earScale);

        // Configurar contenedor principal para contener ambos aretes
        container.style.left = '0';
        container.style.top = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.transform = 'none';

        // Obtener ambos contenedores de arete
        const leftEarring = container.querySelector('.earring-left');
        const rightEarring = container.querySelector('.earring-right');

        if (leftEarring && rightEarring) {
          // Posicionar arete izquierdo en lóbulo calculado
          leftEarring.style.left = `${(earlobePositions.left.x + offsetX) * 100}%`;
          leftEarring.style.top = `${(earlobePositions.left.y + offsetY) * 100}%`;
          leftEarring.style.width = `${sizePx}px`;
          leftEarring.style.height = `${sizePx}px`;
          leftEarring.style.transform = `translate(-50%, -50%) rotate(${rotation.z || 0}deg)`;

          // Posicionar arete derecho (espejado) en lóbulo calculado
          rightEarring.style.left = `${(earlobePositions.right.x + offsetX) * 100}%`;
          rightEarring.style.top = `${(earlobePositions.right.y + offsetY) * 100}%`;
          rightEarring.style.width = `${sizePx}px`;
          rightEarring.style.height = `${sizePx}px`;
          rightEarring.style.transform = `translate(-50%, -50%) scaleX(-1) rotate(${rotation.z || 0}deg)`;
        }
      }
      // Modo collar: usar puntos de anclaje
      else if (anchorPoints && anchorPoints.left && anchorPoints.right) {
        const parent = container.parentElement;
        const parentWidth = parent?.clientWidth || 640;
        const parentHeight = parent?.clientHeight || 480;

        // Calcular distancia entre puntos de anclaje en píxeles
        const anchorDistX = Math.abs(anchorPoints.right.x - anchorPoints.left.x) * parentWidth;
        const anchorDistY = Math.abs(anchorPoints.right.y - anchorPoints.left.y) * parentHeight;
        const anchorDistPx = Math.hypot(anchorDistX, anchorDistY);

        // El ancho del contenedor debe ser la distancia entre los puntos de anclaje
        // con un pequeño margen para que los extremos de la cadena toquen los bordes
        const containerWidth = Math.max(100, anchorDistPx * 1.05);
        const containerHeight = containerWidth; // Mantener aspecto cuadrado

        // Posicionar el contenedor centrado en el punto medio de los anclajes
        const midX = (anchorPoints.left.x + anchorPoints.right.x) / 2;
        const midY = (anchorPoints.left.y + anchorPoints.right.y) / 2;

        container.style.left = `${midX * 100}%`;
        container.style.top = `${midY * 100}%`;
        container.style.width = `${containerWidth}px`;
        container.style.height = `${containerHeight}px`;

        // Transform: centrar en el punto medio y rotar
        const roll = rotation.z || 0;
        container.style.transform = `translate(-50%, -50%) rotate(${roll}deg)`;

        // Aplicar clip-path para cortar la parte superior del collar
        // El corte debe estar ~8-10% del alto del collar por encima del punto del cuello
        // El punto del cuello está en el centro de la caja (midX, midY)
        // Por defecto, cortar al 42% (50% - 8%) desde arriba
        const cutOffsetPx = debugConfig?.cutOffset ?? 0; // Offset ajustable en debug (-20 a +20 px)
        const defaultCutPercent = 42; // 50% - 8%
        const cutPercentAdjustment = (cutOffsetPx / containerHeight) * 100;
        const cutPercent = Math.max(0, Math.min(100, defaultCutPercent + cutPercentAdjustment));

        container.style.clipPath = `inset(${cutPercent}% 0 0 0)`;
        container.style.webkitClipPath = `inset(${cutPercent}% 0 0 0)`;
      }
      // Fallback al comportamiento anterior (sin puntos de anclaje)
      else if (position) {
        container.style.left = `${position.x * 100}%`;
        container.style.top = `${position.y * 100}%`;

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
      }

      animationFrameRef.current = requestAnimationFrame(updateFromRefs);
    };

    updateFromRefs();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [positionRef, rotationRef, scaleRef, anchorPointsRef, earPositionsRef, trackingType, debugConfig]);

  const handleLoad = () => {
    console.log('Modelo cargado exitosamente con model-viewer');
    if (trackingType === 'face') {
      setLeftLoaded(true);
      setRightLoaded(true);
    } else {
      setSingleLoaded(true);
    }
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
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
        background: 'transparent',
      }}
    >
      {trackingType === 'face' ? (
        // Dos instancias del mismo arete (izquierda y derecha)
        <>
          <div
            className="earring-left"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.28))',
            }}
          >
            <model-viewer
              ref={leftModelViewerRef}
              src={leftSrc}
              alt="Arete izquierdo"
              camera-controls={false}
              disable-pan
              disable-zoom
              disable-tap
              interaction-prompt="none"
              environment-image="legacy"
              exposure="1.3"
              shadow-intensity="0.6"
              tone-mapping="commerce"
              camera-orbit="0deg 78deg auto"
              min-camera-orbit="0deg 78deg auto"
              max-camera-orbit="0deg 78deg auto"
              field-of-view="20deg"
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                '--poster-color': 'transparent',
                opacity: 1,
              }}
              onLoad={handleLoad}
              onError={handleError}
            ></model-viewer>
          </div>
          <div
            className="earring-right"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.28))',
            }}
          >
            <model-viewer
              ref={rightModelViewerRef}
              src={rightSrc}
              alt="Arete derecho"
              camera-controls={false}
              disable-pan
              disable-zoom
              disable-tap
              interaction-prompt="none"
              environment-image="legacy"
              exposure="1.3"
              shadow-intensity="0.6"
              tone-mapping="commerce"
              camera-orbit="0deg 78deg auto"
              min-camera-orbit="0deg 78deg auto"
              max-camera-orbit="0deg 78deg auto"
              field-of-view="20deg"
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                '--poster-color': 'transparent',
                opacity: 1,
              }}
              onLoad={handleLoad}
              onError={handleError}
            ></model-viewer>
          </div>
        </>
      ) : (
        // Una instancia para collares/pulseras
        <model-viewer
          src={singleSrc}
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
            opacity: singleLoaded ? 1 : 0.5,
            transition: 'opacity 0.2s ease-in-out',
          }}
          onLoad={handleLoad}
          onError={handleError}
        ></model-viewer>
      )}
    </div>
  );
});

export default JewelryRendererModelViewer;
