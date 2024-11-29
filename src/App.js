import React, { Fragment } from "react";

import { WebrcadeRetroApp } from '@webrcade/app-common';

import { Emulator } from './emulator';
import { EmulatorPauseScreen } from './pause';
import { VK_TRANSPARENCY } from "./emulator/prefs";
import { TouchOverlay } from "./touchoverlay";
import { Keyboard } from "./keyboard";


import './App.scss';

class App extends WebrcadeRetroApp {

  constructor() {
    super();

    this.state = {
      ...this.state,
      showKeyboard: false,
      kbTransparency: VK_TRANSPARENCY.HIGH,
      kbCloseOnEnter: true
    };
  }

  createEmulator(app, isDebug) {
    return new Emulator(app, isDebug);
  }

  isKeyboardShown() {
    return this.state.showKeyboard;
  }

  setKeyboardShown(value) {
    try {
      // window.Module._emDisableGamepad(value);
    } catch (e) {}
    this.setState({showKeyboard: value})
  }

  setKeyboardTransparency(value) {
    this.setState({kbTransparency: value});
  }

  setKeyboardCloseOnEnter(value) {
    this.setState({kbCloseOnEnter: value});
  }

  isArchiveBased() {
    return true;
  }

  isDiscBased() {
    return false;
  }

  isBiosRequired() {
    return false;
  }

  showCanvas() {
    this.setState({showCanvas: true});
  }

  renderCanvas() {
    return (
      <canvas
        style={this.getCanvasStyles()}
        ref={(canvas) => {
          this.canvas = canvas;
        }}
        id="canvas"
      ></canvas>
    );
  }

  renderPauseScreen() {
    const { appProps, emulator } = this;

    return (
      <EmulatorPauseScreen
        emulator={emulator}
        appProps={appProps}
        closeCallback={() => this.resume()}
        exitCallback={() => {
          this.exitFromPause();
        }}
        isEditor={this.isEditor}
        isStandalone={this.isStandalone}
      />
    );
  }

  render() {
    const { showCanvas, showKeyboard, kbTransparency, kbCloseOnEnter} = this.state;

    return (
      <Fragment>
        {super.render()}
        <TouchOverlay show={showCanvas} />
        <div id="background"/>
        <Keyboard
          show={showKeyboard}
          transparency={kbTransparency}
          closeOnEnter={kbCloseOnEnter}
        />
      </Fragment>
    );
  }
}

export default App;
