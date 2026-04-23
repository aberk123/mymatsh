'use client'

interface HelpChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line || ' '}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

export function HelpChatMessage({ role, content }: HelpChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-brand-maroon text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm leading-relaxed">
          <MessageContent content={content} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-brand-maroon flex items-center justify-center text-white text-[11px] font-bold mt-0.5 select-none">
        M
      </div>
      <div className="max-w-[85%] bg-[#F3F3F3] rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm text-[#1A1A1A] leading-relaxed">
        <MessageContent content={content} />
      </div>
    </div>
  )
}
