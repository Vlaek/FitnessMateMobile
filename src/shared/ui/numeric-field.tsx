import { useEffect, useRef, useState } from 'react';

import { TextField } from './text-field';

type Props = {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  integer?: boolean;
};

export function NumericField({ label, value, onValueChange, integer = false }: Props) {
  const [text, setText] = useState(formatNumber(value));
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) {
      setText(formatNumber(value));
    }
  }, [value]);

  const changeText = (next: string) => {
    setText(next);
    const normalized = next.replace(',', '.');

    if (normalized === '') {
      onValueChange(0);

      return;
    }

    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      onValueChange(Math.max(0, integer ? Math.trunc(parsed) : parsed));
    }
  };

  return (
    <TextField
      label={label}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      value={text}
      onBlur={() => {
        isEditing.current = false;
        setText(formatNumber(value));
      }}
      onChangeText={changeText}
      onFocus={() => {
        isEditing.current = true;
      }}
    />
  );
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? String(Math.max(0, value)) : '0';
}
