import React from 'react';

import { WebrcadeRetroApp } from '@webrcade/app-common';

import { Emulator } from './emulator';
import { EmulatorPauseScreen } from './pause';

import './App.scss';

class App extends WebrcadeRetroApp {
  createEmulator(app, isDebug) {
    return new Emulator(app, isDebug);
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
}

export default App;
