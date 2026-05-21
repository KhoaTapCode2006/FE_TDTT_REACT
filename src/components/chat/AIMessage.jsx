import { useTypewriter } from '../../hooks/useTypewriter'

/**
 * Con trỏ nhấp nháy hiển thị khi đang gõ
 */
function Cursor() {
  return (
    <span
      className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-pulse"
      aria-hidden="true"
    />
  )
}

/**
 * Hiển thị tin nhắn AI với hiệu ứng typewriter.
 *
 * Props:
 *  - text  {string}                    - Nội dung tin nhắn
 *  - speed {number}                    - Tốc độ gõ (ms/token), mặc định 25
 *  - mode  {'char'|'word'|'chunk'}     - Chế độ tokenize, mặc định 'char'
 *
 * Ví dụ dùng:
 *   <AIMessage text="Xin chào! Tôi có thể giúp gì cho bạn?" />
 *   <AIMessage text={response} speed={30} mode="word" />
 */
export function AIMessage({ text, speed = 25, mode = 'char' }) {
  const displayed = useTypewriter(text, speed, mode)
  const done = displayed.length === text.length

  return (
    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
      {displayed}
      {!done && <Cursor />}
    </p>
  )
}
