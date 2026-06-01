import React from 'react';

import { Select } from '@webrcade/app-common';

export const CPU_SPEED_PRESETS = [
  { value:  0, cycles: "auto",    label: "(default)" },
  { value:  1, cycles: "315",     label: "8086/8088, 4.77 MHz (1980)" },
  { value:  2, cycles: "1320",    label: "286, 6 MHz (1982)" },
  { value:  3, cycles: "2750",    label: "286, 12.5 MHz (1985)" },
  { value:  4, cycles: "4720",    label: "386, 20 MHz (1987)" },
  { value:  5, cycles: "7800",    label: "386DX, 33 MHz (1989)" },
  { value:  6, cycles: "13400",   label: "486DX, 33 MHz (1990)" },
  { value:  7, cycles: "26800",   label: "486DX2, 66 MHz (1992)" },
  { value:  8, cycles: "77000",   label: "Pentium, 100 MHz (1995)" },
  { value:  9, cycles: "200000",  label: "Pentium II, 300 MHz (1997)" },
  { value: 10, cycles: "500000",  label: "Pentium III, 600 MHz (1999)" },
  { value: 11, cycles: "1000000", label: "AMD Athlon, 1.2 GHz (2000)" },
  { value: 12, cycles: "max",     label: "Maximum Performance" },
];

export function CpuSpeedSelect(props) {
  const { onPad, value, onChange, selectRef } = props;

  const opts = CPU_SPEED_PRESETS.map(p => ({ value: p.value, label: p.label }));

  return (
    <Select
      width="16rem"
      ref={selectRef}
      options={opts}
      onChange={value => onChange(value)}
      value={value}
      onPad={e => onPad(e)}
    />
  );
}
