import React from 'react';

import { Select } from '@webrcade/app-common';
import { GAMEPAD_MODE } from '../emulator/prefs';

export function GamepadModeSelect(props) {
  const { /*addDefault,*/ onPad, value, onChange, selectRef } = props;

  const opts = [];
  opts.push({ value: GAMEPAD_MODE.GAMEPAD, label: "Gamepad" });
  opts.push({ value: GAMEPAD_MODE.MOUSE, label: "Mouse" });

  return (
    <Select
      ref={selectRef}
      options={opts}
      onChange={value => onChange(value)}
      value={value}
      onPad={e => onPad(e)}
    />
  )
}
