import { useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  Type, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import './RichTextEditor.css';

const FONTS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Google Sans', value: '"Google Sans", sans-serif' },
  { label: 'Courier', value: '"Courier Prime", Courier, monospace' },
  { label: 'Bookman', value: '"Bookman Old Style", Georgia, serif' },
];

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36'];

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleChange();
  };

  const handleChange = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="rte-wrapper">
      {/* Toolbar */}
      <div className="rte-toolbar">
        {/* Font family */}
        <select
          className="rte-select"
          onChange={(e) => exec('fontName', e.target.value)}
          defaultValue=""
          title="Font Family"
        >
          <option value="" disabled>Font</option>
          {FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font size */}
        <select
          className="rte-select rte-select-sm"
          onChange={(e) => exec('fontSize', e.target.value)}
          defaultValue=""
          title="Font Size"
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>

        <div className="rte-divider" />

        <button type="button" className="rte-btn" onClick={() => exec('bold')} title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('italic')} title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('underline')} title="Underline">
          <Underline size={16} />
        </button>

        <div className="rte-divider" />

        <button type="button" className="rte-btn" onClick={() => exec('insertUnorderedList')} title="Bullet List">
          <List size={16} />
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('insertOrderedList')} title="Numbered List">
          <ListOrdered size={16} />
        </button>

        <div className="rte-divider" />

        <button type="button" className="rte-btn" onClick={() => exec('justifyLeft')} title="Align Left">
          <AlignLeft size={16} />
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('justifyCenter')} title="Align Center">
          <AlignCenter size={16} />
        </button>
        <button type="button" className="rte-btn" onClick={() => exec('justifyRight')} title="Align Right">
          <AlignRight size={16} />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onPaste={handlePaste}
        onBlur={handleChange}
        data-placeholder={placeholder || 'Start writing your exam content here…'}
      />
    </div>
  );
}
