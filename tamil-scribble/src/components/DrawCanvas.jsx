import { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#a16207', '#6b7280',
];
const SIZES = [3, 7, 13, 20];

export default function DrawCanvas() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(7);
  const [tool, setTool] = useState('pen'); // pen | eraser | fill
  const { sendStroke, sendClearCanvas, subscribeToStrokes, amDrawing } = useGame();

  // ─── Canvas utilities ──────────────────────────────────────

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const drawSegment = (ctx, from, to, strokeColor, strokeWidth) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const floodFill = (ctx, canvas, startX, startY, fillColorHex) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const idx = (y, x) => (y * canvas.width + x) * 4;

    const target = data.slice(idx(Math.floor(startY), Math.floor(startX)), idx(Math.floor(startY), Math.floor(startX)) + 4);
    const fill = hexToRGBA(fillColorHex);

    if (colorMatch(target, fill)) return;

    const stack = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Uint8Array(canvas.width * canvas.height);

    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      const i = y * canvas.width + x;
      if (visited[i]) continue;
      visited[i] = 1;
      const pixel = data.slice(idx(y, x), idx(y, x) + 4);
      if (!colorMatch(pixel, target)) continue;
      data[idx(y,x)] = fill[0];
      data[idx(y,x)+1] = fill[1];
      data[idx(y,x)+2] = fill[2];
      data[idx(y,x)+3] = 255;
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const hexToRGBA = (hex) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return [r,g,b,255];
  };

  const colorMatch = (a, b) => {
    return Math.abs(a[0]-b[0]) < 30 && Math.abs(a[1]-b[1]) < 30 && Math.abs(a[2]-b[2]) < 30;
  };

  // ─── Event handlers ────────────────────────────────────────

  const handlePointerDown = useCallback((e) => {
    if (!amDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);

    if (tool === 'fill') {
      const ctx = canvas.getContext('2d');
      floodFill(ctx, canvas, pos.x, pos.y, color);
      sendStroke({ type: 'FILL', x: pos.x / canvas.width, y: pos.y / canvas.height, color });
      return;
    }

    isDrawingRef.current = true;
    lastPosRef.current = pos;
    // Draw a dot for single tap
    const ctx = canvas.getContext('2d');
    const strokeColor = tool === 'eraser' ? '#ffffff' : color;
    const strokeWidth = tool === 'eraser' ? size * 3 : size;
    ctx.beginPath();
    ctx.fillStyle = strokeColor;
    ctx.arc(pos.x, pos.y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    sendStroke({ type: 'DOT', x: pos.x / canvas.width, y: pos.y / canvas.height, color: strokeColor, width: strokeWidth });
  }, [amDrawing, tool, color, size, sendStroke]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawingRef.current || !amDrawing || tool === 'fill') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    const from = lastPosRef.current;
    const strokeColor = tool === 'eraser' ? '#ffffff' : color;
    const strokeWidth = tool === 'eraser' ? size * 3 : size;

    drawSegment(ctx, from, pos, strokeColor, strokeWidth);

    // Send normalized coordinates (so canvas size doesn't matter for remotes)
    sendStroke({
      type: 'SEG',
      fx: from.x / canvas.width, fy: from.y / canvas.height,
      tx: pos.x / canvas.width, ty: pos.y / canvas.height,
      color: strokeColor,
      width: strokeWidth,
    });

    lastPosRef.current = pos;
  }, [amDrawing, tool, color, size, sendStroke]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sendClearCanvas();
  };

  // ─── Receive remote strokes ─────────────────────────────────

  useEffect(() => {
    const unsubscribe = subscribeToStrokes((strokeOrArray) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const strokes = Array.isArray(strokeOrArray) ? strokeOrArray : [strokeOrArray];

      strokes.forEach(stroke => {
        if (!stroke) return;
        if (stroke.type === 'CLEAR') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (stroke.type === 'SEG') {
          drawSegment(ctx,
            { x: stroke.fx * canvas.width, y: stroke.fy * canvas.height },
            { x: stroke.tx * canvas.width, y: stroke.ty * canvas.height },
            stroke.color, stroke.width
          );
        } else if (stroke.type === 'DOT') {
          ctx.beginPath();
          ctx.fillStyle = stroke.color;
          ctx.arc(stroke.x * canvas.width, stroke.y * canvas.height, stroke.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (stroke.type === 'FILL') {
          floodFill(ctx, canvas, stroke.x * canvas.width, stroke.y * canvas.height, stroke.color);
        }
      });
    });
    return unsubscribe;
  }, [subscribeToStrokes]);

  // ─── Init canvas ────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const cursorClass = !amDrawing ? '' : tool === 'eraser' ? 'canvas-eraser' : 'canvas-pen';

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Canvas */}
      <div className="canvas-wrapper rounded-2xl overflow-hidden border-2 border-purple-800/40"
           style={{ background: '#fff' }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={560}
          className={`${cursorClass}`}
          style={{ display: 'block', width: '100%', height: '100%' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      {/* Toolbar — only shown to drawer */}
      {amDrawing && (
        <div className="card p-3 flex flex-wrap items-center gap-3">
          {/* Colors */}
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                title={c}
                style={{
                  background: c,
                  width: 28, height: 28,
                  borderRadius: '50%',
                  border: color === c && tool === 'pen'
                    ? '3px solid #a855f7'
                    : c === '#ffffff' ? '2px solid #555' : '2px solid transparent',
                  boxShadow: color === c && tool === 'pen' ? '0 0 8px rgba(168,85,247,0.7)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          {/* Brush sizes */}
          <div className="flex items-center gap-2">
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => { setSize(s); setTool('pen'); }}
                style={{
                  width: s + 10, height: s + 10,
                  background: size === s && tool === 'pen' ? '#a855f7' : '#4b5563',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          {/* Tools */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool('fill')}
              title="Fill tool"
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                tool === 'fill'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              🪣
            </button>
            <button
              onClick={() => setTool('eraser')}
              title="Eraser"
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                tool === 'eraser'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              🧹
            </button>
            <button
              onClick={handleClear}
              title="Clear all"
              className="px-3 py-1.5 rounded-lg text-sm font-bold bg-red-900/50 text-red-300 hover:bg-red-800 transition-all"
            >
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Spectator notice */}
      {!amDrawing && (
        <div className="text-center text-slate-500 text-sm font-tamil py-1">
          👁️ கவனியுங்கள் மற்றும் யூகியுங்கள்!
        </div>
      )}
    </div>
  );
}
