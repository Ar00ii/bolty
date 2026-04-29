'use client';

import { useMotionValue } from 'framer-motion';
import { useMotionTemplate, motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';

import { cn } from '@/lib/utils';

export const EvervaultCard = ({
  text,
  className,
  children,
}: {
  text?: string;
  className?: string;
  children?: React.ReactNode;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState('');

  useEffect(() => {
    const str = generateRandomString(1500);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRandomString(str);
  }, []);

  const onMouseMove = useCallback(
    ({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);

      const str = generateRandomString(1500);
      setRandomString(str);
    },
    [mouseX, mouseY],
  );

  return (
    <div
      className={cn(
        'p-0.5 bg-transparent flex items-center justify-center w-full h-full relative',
        className,
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card w-full relative overflow-hidden bg-transparent flex flex-col items-center justify-center h-full"
      >
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
          {children ? (
            children
          ) : (
            <p className="text-sm font-light text-white text-center">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export function CardPattern({
  mouseX,
  mouseY,
  randomString,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  randomString: string;
}) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-atlas-500/20 to-atlas-600/20 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 text-[0.6rem] h-full break-words whitespace-pre-wrap text-white font-mono font-light transition duration-500 leading-tight p-2 opacity-40">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const generateRandomString = (length: number) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const Icon = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'h-6 w-6 rounded-full border-2 border-white/30 flex items-center justify-center text-white',
        className,
      )}
      {...rest}
    />
  );
};
