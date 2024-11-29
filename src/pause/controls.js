import React from 'react';

import { ControlsTab } from '@webrcade/app-common';

export class GamepadControlsTab extends ControlsTab {

  CONTROLS = {
    "a": ["a", false, null],
    "b": ["b", false, null],
    "x": ["x", false, null],
    "y": ["y", false, null],
    "l": ["lbump", false, null],
    "l2": ["ltrig", false, null],
    "r": ["rbump", false, null],
    "r2": ["rtrig", false, null],
    "start": ["start", false, null],
    "select": ["select", false, null],
    "up": ["dpadu", false, null],
    "down": ["dpadd", false, null],
    "left": ["dpadl", false, null],
    "right": ["dpadr", false, null],
    "l3": ["lanalogc", false, "click"],
    "r3": ["ranalogc", false, "click"],
    "left analog up": ["lanalogu", false, "up"],
    "left analog down": ["lanalogd", false, "down"],
    "left analog left": ["lanalogl", false, "left"],
    "left analog right": ["lanalogr", false, "right"],
    "right analog up": ["ranalogu", false, "up"],
    "right analog down": ["ranalogd", false, "down"],
    "right analog left": ["ranalogl", false, "left"],
    "right analog right": ["ranalogr", false, "right"],
  }

  render() {
    const { emulator } = this.props;
    const info = emulator.controlsInfo.getInfo();
    console.log(info);
    const controls = [];
    for (const k of info.keys()) {
      const v = info.get(k);
      if (v.text && v.text.length > 0) {
        const control = this.CONTROLS[k.toLowerCase()];
        let desc = false;
        let name = k;
        let descText = k;
        if (control) {
          name = control[0];
          desc = control[1];
          if (control[2]) {
            descText = control[2];
          }
        }

        let t = v.text.join(" + ");
        t = t.replaceAll("Keyboard ", "");
        if (v.function && v.function.toLowerCase() !== t.toLowerCase()) {
          t = `${v.function}\n(${t})`;
        }

        if (desc) {
          controls.push(this.renderControlWithText(name, `(${descText.toLowerCase()})`, t));
        } else {
          controls.push(this.renderControl(name, t));
        }
      }
    }
    console.log(controls);

    return (
      <>
        {controls}
      </>
    );
  }
}

export class KeyboardControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {this.renderKey('Enter', 'Start')}
        {this.renderKey('ShiftRight', 'Select')}
        {this.renderKey('ArrowUp', 'Up')}
        {this.renderKey('ArrowDown', 'Down')}
        {this.renderKey('ArrowLeft', 'Left')}
        {this.renderKey('ArrowRight', 'Right')}
        {this.renderKey('KeyX', 'A')}
        {this.renderKey('KeyZ', 'B')}
        {this.renderKey('KeyS', 'X')}
        {this.renderKey('KeyA', 'Y')}
        {this.renderKey('KeyQ', 'Left Shoulder')}
        {this.renderKey('KeyW', 'Right Shoulder')}
      </>
    );
  }
}
