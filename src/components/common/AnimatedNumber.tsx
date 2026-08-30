import React, { useEffect, useRef, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 900, delay = 0, decimals = 0, suffix = '', className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    const from = previousValue.current;
    const difference = value - from;
    const startedAt = performance.now();
    let frame = 0;

    const animate = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + difference * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else previousValue.current = value;
    };

    const timeout = window.setTimeout(() => { frame = requestAnimationFrame(animate); }, delay);
    return () => { window.clearTimeout(timeout); cancelAnimationFrame(frame); };
  }, [delay, duration, value]);

  return <span className={className}>{displayValue.toFixed(decimals)}{suffix}</span>;
};
