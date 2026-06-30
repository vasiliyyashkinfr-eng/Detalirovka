import { useEffect, useRef, useState } from 'react'

interface NumberFieldProps {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
}

/**
 * Контролируемый числовой инпут, который корректно обрабатывает
 * пустое и промежуточное значение: при очистке поле остаётся пустым
 * (а не превращается в 0 с ведущим нулём). Число прокидывается в onChange
 * только когда строку реально можно распарсить; нормализация — на blur.
 */
export default function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  className,
  placeholder,
  disabled,
  ariaLabel,
}: NumberFieldProps) {
  const [text, setText] = useState<string>(() => String(value))
  const focused = useRef(false)

  // Синхронизация с внешним значением, когда оно меняется не из этого поля
  // (например, деталь подвинули мышью в 3D). Во время ввода не трогаем.
  useEffect(() => {
    if (focused.current) return
    const n = parseFloat(text)
    if (n !== value || Number.isNaN(n)) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const clamp = (n: number) => {
    let r = n
    if (min != null) r = Math.max(min, r)
    if (max != null) r = Math.min(max, r)
    return r
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setText(raw)
    if (raw.trim() === '') return // пусто — ничего не коммитим, ждём ввода/blur
    const n = parseFloat(raw)
    if (!Number.isNaN(n)) onChange(n)
  }

  const handleBlur = () => {
    focused.current = false
    const n = parseFloat(text)
    if (Number.isNaN(n)) {
      setText(String(value)) // откат к последнему валидному
      return
    }
    const c = clamp(n)
    setText(String(c))
    if (c !== value) onChange(c)
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      value={text}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      onFocus={() => (focused.current = true)}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
