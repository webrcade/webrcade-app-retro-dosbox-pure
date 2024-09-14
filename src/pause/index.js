import React from 'react';
import { Component } from 'react';

import { GamepadControlsTab, KeyboardControlsTab } from './controls';

import {
  AppSettingsEditor,
  CustomPauseScreen,
  EditorScreen,
  GamepadWhiteImage,
  KeyboardWhiteImage,
  PauseScreenButton,
  Resources,
  SettingsAppWhiteImage,
  TEXT_IDS,
} from '@webrcade/app-common';

export class EmulatorPauseScreen extends Component {
  constructor() {
    super();
    this.state = {
      mode: this.ModeEnum.PAUSE,
    };
  }

  ModeEnum = {
    PAUSE: 'pause',
    CONTROLS: 'controls',
    QUAKE_SETTINGS: 'quake-settings',
  };

  ADDITIONAL_BUTTON_REFS = [
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ];

  componentDidMount() {}

  render() {
    const { ADDITIONAL_BUTTON_REFS, ModeEnum } = this;
    const {
      appProps,
      closeCallback,
      emulator,
      exitCallback,
      isEditor,
      isStandalone,
    } = this.props;
    const { mode } = this.state;

    const additionalButtons = [
      <PauseScreenButton
        imgSrc={GamepadWhiteImage}
        buttonRef={ADDITIONAL_BUTTON_REFS[0]}
        label={Resources.getText(TEXT_IDS.VIEW_CONTROLS)}
        onHandlePad={(focusGrid, e) =>
          focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[0])
        }
        onClick={() => {
          this.setState({ mode: ModeEnum.CONTROLS });
        }}
      />,
    ];

    additionalButtons.push(
      <PauseScreenButton
        imgSrc={SettingsAppWhiteImage}
        buttonRef={ADDITIONAL_BUTTON_REFS[1]}
        label="Quake Settings"
        onHandlePad={(focusGrid, e) =>
          focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[1])
        }
        onClick={() => {
          this.setState({ mode: ModeEnum.QUAKE_SETTINGS });
        }}
      />,
    );

    const gamepad = <GamepadControlsTab />;
    const keyboard = <KeyboardControlsTab />;
    const gamepadLabel = Resources.getText(TEXT_IDS.GAMEPAD_CONTROLS);
    const keyboardLabel = Resources.getText(TEXT_IDS.KEYBOARD_CONTROLS);

    return (
      <>
        {mode === ModeEnum.PAUSE ? (
          <CustomPauseScreen
            appProps={appProps}
            closeCallback={closeCallback}
            exitCallback={exitCallback}
            isEditor={isEditor}
            isStandalone={isStandalone}
            additionalButtonRefs={ADDITIONAL_BUTTON_REFS}
            additionalButtons={additionalButtons}
          />
        ) : null}
        {mode === ModeEnum.CONTROLS ? (
          <EditorScreen
            onClose={closeCallback}
            tabs={[
              {
                image: GamepadWhiteImage,
                label: gamepadLabel,
                content: gamepad,
              },
              {
                image: KeyboardWhiteImage,
                label: keyboardLabel,
                content: keyboard,
              },
            ]}
          />
        ) : null}

        {mode === ModeEnum.QUAKE_SETTINGS ? (
          <AppSettingsEditor emulator={emulator} onClose={closeCallback} />
        ) : null}
      </>
    );
  }
}
