"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 51;

export default function ScrollSequenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  // Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const frameNumber = i.toString().padStart(3, "0");
      img.src = `/api/assets/ezgif-frame-${frameNumber}.jpg`;
      img.onload = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
      };
      loadedImages.push(img);
    }
    setImages(loadedImages);
  }, []);

  // Handle drawing and scroll
  useEffect(() => {
    if (imagesLoaded < FRAME_COUNT || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrameId: number;

    const render = () => {
      if (!containerRef.current) return;
      const section = containerRef.current.closest('section');
      if (!section) return;

      // Calculate scroll fraction exactly based on the sticky parent's rect
      const rect = section.getBoundingClientRect();
      const scrollDistance = -rect.top;
      const maxScroll = rect.height - window.innerHeight;
      const validMaxScroll = maxScroll > 0 ? maxScroll : 1;
      
      const scrollFraction = Math.min(Math.max(scrollDistance / validMaxScroll, 0), 1);
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(scrollFraction * FRAME_COUNT)
      );

      const img = images[frameIndex];
      
      if (img && img.complete) {
        // Draw image covering the canvas (object-fit: cover equivalent)
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
          drawHeight = canvas.width / imgRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imgRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }
    };

    const handleResize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
        render();
      }
    };

    window.addEventListener("scroll", render, { passive: true });
    window.addEventListener("resize", handleResize);
    
    // Initial setup
    handleResize();

    return () => {
      window.removeEventListener("scroll", render);
      window.removeEventListener("resize", handleResize);
    };
  }, [imagesLoaded, images]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden opacity-100">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
      {imagesLoaded < FRAME_COUNT && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 text-emerald-400 text-xs font-bold uppercase tracking-widest">
          Loading Visuals {Math.round((imagesLoaded / FRAME_COUNT) * 100)}%
        </div>
      )}
    </div>
  );
}
