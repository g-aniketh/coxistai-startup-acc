'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VortexProps {
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
}

export default function Vortex({
  className,
  containerClassName,
  particleCount = 100,
  rangeY = 400,
  baseHue = 220,
  baseSpeed = 0.5,
  rangeSpeed = 1.5,
  baseRadius = 1,
  rangeRadius = 2,
}: VortexProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      radius: number;
      speed: number;
      angle: number;
      hue: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * rangeY + canvas!.height / 2 - rangeY / 2;
        this.radius = Math.random() * rangeRadius + baseRadius;
        this.speed = Math.random() * rangeSpeed + baseSpeed;
        this.angle = Math.random() * Math.PI * 2;
        this.hue = baseHue + Math.random() * 60 - 30;
      }

      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Swirl effect
        const centerX = canvas!.width / 2;
        const centerY = canvas!.height / 2;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.angle += 0.02 * (1 - distance / (canvas!.width / 2));

        // Wrap around edges
        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, 0.3)`;
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    init();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount, rangeY, baseHue, baseSpeed, rangeSpeed, baseRadius, rangeRadius]);

  return (
    <div className={cn('relative w-full h-full', containerClassName)}>
      <canvas
        ref={canvasRef}
        className={cn('absolute inset-0 w-full h-full', className)}
      />
    </div>
  );
}

