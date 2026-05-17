import { useEffect, useRef, useState } from 'react';

export default function StatsCard({ value, label, delay = 0, accent = 'red' }) {
  const [visible, setVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    const numericStr = String(value).replace(/[^0-9.]/g, '');
    const target = parseFloat(numericStr);
    if (isNaN(target)) { setDisplayValue(value); return; }

    const duration = 1200;
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += target / steps;
      if (current >= target) {
        clearInterval(timer);
        setDisplayValue(value);
      } else {
        const suffix = String(value).replace(/[0-9.,]/g, '');
        setDisplayValue(Math.floor(current).toLocaleString() + suffix);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [visible, value]);

  const accentColors = {
    red: 'text-red',
    green: 'text-green',
    blue: 'text-blue',
    yellow: 'text-yellow',
    ink: 'text-ink',
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-bold italic ${accentColors[accent] || accentColors.red} mb-1 leading-none tracking-tight`}>
        {visible ? displayValue : '0'}
      </div>
      <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-gray font-medium">
        {label}
      </div>
    </div>
  );
}
