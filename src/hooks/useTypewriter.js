import { useState, useEffect } from 'react'

/**
 * Tokenize text theo 3 chế độ:
 *  - 'char'  : từng ký tự một
 *  - 'word'  : từng từ / khoảng trắng
 *  - 'chunk' : cụm 2–6 ký tự ngẫu nhiên (mô phỏng streaming thực)
 */
function tokenize(text, mode) {
  if (mode === 'char') return [...text]
  if (mode === 'word') return text.match(/\S+|\s/g) ?? []

  const chunks = []
  let i = 0
  while (i < text.length) {
    const len = Math.floor(Math.random() * 5) + 2
    chunks.push(text.slice(i, i + len))
    i += len
  }
  return chunks
}

// ─── Module-level animation engine ───────────────────────────────────────────
// Chạy độc lập, không phụ thuộc vào vòng đời component.

/**
 * @typedef {{ displayed: string, done: boolean, listeners: Set<Function> }} AnimState
 */

/** @type {Map<string, AnimState>} */
const animStore = new Map()

/**
 * Lấy hoặc khởi tạo state cho một text.
 * Nếu text chưa có → bắt đầu animate ngay.
 */
function getOrStart(text, speed, mode) {
  if (animStore.has(text)) return animStore.get(text)

  const state = { displayed: '', done: false, listeners: new Set() }
  animStore.set(text, state)

  const tokens = tokenize(text, mode)
  let idx = 0

  const step = () => {
    if (idx >= tokens.length) {
      state.done = true
      state.displayed = text
      notify(text)
      return
    }
    const chunk = tokens[idx++]
    state.displayed += chunk
    notify(text)
    const delay = chunk === ' ' ? speed * 0.5 : speed
    setTimeout(step, delay)
  }

  step()
  return state
}

function notify(text) {
  const state = animStore.get(text)
  if (!state) return
  state.listeners.forEach(fn => fn(state.displayed))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook đọc trạng thái animate từ module-level engine.
 * Animation tiếp tục chạy kể cả khi component unmount — khi mount lại
 * sẽ hiển thị đúng tiến độ hiện tại.
 *
 * @param {string} text   - Văn bản cần hiển thị dần
 * @param {number} speed  - Tốc độ (ms/token), mặc định 10ms
 * @param {'char'|'word'|'chunk'} mode - Chế độ tokenize, mặc định 'char'
 * @returns {string} Phần văn bản đã hiển thị
 */
export function useTypewriter(text, speed = 10, mode = 'char') {
  const state = getOrStart(text, speed, mode)
  const [displayed, setDisplayed] = useState(state.displayed)

  useEffect(() => {
    const currentState = animStore.get(text)
    if (!currentState) return

    // Sync ngay với tiến độ hiện tại (có thể đã chạy tiếp khi unmounted)
    setDisplayed(currentState.displayed)

    if (currentState.done) return

    // Đăng ký listener để nhận update
    const listener = (val) => setDisplayed(val)
    currentState.listeners.add(listener)
    return () => currentState.listeners.delete(listener)
  }, [text])

  return displayed
}
