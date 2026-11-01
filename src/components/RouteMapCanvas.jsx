import React, { useRef, useEffect } from 'react';

/**
 * RouteMapCanvas
 * High-performance HTML5 Canvas component that renders the live route polyline,
 * start point, live beacon, distance scale, and city grid background.
 */
export default function RouteMapCanvas({
  routePoints = [],
  isTracking = false,
  height = 240,
  interactive = true,
  currentLocation = null
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement ? canvas.parentElement.clientWidth : 360;
    
    // Support high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // 1. Draw Map Background (Modern dark/slate terrain grid)
    drawBackground(ctx, width, height);

    // 2. If no points, show waiting state
    if (!routePoints || routePoints.length === 0) {
      drawEmptyState(ctx, width, height, isTracking);
      return;
    }

    // 3. Compute geographic bounds to fit canvas with padding
    const padding = 36;
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    routePoints.forEach((pt) => {
      if (pt.latitude < minLat) minLat = pt.latitude;
      if (pt.latitude > maxLat) maxLat = pt.latitude;
      if (pt.longitude < minLng) minLng = pt.longitude;
      if (pt.longitude > maxLng) maxLng = pt.longitude;
    });

    // Ensure bounds are non-zero
    const latSpan = Math.max(0.0004, maxLat - minLat);
    const lngSpan = Math.max(0.0004, maxLng - minLng);

    const project = (lat, lng) => {
      const x = padding + ((lng - (minLng - lngSpan * 0.1)) / (lngSpan * 1.2)) * (width - padding * 2);
      // Invert Y for latitude (North is up)
      const y = height - (padding + ((lat - (minLat - latSpan * 0.1)) / (latSpan * 1.2)) * (height - padding * 2));
      return { x, y };
    };

    // 4. Draw route glow and polyline
    if (routePoints.length > 1) {
      // Glow underlay
      ctx.beginPath();
      const first = project(routePoints[0].latitude, routePoints[0].longitude);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < routePoints.length; i++) {
        const pt = project(routePoints[i].latitude, routePoints[i].longitude);
        ctx.lineTo(pt.x, pt.y);
      }

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Sharp main line
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < routePoints.length; i++) {
        const pt = project(routePoints[i].latitude, routePoints[i].longitude);
        ctx.lineTo(pt.x, pt.y);
      }

      // Linear gradient for polyline
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#16a34a');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // 5. Draw Start Pin (Green circle with S / flag)
    const startPt = project(routePoints[0].latitude, routePoints[0].longitude);
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#15803d';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', startPt.x, startPt.y);

    // 6. Draw Current Position / End Marker
    const lastCoord = routePoints[routePoints.length - 1];
    const currentPt = project(lastCoord.latitude, lastCoord.longitude);

    // Radar pulse ring
    ctx.beginPath();
    ctx.arc(currentPt.x, currentPt.y, 14, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(22, 163, 74, 0.2)';
    ctx.fill();

    // Beacon inner circle
    ctx.beginPath();
    ctx.arc(currentPt.x, currentPt.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#16a34a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Center white dot
    ctx.beginPath();
    ctx.arc(currentPt.x, currentPt.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 7. Mini Overlay Badges on Top/Bottom of Canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    roundRect(ctx, 12, 12, 110, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`GPS Ativo: ${routePoints.length} pts`, 22, 28);

  }, [routePoints, isTracking, height, currentLocation]);

  const drawBackground = (ctx, width, height) => {
    // Gradient dark slate background resembling map styles
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Street / topographical grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    const gridSize = 32;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Subtle route contour aesthetics
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 60, 0, 2 * Math.PI);
    ctx.arc(width * 0.5, height * 0.5, 110, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawEmptyState = (ctx, width, height, isTracking) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isTracking) {
      ctx.fillText('📡 Buscando sinal de GPS de alta precisão...', width / 2, height / 2 - 8);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('Mova-se para traçar o percurso percorrido.', width / 2, height / 2 + 12);
    } else {
      ctx.fillText('🗺️ Mapa de Trajeto em Tempo Real', width / 2, height / 2 - 8);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('Inicie uma caminhada para registrar seu mapa e GPS.', width / 2, height / 2 + 12);
    }
  };

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  return (
    <div style={{
      width: '100%',
      height: `${height}px`,
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 8px 20px -4px rgba(0, 0, 0, 0.25)'
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
