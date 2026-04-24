'use client';

import { Loader2, Minus, Move, Plus, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lightweight image cropper styled like the profile-picture editors
 * users already know. Opens with a source file, shows the image inside
 * a fixed-aspect frame, lets the user pan (drag) + zoom (wheel or
 * slider), then outputs a data URL at the target output size so the
 * cropped image drops cleanly into Pinata + storage.
 *
 * Pure canvas export — no crop library added to the bundle.
 */

export type CropAspect = 'banner' | 'logo';

const PRESETS: Record<
  CropAspect,
  { frameW: number; frameH: number; outW: number; outH: number; label: string }
> = {
  // 3:1 wide banner — 1200×400 out, frame sized for the modal.
  banner: { frameW: 480, frameH: 160, outW: 1200, outH: 400, label: 'Banner' },
  // Square logo — 512×512 out, frame sized for the modal.
  logo: { frameW: 280, frameH: 280, outW: 512, outH: 512, label: 'Logo' },
};

export function ImageCropModal({
  open,
  source,
  aspect,
  onCancel,
  onSave,
}: {
  open: boolean;
  source: string | null;
  aspect: CropAspect;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const preset = PRESETS[aspect];
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  // Load the source image and fit it so the smaller side covers the
  // frame. minZoom is that "cover" scale — below it, gaps would show.
  useEffect(() => {
    if (!source || !open) {
      setImg(null);
      return;
    }
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => {
      const sFrame = Math.max(
        preset.frameW / el.naturalWidth,
        preset.frameH / el.naturalHeight,
      );
      setImg(el);
      setMinZoom(sFrame);
      setZoom(sFrame);
      setTx(0);
      setTy(0);
    };
    el.src = source;
  }, [source, open, preset.frameW, preset.frameH]);

  const clamp = useCallback(
    (nx: number, ny: number, z: number) => {
      if (!img) return { x: nx, y: ny };
      const scaledW = img.naturalWidth * z;
      const scaledH = img.naturalHeight * z;
      const halfW = Math.max(0, (scaledW - preset.frameW) / 2);
      const halfH = Math.max(0, (scaledH - preset.frameH) / 2);
      return {
        x: Math.max(-halfW, Math.min(halfW, nx)),
        y: Math.max(-halfH, Math.min(halfH, ny)),
      };
    },
    [img, preset.frameW, preset.frameH],
  );

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragging.current = { x: e.clientX - tx, y: e.clientY - ty };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const nx = e.clientX - dragging.current.x;
    const ny = e.clientY - dragging.current.y;
    const c = clamp(nx, ny, zoom);
    setTx(c.x);
    setTy(c.y);
  }
  function onPointerUp() {
    dragging.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    applyZoom(zoom + delta);
  }
  function applyZoom(nextZ: number) {
    const z = Math.max(minZoom, Math.min(minZoom * 4, nextZ));
    const c = clamp(tx, ty, z);
    setZoom(z);
    setTx(c.x);
    setTy(c.y);
  }

  async function save() {
    if (!img) return;
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = preset.outW;
      canvas.height = preset.outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unsupported');
      // Frame→source mapping: the visible frame is (frameW, frameH);
      // at the current zoom, one source pixel occupies `zoom` frame
      // pixels. The image is drawn centered, then translated by (tx,ty).
      // So the top-left of the visible frame, in source-pixel space:
      //   sx = (img.w - frameW/zoom)/2 - tx/zoom
      //   sy = (img.h - frameH/zoom)/2 - ty/zoom
      const srcW = preset.frameW / zoom;
      const srcH = preset.frameH / zoom;
      const sx = (img.naturalWidth - srcW) / 2 - tx / zoom;
      const sy = (img.naturalHeight - srcH) / 2 - ty / zoom;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, preset.outW, preset.outH);
      const out = canvas.toDataURL('image/jpeg', 0.92);
      onSave(out);
    } finally {
      setSaving(false);
    }
  }

  if (!open || !source) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0c0c10',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-zinc-500" />
            <div className="text-[13px] text-white font-light">
              Adjust {preset.label.toLowerCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid place-items-center w-7 h-7 rounded-md text-zinc-500 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid place-items-center">
            <div
              ref={frameRef}
              className={`relative overflow-hidden select-none touch-none ${
                aspect === 'logo' ? 'rounded-full' : 'rounded-xl'
              }`}
              style={{
                width: preset.frameW,
                height: preset.frameH,
                background: '#050508',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: dragging.current ? 'grabbing' : 'grab',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: img.naturalWidth * zoom,
                    height: img.naturalHeight * zoom,
                    transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => applyZoom(zoom - 0.1)}
              className="grid place-items-center w-7 h-7 rounded-md text-zinc-400 hover:text-white transition"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              aria-label="Zoom out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={minZoom * 4}
              step={0.001}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              className="flex-1 accent-[#836EF9]"
            />
            <button
              type="button"
              onClick={() => applyZoom(zoom + 0.1)}
              className="grid place-items-center w-7 h-7 rounded-md text-zinc-400 hover:text-white transition"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              aria-label="Zoom in"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11.5px] text-zinc-500 text-center">
            Drag to reposition · scroll or slider to zoom
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] text-zinc-300 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !img}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12.5px] text-white transition hover:brightness-110 disabled:opacity-60"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.6) 0%, rgba(131,110,249,0.45) 100%)',
              boxShadow:
                '0 0 0 1px rgba(131,110,249,0.5), 0 0 20px -8px rgba(131,110,249,0.6)',
            }}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
