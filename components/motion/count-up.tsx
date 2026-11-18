"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

function parse(value: string) {
  const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  return match
    ? { prefix: match[1], target: Number(match[2]), suffix: match[3] }
    : null;
}

export function CountUp({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const parts = parse(value);
  const target = parts?.target ?? 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView || !target) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCurrent(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <span ref={ref} className={className}>
      {parts ? `${parts.prefix}${current}${parts.suffix}` : value}
    </span>
  );
}
