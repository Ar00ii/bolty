'use client'

import React, { HTMLAttributes, useCallback, useMemo } from "react"
import { motion } from "framer-motion"

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
  return (
    <motion.div
      style={
        {
          "--x": `${x}`,
          "--width": `${width}`,
          "--background": `linear-gradient(rgba(255, 255, 255, 0.8), transparent)`,
        } as React.CSSProperties
      }
      className={`absolute top-0 left-[var(--x)] w-[var(--width)] h-32 [background:var(--background)]`}
      initial={{ y: "100%", x: "-50%" }}
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
  gridColor = "rgba(255, 255, 255, 0.1)",
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
    <div className={cn("relative rounded-xl border overflow-hidden p-6", className)} {...props}>
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
        <div
          className="absolute z-20 h-full w-full origin-[50%_0%] overflow-hidden"
          style={{
            transform: "rotateX(-90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "center",
          }}
        >
          {topBeams.map((beam, index) => (
            <Beam
              key={`top-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>

        {/* bottom side */}
        <div
          className="absolute top-full z-10 h-full w-full origin-[50%_0%] overflow-hidden"
          style={{
            transform: "rotateX(-90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "center",
            opacity: 0.5,
          }}
        >
          {bottomBeams.map((beam, index) => (
            <Beam
              key={`bottom-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>

        {/* left side */}
        <div
          className="absolute top-0 left-0 z-20 h-full w-full origin-[0%_0%] overflow-hidden"
          style={{
            transform: "rotateY(90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "center",
            opacity: 0.6,
          }}
        >
          {leftBeams.map((beam, index) => (
            <Beam
              key={`left-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>

        {/* right side */}
        <div
          className="absolute top-0 right-0 z-20 h-full w-full origin-[100%_0%] overflow-hidden"
          style={{
            transform: "rotateY(-90deg)",
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: "center",
            opacity: 0.6,
          }}
        >
          {rightBeams.map((beam, index) => (
            <Beam
              key={`right-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
            />
          ))}
        </div>

        {/* Fade effect */}
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(10, 10, 10, 0.8) 100%)",
          }}
        />
      </div>

      <div className="relative z-40">{children}</div>
    </div>
  )
}
