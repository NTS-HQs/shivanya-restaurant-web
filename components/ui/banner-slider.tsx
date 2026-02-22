"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BannerSliderProps {
  images: string[];
  className?: string;
  /** Content to render on top of the slider (e.g., text overlay) */
  children?: React.ReactNode;
  /** Interval in ms between slides. Default: 4000 */
  interval?: number;
}

export function BannerSlider({
  images,
  className = "",
  children,
  interval = 4000,
}: BannerSliderProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [images.length, interval, next]);

  // Fallback when no images are provided
  if (images.length === 0) {
    return (
      <div
        className={`relative overflow-hidden ${className} bg-slate-200 flex items-center justify-center`}
      >
        <span className="text-5xl">🍕</span>
        {children && (
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent">
            <div className="h-full flex flex-col justify-end">{children}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Slides */}
      <AnimatePresence initial={false} mode="sync">
        <motion.img
          key={current}
          src={images[current]}
          alt={`Banner ${current + 1}`}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />

      {/* Dot indicators — only show when multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6" : "bg-white/50 w-2"
              }`}
            />
          ))}
        </div>
      )}

      {/* Children (text overlay etc.) */}
      {children && (
        <div className="relative z-20 h-full flex flex-col justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
