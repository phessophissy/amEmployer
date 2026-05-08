'use client';
import { useEffect, useState } from 'react';
interface TypewriterTextProps { texts: string[]; speed?: number; pause?: number; className?: string; cursor?: boolean; }
export function TypewriterText({ texts, speed = 60, pause = 1800, className = '', cursor = true }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = texts[textIdx];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), speed);
      return () => clearTimeout(t);
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setTextIdx(i => (i + 1) % texts.length);
    }
  }, [charIdx, deleting, textIdx, texts, speed, pause]);
  useEffect(() => { setDisplayed(texts[textIdx].slice(0, charIdx)); }, [charIdx, textIdx, texts]);
  return <span className={className}>{displayed}{cursor && <span className="animate-pulse">|</span>}</span>;
}
