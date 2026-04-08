'use client'

import React, { HTMLAttributes, useCallback, useMemo } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  perspective?: number
  beamsPerSide?: number
  beamSize?: number
  beamDelayMax?: number
  beamDelayMin?: number
  beamDuration?: number
  gridColor?: string
}

const Beam = ({
  width,
  x,
  delay,
  duration,
}: {
  width: string | number
  x: string | number
  delay: number
  duration: number
}) => {
  const colors = [
    'rgba(131, 110, 249, 0.6)', // monad purple
    'rgba(6, 182, 212, 0.6)', // cyan
    'rgba(236, 72, 153, 0.6)', // pink
    'rgba(139, 92, 246, 0.6)', // violet
    'rgba(59, 130, 246, 0.6)', // blue
    'rgba(34, 197, 94, 0.6)', // green
  ]
  const color = colors[Math.floor(Math.random() * colors.length)]
  const ar = Math.floor(Math.random() * 15) + 3

  return (
    <motion.div
      style={
        {
          "--x": `${x}`,
          "--width": `${width}`,
          "--aspect-ratio": `${ar}`,
          "--background": `linear-gradient(${color}, transparent)`,
        } as React.CSSProperties
      }
      className={`absolute top-0 left-[var(--x)] aspect-[1/var(--aspect-ratio)] w-[var(--width)] [background:var(--background)]`}
      initial={{ y: "100cqmax", x: "-50%" }}
      animate={{ y: "-100%", x: "-50%" }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 100,
  className,
  beamsPerSide = 3,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3,
  gridColor = "var(--border)",
  ...props
}) => {
  const generateBeams = useCallback(() => {
    const beams = []
    const cellsPerSide = Math.floor(100 / beamSize)
    const step = cellsPerSide / beamsPerSide

    for (let i = 0; i < beamsPerSide; i++) {
      const x = Math.floor(i * step)
      const delay = Math.random() * (beamDelayMax - beamDelayMin) + beamDelayMin
      beams.push({ x, delay })
    }
    return beams
  }, [beamsPerSide, beamSize, beamDelayMax, beamDelayMin])

  const topBeams = useMemo(() => generateBeams(), [generateBeams])
  const rightBeams = useMemo(() => generateBeams(), [generateBeams])
  const bottomBeams = useMemo(() => generateBeams(), [generateBeams])
  const leftBeams = useMemo(() => generateBeams(), [generateBeams])

  return (
    <div className={cn("relative rounded border p-6", className)} {...props}>
      <div
        style={
          {
            "--perspective": `${perspective}px`,
            "--grid-color": gridColor,
            "--beam-size": `${beamSize}%`,
          } as React.CSSProperties
        }
        className="pointer-events-none absolute top-0 left-0 size-full overflow-hidden [clipPath:inset(0)]"
        style={{
          perspective: `${perspective}px`,
        }}
      >
        {/* top side */}
        <div className="@container absolute z-20 h-[100cqmax] w-[100cqi] origin-[50%_0%] overflow-hidden"
          style={{
            transform: "rotateX(-90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "50% -0.5px",
          }}
        />

        {/* bottom side */}
        <div className="@container absolute top-full z-20 h-[100cqmax] w-[100cqi] origin-[50%_0%] overflow-hidden"
          style={{
            transform: "rotateX(-90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "50% -0.5px",
          }}
        />
        {/* left side */}
        <div className="@container absolute top-0 left-0 z-20 h-[100cqmax] w-[100cqh] origin-[0%_0%] overflow-hidden"
          style={{
            transform: "rotate(90deg) rotateX(-90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "50% -0.5px",
          }}
        />
        {/* right side */}
        <div className="@container absolute top-0 right-0 z-20 h-[100cqmax] w-[100cqh] origin-[100%_0%] overflow-hidden"
          style={{
            transform: "rotate(-90deg) rotateX(-90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "50% -0.5px",
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
