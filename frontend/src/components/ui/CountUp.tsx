import { useState, useEffect } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function CountUp({ end, duration = 1200, prefix = '', suffix = '', decimals = 0 }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      if (progress < duration) {
        // Easing function (easeOutExpo)
        const easeOut = 1 - Math.pow(1 - progress / duration, 4);
        setCount(end * easeOut);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  // Use toLocaleString to safely handle decimal places and commas automatically
  const formatted = count.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <>{prefix}{formatted}{suffix}</>
  );
}
