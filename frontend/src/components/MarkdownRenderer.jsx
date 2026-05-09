import './MarkdownRenderer.css';

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: '#F5F0E8', fontWeight: '600' }}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function MarkdownRenderer({ text }) {
  return (
    <div className="r-md">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return (
          <div key={i} className="r-md-h2-block">
            <div className="r-md-h2-bar" />
            <h2 className="r-md-h2">{renderInline(line.replace(/^##\s*/, ''))}</h2>
          </div>
        );
        if (line.startsWith('### ')) return (
          <h3 key={i} className="r-md-h3">{renderInline(line.replace(/^###\s*/, ''))}</h3>
        );
        if (line.trim() === '---') return <div key={i} className="r-md-rule" />;
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          const content = line.trim().replace(/^[*-]\s/, '');
          return (
            <div key={i} className="r-md-bullet">
              <span className="r-md-bullet-mark">◆</span>
              <span>{renderInline(content)}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+)\.\s(.*)/);
          return (
            <div key={i} className="r-md-num">
              <span className="r-md-num-mark">{match[1]}</span>
              <span>{renderInline(match[2])}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: '12px' }} />;
        return <p key={i} className="r-md-para">{renderInline(line)}</p>;
      })}
    </div>
  );
}
