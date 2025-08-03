"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

type SwitchProps = {
  id?: string
  checked?: boolean
  onChange?: (value: boolean) => void
  className?: string
}

export default function Switch({ id, checked = false, onChange, className = "" }: SwitchProps) {
  const [isOn, setIsOn] = useState(checked)

  useEffect(() => {
    setIsOn(checked)
  }, [checked])

  const toggleSwitch = () => {
    const next = !isOn
    setIsOn(next)
    onChange?.(next)
  }

  return (
    <button
      id={id}
      onClick={toggleSwitch}
      role="switch"
      aria-checked={isOn}
      aria-label="Toggle switch"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 
        ${isOn ? "bg-primary/80" : "bg-gray-200"} 
        ${className}`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="h-5 w-5 rounded-full bg-white shadow-md"
        style={{ x: isOn ? 20 : 2 }}
      />
    </button>
  )
}
