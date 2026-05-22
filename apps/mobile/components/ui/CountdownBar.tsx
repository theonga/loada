import React, { useEffect, useState } from 'react';
import { useColors } from '@constants/theme';
import { ProgressBar } from './ProgressBar';
import { BID_TTL_SECONDS } from '@constants/index';

interface CountdownBarProps {
  expiresAt: Date;
}

export function CountdownBar({ expiresAt }: CountdownBarProps) {
  const C = useColors();
  const [pct, setPct] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const end = expiresAt.getTime();
      const remaining = Math.max(0, end - now) / 1000;
      const total = BID_TTL_SECONDS;
      const p = (remaining / total) * 100;
      setPct(p);
      setIsUrgent(remaining < 60);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <ProgressBar
      pct={pct}
      color={isUrgent ? C.status.red : C.accent}
    />
  );
}
