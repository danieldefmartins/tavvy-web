/**
 * EditorField — reusable labeled input/textarea for the card editor.
 */

import React from 'react';

interface EditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  isDark?: boolean;
  maxLength?: number;
}

export default function EditorField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 3,
  required = false,
  isDark = false,
  maxLength,
}: EditorFieldProps) {
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';
  const labelColor = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: inputBg,
    color: inputColor,
    outline: 'none',
    transition: 'border-color 0.2s',
    resize: multiline ? 'vertical' : 'none',
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 500,
        color: labelColor,
        marginBottom: 6,
      }}>
        {label}{required && ' *'}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          style={inputStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={inputStyle}
        />
      )}
    </div>
  );
}
