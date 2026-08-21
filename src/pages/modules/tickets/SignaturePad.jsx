import { useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

export default function SignaturePad({ onSave, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasStroke(true);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  }

  function handleSave() {
    if (!hasStroke) return;
    onSave(canvasRef.current.toDataURL('image/png'));
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className="w-full border border-slate-300 rounded-md bg-white touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex justify-between gap-2">
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
          <Eraser className="w-3.5 h-3.5" /> Borrar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasStroke || saving}
          className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium"
        >
          {saving ? 'Guardando...' : 'Guardar firma'}
        </button>
      </div>
    </div>
  );
}
