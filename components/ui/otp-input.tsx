'use client'

import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  className?: string
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  function focusIndex(index: number) {
    inputRefs.current[index]?.focus()
  }

  function handleChange(index: number, char: string) {
    if (!/^\d?$/.test(char)) return
    const newDigits = [...digits]
    newDigits[index] = char
    onChange(newDigits.join(''))
    if (char && index < length - 1) focusIndex(index + 1)
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        handleChange(index, '')
      } else if (index > 0) {
        focusIndex(index - 1)
        handleChange(index - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusIndex(index + 1)
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted.padEnd(length, '').slice(0, length))
    focusIndex(Math.min(pasted.length, length - 1))
  }

  return (
    <div className={cn('flex items-center gap-3 justify-center', className)}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          className="otp-input"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  )
}
