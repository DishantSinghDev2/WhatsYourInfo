'use client';

import { useState, useEffect } from 'react';

export function GradientEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [angle, setAngle] = useState(135);
  const [color1, setColor1] = useState('#a3e635');
  const [color2, setColor2] = useState('#22c55e');

  // Parse value into angle + colors if it's a linear-gradient
  useEffect(() => {
    const match = value.match(/linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]{3,6}),\s*(#[a-fA-F0-9]{3,6})\)/);
    if (match) {
      setAngle(parseInt(match[1]));
      setColor1(match[2]);
      setColor2(match[3]);
    }
  }, [value]);

  const updateGradient = (a = angle, c1 = color1, c2 = color2) => {
    const grad = `linear-gradient(${a}deg, ${c1}, ${c2})`;
    onChange(grad);
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-white shadow-sm">
      <div
        className="h-10 w-full rounded-md border"
        style={{ background: `linear-gradient(${angle}deg, ${color1}, ${color2})` }}
      />
      <div className="flex gap-2 items-center text-xs">
        <input
          type="color"
          value={color1}
          onChange={(e) => {
            setColor1(e.target.value);
            updateGradient(angle, e.target.value, color2);
          }}
        />
        <input
          type="color"
          value={color2}
          onChange={(e) => {
            setColor2(e.target.value);
            updateGradient(angle, color1, e.target.value);
          }}
        />
        <input
          type="number"
          min={0}
          max={360}
          value={angle}
          onChange={(e) => {
            const a = parseInt(e.target.value);
            setAngle(a);
            updateGradient(a, color1, color2);
          }}
          className="w-16 px-2 border rounded"
        />
        <span>deg</span>
      </div>
    </div>
  );
}
