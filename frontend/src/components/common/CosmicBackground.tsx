import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
  color: string;
  hasSpikes?: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  active: boolean;
  angle: number;
  color: string;
  lineWidth: number;
}

interface Nebula {
  xPercent: number;
  yPercent: number;
  radius: number;
  color: string;
  secondaryColor: string;
  pulseSpeed: number;
  phase: number;
}

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

    // Parallax del mouse suave
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Nebulosas espaciales vivas con pulsación orgánica
    const nebulae: Nebula[] = [
      {
        xPercent: 0.18,
        yPercent: 0.28,
        radius: 480,
        color: 'rgba(124, 58, 237, 0.12)', // Púrpura cósmico
        secondaryColor: 'rgba(79, 70, 229, 0.05)',
        pulseSpeed: 0.0006,
        phase: 0,
      },
      {
        xPercent: 0.82,
        yPercent: 0.45,
        radius: 520,
        color: 'rgba(0, 229, 255, 0.08)', // Cyan tecnológico
        secondaryColor: 'rgba(84, 198, 170, 0.03)',
        pulseSpeed: 0.0008,
        phase: Math.PI / 2,
      },
      {
        xPercent: 0.45,
        yPercent: 0.85,
        radius: 460,
        color: 'rgba(147, 122, 230, 0.09)', // Violeta profundo
        secondaryColor: 'rgba(0, 118, 183, 0.04)',
        pulseSpeed: 0.0005,
        phase: Math.PI,
      },
    ];

    // Estrellas titilantes de múltiples magnitudes
    const starColors = ['#ffffff', '#e0f2fe', '#c7d2fe', '#54C6AA'];
    const stars: Star[] = [];
    for (let i = 0; i < 160; i++) {
      const radius = Math.random() < 0.85 ? Math.random() * 1.3 + 0.4 : Math.random() * 2.0 + 1.2;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.004,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        hasSpikes: radius > 2.2, // Estrellas brillantes con destello de difracción en cruz
      });
    }

    // Meteoros y estrellas fugaces diagonales de alta visibilidad
    const shootingStars: ShootingStar[] = [];
    const meteorColors = ['#00E5FF', '#54C6AA', '#A78BFA', '#38BDF8'];

    const spawnShootingStar = () => {
      const angle = (Math.PI / 180) * (Math.random() * 20 + 35); // 35° a 55°
      shootingStars.push({
        x: Math.random() * (width * 1.3) - width * 0.15,
        y: Math.random() * (height * 0.4) - 40,
        length: Math.random() * 120 + 110, // 110px a 230px de estela
        speed: Math.random() * 6 + 9,
        opacity: 1,
        active: true,
        angle,
        color: meteorColors[Math.floor(Math.random() * meteorColors.length)],
        lineWidth: Math.random() * 1 + 2.2,
      });
    };

    let lastSpawn = Date.now();
    let tick = 0;

    const render = () => {
      tick++;
      // Interpolar mouse suavemente para efecto de profundidad 3D
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;
      const offsetX = (mouseX - width / 2) * 0.015;
      const offsetY = (mouseY - height / 2) * 0.015;

      ctx.clearRect(0, 0, width, height);

      // 1. Fondo vacío ultra profundo del espacio
      ctx.fillStyle = '#010206';
      ctx.fillRect(0, 0, width, height);

      // 2. Dibujar Nebulosas orgánicas que respiran y flotan
      nebulae.forEach((nebula) => {
        const pulse = Math.sin(tick * nebula.pulseSpeed + nebula.phase);
        const currentRadius = nebula.radius * (1 + 0.15 * pulse);
        const nebX = width * nebula.xPercent + offsetX * 0.5 + Math.cos(tick * 0.0004 + nebula.phase) * 30;
        const nebY = height * nebula.yPercent + offsetY * 0.5 + Math.sin(tick * 0.0004 + nebula.phase) * 30;

        const grad = ctx.createRadialGradient(nebX, nebY, 20, nebX, nebY, currentRadius);
        grad.addColorStop(0, nebula.color);
        grad.addColorStop(0.5, nebula.secondaryColor);
        grad.addColorStop(1, 'rgba(1, 2, 6, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nebX, nebY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Dibujar Estrellas titilantes con parallax sutil
      stars.forEach((star) => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.25) star.speed = -star.speed;

        const starParallax = (star.radius / 2) * 1.5;
        const currentX = (star.x + offsetX * starParallax + width) % width;
        const currentY = (star.y + offsetY * starParallax + height) % height;

        ctx.beginPath();
        ctx.arc(currentX, currentY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.15, Math.min(1, star.alpha));
        ctx.shadowBlur = star.radius > 1.2 ? 6 : 0;
        ctx.shadowColor = star.color;
        ctx.fill();

        // Destello de 4 puntas en estrellas grandes
        if (star.hasSpikes && star.alpha > 0.6) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${(star.alpha - 0.4) * 0.7})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(currentX - 5, currentY);
          ctx.lineTo(currentX + 5, currentY);
          ctx.moveTo(currentX, currentY - 5);
          ctx.lineTo(currentX, currentY + 5);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // 4. Generación frecuente de estrellas fugaces (cada 1.0 - 1.6s con probabilidad de ráfaga)
      if (Date.now() - lastSpawn > 1200 && Math.random() > 0.3) {
        spawnShootingStar();
        // 25% probabilidad de lluvia simultánea de 2 meteoros
        if (Math.random() > 0.75) {
          setTimeout(spawnShootingStar, 180);
        }
        lastSpawn = Date.now();
      }

      // 5. Animación de meteoros con estela larga y cabeza incandescente
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        // Estela con gradiente luminoso de alto impacto
        const starGrad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        starGrad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        starGrad.addColorStop(0.2, `rgba(0, 229, 255, ${s.opacity * 0.9})`);
        starGrad.addColorStop(0.55, `rgba(84, 198, 170, ${s.opacity * 0.5})`);
        starGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

        ctx.strokeStyle = starGrad;
        ctx.lineWidth = s.lineWidth;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Cabeza incandescente brillante
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#FFFFFF';
        ctx.fill();
        ctx.shadowBlur = 0;

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.010; // Desvanecimiento suave

        if (s.opacity <= 0 || s.x > width + 200 || s.y > height + 200) {
          s.active = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100vw', height: '100vh', background: '#010206' }}
    />
  );
};
