import React, { useEffect, useRef } from 'react';

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Estrellas estáticas con titileo
    const stars: { x: number; y: number; radius: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    // Estrellas fugaces (meteoros diagonales idénticos a campuslands.com)
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      active: boolean;
    }
    const shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 1.2 - width * 0.2,
        y: Math.random() * (height * 0.4),
        length: Math.random() * 80 + 50,
        speed: Math.random() * 7 + 9,
        opacity: 1,
        active: true,
      });
    };

    let lastSpawn = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Dibujar fondo cósmico sutil
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        100,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      gradient.addColorStop(0, 'rgba(8, 18, 42, 0.4)');
      gradient.addColorStop(0.5, 'rgba(3, 8, 22, 0.8)');
      gradient.addColorStop(1, '#02050e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Dibujar estrellas titilantes
      for (const star of stars) {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, star.alpha)})`;
        ctx.shadowBlur = star.radius > 1.2 ? 6 : 0;
        ctx.shadowColor = '#54C6AA';
        ctx.fill();
      }

      // Generar estrellas fugaces cada 2.5 - 4 segundos
      if (Date.now() - lastSpawn > 2600 && Math.random() > 0.6) {
        spawnShootingStar();
        lastSpawn = Date.now();
      }

      // Dibujar y animar estrellas fugaces (ángulo ~35 grados)
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        const angle = Math.PI / 4; // 45 grados diagonal
        const tailX = s.x - Math.cos(angle) * s.length;
        const tailY = s.y - Math.sin(angle) * s.length;

        const starGrad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        starGrad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        starGrad.addColorStop(0.3, `rgba(84, 198, 170, ${s.opacity * 0.8})`);
        starGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        s.x += Math.cos(angle) * s.speed;
        s.y += Math.sin(angle) * s.speed;
        s.opacity -= 0.012;

        if (s.opacity <= 0 || s.x > width + 100 || s.y > height + 100) {
          s.active = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
