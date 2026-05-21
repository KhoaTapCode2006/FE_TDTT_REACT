import { useState, useEffect, useRef } from 'react'

/**
 * Tokenize text theo 3 chế độ:
 *  - 'char'  : từng ký tự một
 *  - 'word'  : từng từ / khoảng trắng
 *  - 'chunk' : cụm 2–6 ký tự ngẫu nhiên (mô phỏng streaming thực)
 */
function tokenize(text, mode) {
  if (mode === 'char') return [...text]
  if (mode === 'word') return text.match(/\S+|\s/g) ?? []

  // chunk mode
  const chunks = []
  let i = 0
  while (i < text.length) {
    const len = Math.floor(Math.random() * 5) + 2
    chunks.push(text.slice(i, i + len))
    i += len
  }
  return chunks
}

/**
 * Hook tạo hiệu ứng typewriter cho một chuỗi văn bản.
 *
 * @param {string} text   - Văn bản cần hiển thị dần
 * @param {number} speed  - Tốc độ (ms/token), mặc định 25ms
 * @param {'char'|'word'|'chunk'} mode - Chế độ tokenize, mặc định 'char'
 * @returns {string} Phần văn bản đã hiển thị
 */
export function useTypewriter(text, speed = 25, mode = 'char') {
  const [displayed, setDisplayed] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    setDisplayed('')
    const tokens = tokenize(text, mode)
    let idx = 0

    const step = () => {
      if (idx >= tokens.length) return
      const chunk = tokens[idx++]
      setDisplayed(prev => prev + chunk)
      // Khoảng trắng hiển thị nhanh hơn để tự nhiên hơn
      const delay = chunk === ' ' ? speed * 0.5 : speed
      timerRef.current = setTimeout(step, delay)
    }

    step()

    return () => clearTimeout(timerRef.current)
  }, [text, speed, mode])

  return displayed
}
