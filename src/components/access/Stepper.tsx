"use client";

import { useEffect, useState } from "react";

// Three-part progress bar. Parts fill one frame after mount, so the fill animates in
// (transform only; reduced motion is handled globally in app.css).
export function Stepper({ step }: { step: 0 | 1 | 2 | 3 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(step));
    return () => cancelAnimationFrame(id);
  }, [step]);
  return (
    <div className="stepper" role="progressbar" aria-label={`Stap ${Math.max(step, 1)} van 3`} aria-valuemin={0} aria-valuemax={3} aria-valuenow={step}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= shown ? "done" : undefined}>
          <b />
        </i>
      ))}
    </div>
  );
}
