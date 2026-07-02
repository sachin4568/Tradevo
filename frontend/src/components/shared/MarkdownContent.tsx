interface MarkdownContentProps {
  content: string
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = content.split('\n\n').filter((b) => b.trim())

  return (
    <div className="space-y-4 text-[13.5px] leading-relaxed text-tx-secondary">
      {blocks.map((block, i) => {
        const lines = block.split('\n')

        // Heading
        if (lines[0].startsWith('## ')) {
          return (
            <h3
              key={i}
              className="mt-5 text-[15px] font-semibold text-tx-primary"
            >
              {renderInline(lines[0].slice(3))}
            </h3>
          )
        }

        if (lines[0].startsWith('# ')) {
          return (
            <h2
              key={i}
              className="mt-2 text-[16px] font-semibold text-tx-primary"
            >
              {renderInline(lines[0].slice(2))}
            </h2>
          )
        }

        // List
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2))}</li>
              ))}
            </ul>
          )
        }

        // Paragraph with inline formatting
        return (
          <p key={i}>{lines.map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {renderInline(line)}
            </span>
          ))}</p>
        )
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-tx-primary">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}