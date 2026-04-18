import { useRef, useEffect, useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';

const PALETTE = [
  '#000000','#ffffff','#ef4444','#f97316','#eab308',
  '#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6',
  '#92400e','#64748b',
];
const SIZES = [3, 7, 13, 22];

export default function DrawCanvas() {
  const canvasRef    = useRef(null);
  const drawingRef   = useRef(false);
  const lastRef      = useRef(null);
  const [color, setColor] = useState('#000000');
  const [size,  setSize]  = useState(7);
  const [tool,  setTool]  = useState('pen'); // pen | eraser | fill

  const { sendStroke, sendClearCanvas, subscribeToStrokes, subscribeToClear, amDrawing } = useGame();

  // ── Canvas helpers ─────────────────────────────────────────────

  const getPos = (e, canvas) => {
    const r  = canvas.getBoundingClientRect();
    const sx = canvas.width  / r.width;
    const sy = canvas.height / r.height;
    const src = e.touches?.[0] ?? e;
    return { x:(src.clientX - r.left)*sx, y:(src.clientY - r.top)*sy };
  };

  const drawSeg = (ctx, from, to, c, w) => {
    ctx.beginPath();
    ctx.strokeStyle = c; ctx.lineWidth = w;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const drawDot = (ctx, x, y, c, w) => {
    ctx.beginPath(); ctx.fillStyle = c;
    ctx.arc(x, y, w/2, 0, Math.PI*2); ctx.fill();
  };

  const clearCanvas = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
  }, []);

  const floodFill = (ctx, cv, sx, sy, hex) => {
    const data = ctx.getImageData(0, 0, cv.width, cv.height);
    const d    = data.data;
    const idx  = (y,x) => (y*cv.width+x)*4;
    const x0 = Math.floor(sx), y0 = Math.floor(sy);
    const tgt = d.slice(idx(y0,x0), idx(y0,x0)+4);
    const fill = [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16), 255];
    const match = a => Math.abs(a[0]-tgt[0])<35 && Math.abs(a[1]-tgt[1])<35 && Math.abs(a[2]-tgt[2])<35;
    if (match(fill)) return;
    const stack = [[x0,y0]];
    const vis   = new Uint8Array(cv.width*cv.height);
    while (stack.length) {
      const [x,y] = stack.pop();
      if (x<0||x>=cv.width||y<0||y>=cv.height) continue;
      const i = y*cv.width+x;
      if (vis[i]) continue; vis[i]=1;
      const px = d.slice(idx(y,x),idx(y,x)+4);
      if (!match(px)) continue;
      d[idx(y,x)]=fill[0]; d[idx(y,x)+1]=fill[1]; d[idx(y,x)+2]=fill[2]; d[idx(y,x)+3]=255;
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    ctx.putImageData(data, 0, 0);
  };

  // ── Pointer events (drawer only) ───────────────────────────────

  const onDown = useCallback((e) => {
    if (!amDrawing) return;
    e.preventDefault();
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    const pos = getPos(e, cv);

    if (tool === 'fill') {
      floodFill(ctx, cv, pos.x, pos.y, color);
      sendStroke({ type:'FILL', x:pos.x/cv.width, y:pos.y/cv.height, color });
      return;
    }

    drawingRef.current = true;
    lastRef.current    = pos;
    const sc = tool==='eraser' ? '#ffffff' : color;
    const sw = tool==='eraser' ? size*3 : size;
    drawDot(ctx, pos.x, pos.y, sc, sw);
    sendStroke({ type:'DOT', x:pos.x/cv.width, y:pos.y/cv.height, color:sc, width:sw });
  }, [amDrawing, tool, color, size, sendStroke]);

  const onMove = useCallback((e) => {
    if (!drawingRef.current || !amDrawing || tool==='fill') return;
    e.preventDefault();
    const cv  = canvasRef.current;
    const ctx = cv.getContext('2d');
    const pos = getPos(e, cv);
    const from = lastRef.current;
    const sc = tool==='eraser' ? '#ffffff' : color;
    const sw = tool==='eraser' ? size*3 : size;
    drawSeg(ctx, from, pos, sc, sw);
    sendStroke({ type:'SEG', fx:from.x/cv.width, fy:from.y/cv.height, tx:pos.x/cv.width, ty:pos.y/cv.height, color:sc, width:sw });
    lastRef.current = pos;
  }, [amDrawing, tool, color, size, sendStroke]);

  const onUp = useCallback(() => { drawingRef.current = false; }, []);

  const handleClear = () => { clearCanvas(); sendClearCanvas(); };

  // ── Receive remote strokes ─────────────────────────────────────

  useEffect(() => {
    const unsub = subscribeToStrokes((raw) => {
      const cv  = canvasRef.current; if (!cv) return;
      const ctx = cv.getContext('2d');
      const list = Array.isArray(raw) ? raw : [raw];
      list.forEach(s => {
        if (!s) return;
        if (s.type === 'CLEAR') {
          clearCanvas();
        } else if (s.type === 'SEG') {
          drawSeg(ctx, { x:s.fx*cv.width, y:s.fy*cv.height }, { x:s.tx*cv.width, y:s.ty*cv.height }, s.color, s.width);
        } else if (s.type === 'DOT') {
          drawDot(ctx, s.x*cv.width, s.y*cv.height, s.color, s.width);
        } else if (s.type === 'FILL') {
          floodFill(ctx, cv, s.x*cv.width, s.y*cv.height, s.color);
        }
      });
    });
    return unsub;
  }, [subscribeToStrokes, clearCanvas]);

  useEffect(() => {
    const unsub = subscribeToClear(clearCanvas);
    return unsub;
  }, [subscribeToClear, clearCanvas]);

  useEffect(() => { clearCanvas(); }, [clearCanvas]);

  const cursor = !amDrawing ? '' : tool==='eraser' ? 'canvas-eraser' : 'canvas-pen';

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Canvas */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={900} height={560}
          className={cursor}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>

      {/* Toolbar — drawer only */}
      {amDrawing && (
        <div className="card p-3 flex flex-wrap items-center gap-3">
          {/* Colors */}
          <div className="flex flex-wrap gap-1.5">
            {PALETTE.map(c => (
              <button key={c} onClick={() => { setColor(c); setTool('pen'); }}
                style={{
                  width:26, height:26, borderRadius:'50%', background:c,
                  border:'none', cursor:'pointer', flexShrink:0,
                  outline: color===c && tool==='pen' ? '3px solid var(--accent)' : c==='#ffffff' ? '1px solid #ccc' : 'none',
                  outlineOffset:2,
                  transition:'outline 0.1s',
                }} />
            ))}
          </div>

          <div style={{ width:1, height:28, background:'var(--border)' }} />

          {/* Sizes */}
          <div className="flex items-center gap-2">
            {SIZES.map(s => (
              <button key={s} onClick={() => { setSize(s); setTool('pen'); }}
                style={{
                  width:s+10, height:s+10, borderRadius:'50%',
                  background: size===s && tool==='pen' ? 'var(--accent)' : 'var(--bg-card2)',
                  border:'none', cursor:'pointer', flexShrink:0, transition:'background 0.1s',
                }} />
            ))}
          </div>

          <div style={{ width:1, height:28, background:'var(--border)' }} />

          {/* Tools */}
          <div className="flex gap-1.5">
            {[{ t:'fill',icon:'🪣' },{ t:'eraser',icon:'🧹' }].map(({t,icon})=>(
              <button key={t} onClick={()=>setTool(t)}
                style={{
                  padding:'5px 10px', borderRadius:8, fontSize:14,
                  background: tool===t ? 'var(--btn-primary-bg)' : 'var(--bg-card2)',
                  color: tool===t ? '#fff' : 'var(--text-muted)',
                  border:'none', cursor:'pointer',
                }}>
                {icon}
              </button>
            ))}
            <button onClick={handleClear}
              style={{ padding:'5px 10px', borderRadius:8, fontSize:14,
                background:'rgba(239,68,68,0.1)', color:'var(--red)',
                border:'none', cursor:'pointer' }}>
              🗑️
            </button>
          </div>
        </div>
      )}

      {!amDrawing && (
        <p className="text-center text-sm py-1"
           style={{ color:'var(--text-faint)', fontFamily:"'Noto Sans Tamil',sans-serif" }}>
          👁️ கவனியுங்கள் மற்றும் யூகியுங்கள்!
        </p>
      )}
    </div>
  );
}
