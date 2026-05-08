import { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  id?: string; // Optional ID to track animation state per session
}

export default function CountUp({ end, duration = 1200, prefix = '', suffix = '', decimals = 0, id }: CountUpProps) {
  const sessionKey = id ? `countup_done_${id}` : 'countup_global_done';
  const hasAnimatedThisSession = typeof window !== 'undefined' && sessionStorage.getItem(sessionKey);

  const [count, setCount] = useState(() => hasAnimatedThisSession ? end : 0);
  const animationDoneRef = useRef(!!hasAnimatedThisSession);

  useEffect(() => {
    if (animationDoneRef.current) {
      setCount(end);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      if (progress < duration) {
        const easeOut = 1 - Math.pow(1 - progress / duration, 4);
        setCount(end * easeOut);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
        sessionStorage.setItem(sessionKey, 'true');
        animationDoneRef.current = true;
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, id]);

  const formatted = count.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <>{prefix}{formatted}{suffix}</>
  );
}
