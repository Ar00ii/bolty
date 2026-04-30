'use client';

import { Loader2, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Modal } from '@/components/ui/Modal';

interface AvatarCropperModalProps {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
}

const OUTPUT_SIZE = 512; // square output, big enough for retina avatars

export function AvatarCropperModal({ open, file, onClose, onSave }: AvatarCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the file into an HTMLImageElement
  useEffect(() => {
    if (!file) {
      setImageEl(null);
      return;
    }
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImageEl(img);
    img.onerror = () => setError('Could not read image file');
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Re-paint canvas any time inputs change
  useEffect(() => {
    if (!open || !imageEl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // The crop is always the full canvas (square). We compute an inscribed
    // size so that at zoom=1 the image's smaller dimension fits the canvas.
    const baseScale = OUTPUT_SIZE / Math.min(imageEl.width, imageEl.height);
    const scale = baseScale * zoom;
    const w = imageEl.width * scale;
    const h = imageEl.height * scale;

    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2 + offset.x, OUTPUT_SIZE / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(imageEl, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, [open, imageEl, zoom, rotation, offset]);

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }
  function onPointerUp() {
    setDragging(false);
    setDragStart(null);
  }

  async function handleSave() {
    if (!canvasRef.current) return;
    setSaving(true);
    setError(null);
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvasRef.current!.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))),
          'image/jpeg',
          0.92,
        );
      });
      await onSave(blob);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Adjust profile photo" size="md">
      <div className="space-y-4">
        <div
          ref={containerRef}
          className="relative w-full aspect-square overflow-hidden rounded-xl"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full select-none"
            style={{ pointerEvents: 'none' }}
            aria-label="Avatar preview"
          />
          {/* Circular mask: corners dim (what's cropped away), circle clear.
              A non-inset box-shadow spreads OUTSIDE the circle element;
              the parent's overflow-hidden clips it to the square viewport. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: '0 0 0 9999px rgba(9,9,11,0.72)',
              borderRadius: '50%',
              outline: '1px solid rgba(255,255,255,0.18)',
              outlineOffset: '-1px',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="grid place-items-center w-8 h-8 rounded-md text-zinc-400 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-bolty-400"
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="grid place-items-center w-8 h-8 rounded-md text-zinc-400 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="inline-flex items-center gap-1 px-2.5 h-8 rounded-md text-[11.5px] text-zinc-400 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Rotate"
          >
            <RotateCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            Rotate
          </button>
        </div>

        {error && <div className="text-[12px] text-red-300">{error}</div>}

        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-[12.5px] text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !imageEl}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold text-white transition disabled:opacity-50"
            style={{
              background:
                'linear-gradient(180deg, rgba(20, 241, 149,0.55) 0%, rgba(20, 241, 149,0.4) 100%)',
              boxShadow: '0 0 0 1px rgba(20, 241, 149,0.5), 0 0 20px -8px rgba(20, 241, 149,0.6)',
            }}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save photo
          </button>
        </div>
      </div>
    </Modal>
  );
}
