import React from 'react';

import { ControlsTab, FieldRow, FieldSpan } from '@webrcade/app-common';

export class GamepadControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {this.renderControl('start', 'Quake Menu')}
        {this.renderControl('select', 'Show Scores')}
        {this.renderControl('dpad', 'Move')}
        {this.renderControl('lanalog', 'Move (Analog)')}
        {this.renderControl('ranalog', 'Aim')}
        {this.renderControl('x', 'Strafe Left')}
        {this.renderControl('b', 'Strafe Right')}
        {this.renderControl('y', 'Swim Up')}
        {this.renderControl('a', 'Swim Down')}
        {this.renderControl('lbump', 'Previous Weapon')}
        {this.renderControl('rbump', 'Next Weapon')}
        {this.renderControl('ltrig', 'Jump')}
        {this.renderControl('rtrig', 'Shoot')}
      </>
    );
  }
}

export class KeyboardControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {this.renderKey('Escape', 'Quake Menu')}
        {/* {this.renderKey('Escape', '(Long Hold) webЯcade Pause Menu')} */}
        <FieldRow>
          <FieldSpan>
            Refer to Quake Menu for Keyboard and Mouse mappings.
          </FieldSpan>
        </FieldRow>
      </>
    );
  }
}
