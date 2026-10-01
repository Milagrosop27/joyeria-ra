import { useEffect, useRef, memo } from 'react';
import PoseTracking from './PoseTracking';

const poseTracking = new PoseTracking();

const drawCoveredVideo = (ctx, video, width, height) => {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;

  const scale = Math.max(width / vw, height / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;

  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, dx, dy, dw, dh);
  ctx.restore();
};

const NeckOccluder = memo(({ videoRef, landmarksRef, neckRef }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const render = () => {
      const video = videoRef?.current;
      const landmarks = landmarksRef?.current;
      const parent = canvas.parentElement;

      if (parent) {
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (video && video.readyState >= 2 && landmarks && landmarks.length >= 13) {
        const polygon = poseTracking.getNeckOcclusionPolygon(landmarks, neckRef?.current);
        if (polygon && polygon.length > 2) {
          ctx.save();
          ctx.beginPath();
          polygon.forEach((point, index) => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.clip();
          drawCoveredVideo(ctx, video, canvas.width, canvas.height);
          ctx.restore();
        }
      }

      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [videoRef, landmarksRef, neckRef]);

  return (
    <canvas
      ref={canvasRef}
      className="neck-occluder"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3
      }}
    />
  );
});

export default NeckOccluder;
