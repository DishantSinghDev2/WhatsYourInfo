'use client'

import { useState } from 'react'

export function GradientEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [angle, setAngle] = useState(135)
  const [color1, setColor1] = useState('#a3e635')
  const [color2, setColor2] = useState('#22c55e')

  const updateGradient = (a = angle, c1 = color1, c2 = color2) => {
    const grad = `linear-gradient(${a}deg, ${c1}, ${c2})`
    onChange(grad)
  }

  return (
    <div className="space-y-2 p-2 border rounded-md bg-white shadow-sm">
      <div
        className="h-8 w-full rounded-md border"
        style={{ background: value }}
      />
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={color1}
          onChange={(e) => {
            setColor1(e.target.value)
            updateGradient(angle, e.target.value, color2)
          }}
        />
        <input
          type="color"
          value={color2}
          onChange={(e) => {
            setColor2(e.target.value)
            updateGradient(angle, color1, e.target.value)
          }}
        />
        <input
          type="number"
          min={0}
          max={360}
          className="w-20 px-1 border rounded text-xs"
          value={angle}
          onChange={(e) => {
            const a = parseInt(e.target.value)
            setAngle(a)
            updateGradient(a, color1, color2)
          }}
        />
        <span className="text-xs">deg</span>
      </div>
    </div>
  )
}
