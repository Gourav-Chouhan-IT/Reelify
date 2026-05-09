import { useState } from 'react';
import './ReelInput.css';

export default function ReelInput({ index, reel, type, onUrlChange, onFileChange }) {
  const [dragging, setDragging] = useState(false);
  const accent = type === 'best' ? '#86BC8F' : '#C4614A';

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) onFileChange(f);
  };

  return (
    <div className="r-reel-card">
      <div className="r-reel-num" style={{ color: accent, borderColor: `${accent}30` }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div style={{ flex: 1 }}>
        <input
          className="r-input"
          placeholder="https://www.instagram.com/reel/..."
          value={reel.url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
        <label
          className={`r-file-zone${dragging ? ' r-file-zone-drag' : ''}${reel.file ? ' r-file-zone-done' : ''}`}
          style={reel.file ? { borderColor: `${accent}50` } : {}}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {reel.file
            ? <><span style={{ color: accent }}>✓</span> {reel.file.name}</>
            : <><span style={{ opacity: 0.4 }}>↑</span> Drop insights screenshot or click to upload</>
          }
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => onFileChange(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}
