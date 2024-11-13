import {
  Controllers,
  Controller,
  KeyCodeToControlMapping,
  RetroAppWrapper,
  ScriptAudioProcessor,
  DisplayLoop,
  CIDS,
  SCREEN_CONTROLS,
  LOG,
} from '@webrcade/app-common';

import { GAMEPAD_MODE, Prefs } from './prefs';
import { FileTracker } from './files';

class QuakeKeyCodeToControlMapping extends KeyCodeToControlMapping {
  constructor() {
    super({
      // [KCODES.ESCAPE]: CIDS.ESCAPE,
    });
  }
}

export class Emulator extends RetroAppWrapper {

  SAVE_NAME = 'file-mods.zip';
  DELETED_PATH = "deleted.json";

  constructor(app, debug = false) {
    super(app, debug);
    this.analogMode = true;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseAbsX = 0;
    this.mouseAbsY = 0;
    this.mouseButtons = 0;
    this.firstFrame = true;
    this.escapeDownTime = -1;
    this.blockKeys = false;
    this.gameRunning = false;
    this.jsAudio = true;
    this.prefs = new Prefs(this);
    this.audioProcessor = this.createAudioProcessor();
    this.fileTracker = new FileTracker(this);
    this.touchStartTime = 0;
    this.vkbPending = false;
    this.vkPendingStart = 0;

    this.setStateFilePath("/home/web_user/retroarch/userdata/states/.state");

    // Force vsync
// this.vsync = true;
    // Force 60 FPS
// this.force60 = true;

    this.vsync = true;
    this.force60 = true;

    // Audio rate
    this.audioRate = 48000;

    this.binaryFileName = null;
    // this.dirName = null;

    this.maxKeys = 100;
    this.keyCount = 0;
    this.keys = [];
    for (let i = 0; i < this.maxKeys; i++) {
      this.keys[i] = [0, 0];
    }

    this.pointerLockHandler = async () => {
      if ((Date.now() - this.touchStartTime) < 500) return;
      if (!document.pointerLockElement && !this.app.isKeyboardShown()) {
        await this.canvas.requestPointerLock();
      }
    }

    document.onmousemove = (e) => {
      this.mouseX += e.movementX;
      this.mouseY += e.movementY;
      if (this.canvas) {
        const rect = this.canvas.getBoundingClientRect();
        let x = e.pageX - rect.left;
        let y = e.pageY - rect.top;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x > rect.width) x = rect.width;
        if (y > rect.height) y = rect.height;

        x = ((x / rect.width) - .5) * 32767 * 2;
        y = ((y / rect.height) - .5) * 32767 * 2;

        this.mouseAbsX = x;
        this.mouseAbsY = y;
      }
    };

    document.onwheel = (e) => {
      if (e.deltaY < 0) this.mouseButtons |= this.MOUSE_WHEEL_UP;
      else if (e.deltaY > 0) this.mouseButtons |= this.MOUSE_WHEEL_DOWN;
      if (e.deltaX < 0) this.mouseButtons |= this.MOUSE_HORIZ_WHEEL_UP;
      else if (e.deltaX > 0) this.mouseButtons |= this.MOUSE_HORIZ_WHEEL_DOWN;
    };

    document.onmousedown = (e) => {
      switch (e.button) {
        case 0:
          this.mouseButtons |= this.MOUSE_LEFT;
          break;
        case 1:
          this.mouseButtons |= this.MOUSE_MIDDLE;
          break;
        case 2:
          this.mouseButtons |= this.MOUSE_RIGHT;
          break;
        default:
      }
    };

    document.onmouseup = (e) => {
      switch (e.button) {
        case 0:
          this.mouseButtons &= ~this.MOUSE_LEFT;
          break;
        case 1:
          this.mouseButtons &= ~this.MOUSE_MIDDLE;
          break;
        case 2:
          this.mouseButtons &= ~this.MOUSE_RIGHT;
          break;
        default:
      }
    };

    document.onkeydown = (e) => {
      if (
        this.paused ||
        this.app.isKeyboardShown() /*||
        (this.isKeyboardJoystickMode() &&
          this.controllers.getController(0).getKeyCodeToControllerMapping().getKeyCodeToControlId()[e.code] !== undefined)*/
      ) {
        return;
      }

      this.onKeyboardEvent(e);

      // Disable when entering menu, etc.
      if (this.blockKeys) {
        e.preventDefault();
      }

      if (e.repeat) {
        // Ignore repeated key events
        return;
      }

      const code = getKeyCode(e.code);
      if (code !== 0 && this.keyCount < this.maxKeys) {
        const key = this.keys[this.keyCount++];
        key[0] = code;
        key[1] = 1;
      }
    };

    document.onkeyup = (e) => {
      if (
        this.paused ||
        this.app.isKeyboardShown() /*||
        (this.isKeyboardJoystickMode() &&
          this.controllers.getController(0).getKeyCodeToControllerMapping().getKeyCodeToControlId()[e.code] !== undefined)*/
      ) {
        return;
      }

      this.onKeyboardEvent(e);
      const code = getKeyCode(e.code);
      if (code !== 0 && this.keyCount < this.maxKeys) {
        let key = this.keys[this.keyCount++];
        key[0] = code;
        key[1] = 0;
      }
    };

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) {
        this.showTouchOverlay(false);
        this.app.forceRefresh();
      } else {
        this.updateOnScreenControls();
      }
    });

    if (this.jsAudio) {
      const START_DELAY = 5;
      let started = 0;
      this.audioCallback = (offset, length) => {
        if (started === START_DELAY) {
          if (!this.audioProcessor) {
            started = 0;
            return;
          } else {
            this.audioProcessor.start();
          }
        } else if (started < START_DELAY) {
          started++;
          return;
        }
        const audioArray = new Int16Array(window.Module.HEAP16.buffer, offset, 8192 * 4);
        this.audioProcessor.storeSoundCombinedInput(
          audioArray, 2, length << 1, 0, ((65535) | 0)
        );
      };
    }
  }

  isGamepadMouse() {
    return this.prefs.getGamepadMode() === GAMEPAD_MODE.MOUSE;
  }

  updateMouseFromGamepad() {
    const { canvas, controllers } = this;

    if (!canvas || !controllers) return 0;

    // Sensitivity factor for analog stick movement
    let sensitivity = .4; // Adjust this value to change sensitivity

    // Dead zone threshold
    let deadZone = 0.15; // This value can be adjusted (0.1 means 10% of the stick's range)

    // Variables for absolute position (starting at the center of the canvas)
    const rect = canvas.getBoundingClientRect();

    let absoluteX = this.absoluteX !== undefined ? this.absoluteX : rect.width / 2;
    let absoluteY = this.absoluteY !== undefined ? this.absoluteY : rect.height / 2;
    // let relativeX = this.relativeX !== undefined ? this.relativeX : 0; // Relative X movement
    // let relativeY = this.relativeY !== undefined ? this.relativeY : 0; // Relative Y movement
    let relativeX = 0;
    let relativeY = 0;

    const gamepads = navigator.getGamepads();
    if (gamepads.length <= 0) return 0;

    const gamepad = gamepads[0];
    if (!gamepad || gamepad.axes.length < 2) return 0;

    // Get the analog stick values (ranging from -1 to 1)
    let stickX = gamepad.axes[0]; // X-axis (left-right)
    let stickY = gamepad.axes[1]; // Y-axis (up-down)

    // Check if the movement is within the dead zone
    if (Math.abs(stickX) < deadZone) stickX = 0;
    if (Math.abs(stickY) < deadZone) stickY = 0;

    if (stickX !== 0 || stickY !== 0) {
      if (stickX !== 0) {
        stickX = stickX > 0 ? stickX - deadZone : stickX + deadZone;
      }
      if (stickY !== 0) {
        stickY = stickY > 0 ? stickY - deadZone : stickY + deadZone;
      }

      // Apply sensitivity by multiplying the stick values
      stickX *= sensitivity;
      stickY *= sensitivity;

      // Calculate relative movement (difference from the previous position)
      relativeX = stickX;
      relativeY = stickY;

      // Update the absolute position by incrementing it with relative movement
      absoluteX += relativeX * rect.width / 20; // Scale the relative movement
      absoluteY += relativeY * rect.height / 20; // Scale the relative movement

      // Clamp the absolute position to stay within the canvas bounds
      absoluteX = Math.max(0, Math.min(absoluteX, rect.width));
      absoluteY = Math.max(0, Math.min(absoluteY, rect.height));

      let x = ((absoluteX / rect.width) - .5) * 32767 * 2;
      let y = ((absoluteY / rect.height) - .5) * 32767 * 2;

      this.absoluteX = absoluteX;
      this.absoluteY = absoluteY;
      // this.relativeX = relativeX;
      // this.relativeY = relativeY;

      this.mouseX += relativeX * 25 | 0;
      this.mouseY += relativeY * 25 | 0;
      this.mouseAbsX = x;
      this.mouseAbsY = y;
    }

    return (
      (controllers.isControlDown(0, CIDS.A) || controllers.isControlDown(0, CIDS.LBUMP) ? this.MOUSE_LEFT : 0) |
      (controllers.isControlDown(0, CIDS.B) || controllers.isControlDown(0, CIDS.RBUMP) ? this.MOUSE_RIGHT : 0) |
      (controllers.isControlDown(0, CIDS.X) ? this.MOUSE_MIDDLE : 0))
  }

  handleEscape(controllers) {
    if (controllers.isControlDown(0, CIDS.LTRIG) && controllers.isControlDown(0, CIDS.RANALOG)) {
      if (!this.vkbPending) {
        this.vkbPending = true;
        this.vkPendingStart = Date.now();
        controllers
        .waitUntilControlReleased(0 /*i*/, CIDS.ESCAPE)
          .then(() => {
            this.vkbPending = false;
            // Long hold allows for switching gamepad modes
            if ((Date.now() - this.vkPendingStart) > 1000) {
              this.prefs.setGamepadMode(
                this.prefs.getGamepadMode() === GAMEPAD_MODE.GAMEPAD ?
                  GAMEPAD_MODE.MOUSE : GAMEPAD_MODE.GAMEPAD);
              this.showMessage(this.prefs.getGamepadMode() === GAMEPAD_MODE.GAMEPAD ?
                "Switched to Gamepad Mode" : "Switched to Mouse Mode"
              )
            } else {
              this.toggleKeyboard();
            }
          });
      }
      return true;
    }
    return false;
  }

  isDirectFileSupportedForArchives() {
    return true;
  }

  // Allows extract path to be modified
  getExtractPath(path) {
    return path.toUpperCase();
  }

  getDisableInput() {
    return super.getDisableInput() || this.isGamepadMouse();
  }

  sendKeyDown(c) {
    const code = getKeyCode(c);
    if (code !== 0) {
      console.log('key down: ' + code)
      window.Module._wrc_on_key(code, 1);
    }
  }

  sendKeyUp(c) {
    const code = getKeyCode(c);
    if (code !== 0) {
      console.log('key up: ' + code)
      window.Module._wrc_on_key(code, 0);
    }
  }

  createAudioProcessor() {
    if (this.jsAudio) {
      return new ScriptAudioProcessor(2, this.audioRate).setDebug(this.debug);
    } else {
      return super.createAudioProcessor();
    }
  }

  isJsAudio() {
    console.log("## JS AUDIO: " + this.jsAudio);
    return this.jsAudio ? 1 : 0;
  }

  getMouseAbsX() {
    if (this.disableInput) return 0;
    return this.mouseAbsX >> 0;
  }

  getMouseAbsY() {
    if (this.disableInput) return 0;
    return this.mouseAbsY >> 0;
  }

  getExitOnLoopError() {
    return true;
  }

  getRaConfigContents() {
    return (
      "video_threaded = \"true\"\n" +
      "video_vsync = \"false\"\n" +
      "video_driver = \"256\"\n" +
      "audio_latency = \"256\"\n" +
      "audio_buffer_size = \"8192\"\n" +
      "audio_sync = \"false\"\n" +
      "audio_driver = \"sdl2\"\n"
    )
  }

  setPointerLock(lock) {
    if (lock) {
      this.canvas.addEventListener('click', this.pointerLockHandler);
    } else {
      this.canvas.removeEventListener('click', this.pointerLockHandler);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }

  onPause(p) {
    const { app } = this;
    if (p) {
      try {
        this.setDisableInput(false);
        app.setKeyboardShown(false);
      } catch (e) {}
    }

    if (p) {
      this.blockKeys = false;
    } else {
      this.blockKeys = true;
    }
    this.setPointerLock(!p && this.gameRunning);

    super.onPause(p);
  }

  setGameRunning(running) {
    console.log("isGameRunning: " + running);
    this.gameRunning = running;
    this.setPointerLock(running);
  }

  createDisplayLoop(debug) {
    // if (!this.vsync) {
    //   // not vsync'd
    //   return new DisplayLoop(100, false, debug, false, true);
    // } else {
    //   // vscync'd
    //   // return super.createDisplayLoop(debug);
      return new DisplayLoop(
        60,    // frame rate (ignored due to no wait)
        false,  // vsync
        debug, // debug
        false, // force native
        false, // no wait
      );
    // }
  }

  onFrame() {
    if (this.firstFrame) {
      this.blockKeys = true;
      this.firstFrame = false;

      // TODO: KEYBOARD!

      window.addEventListener("contextmenu", e => e.preventDefault());
      setTimeout(() => {
        const onTouch = () => { this.onTouchEvent() };
        window.addEventListener("touchstart", () => {
          this.touchStartTime = Date.now();
          onTouch();
        });
        window.addEventListener("touchend", () => {
          this.touchStartTime = Date.now();
          onTouch();
        });
        window.addEventListener("touchcancel", onTouch);
        window.addEventListener("touchmove", onTouch);

        const onMouse = () => { this.onMouseEvent() };
        window.addEventListener("mousedown", onMouse);
        window.addEventListener("mouseup", onMouse);
        window.addEventListener("mousemove", onMouse);

        this.app.showCanvas();
      }, 10);
    }

    if (!this.disableInput && window.Module && window.Module._wrc_update_mouse) {
      let gamepadMouseButtons = 0;
      if (this.isGamepadMouse()) {
        gamepadMouseButtons = this.updateMouseFromGamepad();
      }

      window.Module._wrc_update_mouse(
        this.mouseX,
        this.mouseY,
        //document.pointerLockElement ? this.mouseButtons : 0,
        this.mouseButtons | gamepadMouseButtons
      );
    }

    for (let i = 0; i < this.keyCount; i++) {
      const k = this.keys[i];
      window.Module._wrc_on_key(k[0], k[1]);
    }

    //this.mouseButtons = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.keyCount = 0;
  }

  createControllers() {
    return new Controllers([
      new Controller(new QuakeKeyCodeToControlMapping()),
      new Controller(),
      new Controller(),
      new Controller(),
    ]);
  }

  createTouchListener() {}

  getScriptUrl() {
    return 'js/dosbox_pure_libretro.js';
  }

  getPrefs() {
    return this.prefs;
  }

  onSave() {
    // Called from Emscripten to initiate save
    this.saveState();
  }

  async saveState() {
    const { FS } = window;
    try {
      await this.fileTracker.syncToBackup(FS);

      const saveName = this.SAVE_NAME;
      const files = [];

      files.push({
        name: this.DELETED_PATH,
        content: JSON.stringify(this.fileTracker.getDeletedPaths()),
      });

      const walkFiles = (path) => {
        const dir = FS.readdir(path);
        dir.forEach(entry => {
            const fullPath = path + '/' + entry;
            if (entry === '.' || entry === '..') return;
            const stat = FS.stat(fullPath);
            const isDirectory = (stat.mode & 0o40000) !== 0; // Check if it's a directory
            const isFile = (stat.mode & 0o100000) !== 0; // Check if it's a regular file
            if (isDirectory) {
                // console.log('Directory:', fullPath);
                walkFiles(fullPath); // Recurse into the directory
            } else if (isFile) {
                // console.log('File:', fullPath);
                const s = FS.readFile(fullPath);
                if (s) {
                  files.push({
                    name: fullPath,
                    content: s,
                  });
                }
            }
        });
      }
      walkFiles(this.fileTracker.BACKUP_DIR);

      const hasChanges = await this.getSaveManager().checkFilesChanged(files);
      if (hasChanges) {
        await this.getSaveManager().save(
          `${this.saveStatePrefix}${saveName}`,
          files,
          this.saveMessageCallback,
        );
      }
    } catch (e) {
      LOG.error('Error persisting save state: ' + e);
    }
  }

  async loadState() {
    const { FS } = window;

    // Create the backup directory
    FS.mkdir(this.fileTracker.BACKUP_DIR);

    try {
      const saveName = this.SAVE_NAME;

      // Load from new save format
      const files = await this.getSaveManager().load(
        `${this.saveStatePrefix}${saveName}`,
        this.loadMessageCallback,
      );

      // Cache file hashes
      await this.getSaveManager().checkFilesChanged(files);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name === this.DELETED_PATH) {
          const content = JSON.parse(new TextDecoder('utf-8').decode(file.content));
          this.fileTracker.setDeletedPaths(content);
        } else {
          const outPath = file.name;
          const destDir = outPath.substring(0, outPath.lastIndexOf('/'));
          this.fileTracker.createDirectories(FS, destDir);
          FS.writeFile(file.name, file.content);
        }
      }

      await this.fileTracker.syncFromBackup(FS);
    } catch (e) {
      LOG.error('Error loading save state: ' + e);
    }

    const autoStartPath = this.getProps().autoStartPath;
    if (this.binaryFileName || autoStartPath) {
      // Remove "/content", convert slashes, and make upper case
      const path = this.binaryFileName ?
        `C:${this.binaryFileName.replace(/\//g, '\\').substring(8).toUpperCase()}` :
        autoStartPath;

      console.log("AUTOBOOT: " + path);
      FS.writeFile("/content/AUTOBOOT.DBP", path, { encoding: 'utf8' });
    }
  }

  isForceMenu() {
    return this.prefs.getForceStartMenu();
  }

  applyGameSettings() {}

  onArchiveFile(isDir, name, stats) {
    const autoStartPath = this.getProps().autoStartPath;
    const lowerName = name.toLowerCase();
    if (autoStartPath &&
        autoStartPath.length > 0 &&
        lowerName.indexOf(autoStartPath.toLowerCase().trim()) !== -1) {
      this.binaryFileName = name;
    }
  }

  onArchiveFilesFinished() {}

  getArchiveBinaryFileName() {
    return "/content/";
  }

  isForceAspectRatio() {
    return false;
  }

  getDefaultAspectRatio() {
    return 1.333;
  }

  resizeScreen(canvas) {
    this.canvas = canvas;
    this.updateScreenSize();
  }

  toggleKeyboard() {
    const { app } = this;
    const show = !app.isKeyboardShown();
    this.setDisableInput(show ? true : false);
    app.setKeyboardShown(show);
  }

  showTouchOverlay(show) {
    const to = document.getElementById("touch-overlay");
    if (to) {
      to.style.display = show ? 'block' : 'none';
    }
  }

  checkOnScreenControls() {
    const controls = this.prefs.getScreenControls();
    if (controls === SCREEN_CONTROLS.SC_AUTO) {
      setTimeout(() => {
        this.showTouchOverlay(true);
        this.app.forceRefresh();
      }, 0);
    }
  }

  onKeyboardEvent(e) {
    if (e.code && !this.keyboardEvent) {
      this.keyboardEvent = true;
      this.checkOnScreenControls();
    }
  }

  onTouchEvent() {
    if (!this.touchEvent) {
      this.touchEvent = true;
      this.checkOnScreenControls();
    }
  }

  onMouseEvent() {
    if (!this.mouseEvent) {
      this.mouseEvent = true;
      this.checkOnScreenControls();
    }

    this.mouseEventCount++;
  }

  updateOnScreenControls(initial = false) {
    const controls = this.prefs.getScreenControls();
    if (controls === SCREEN_CONTROLS.SC_OFF) {
      this.showTouchOverlay(false);
    } else if (controls === SCREEN_CONTROLS.SC_ON) {
      this.showTouchOverlay(true);
    } else if (controls === SCREEN_CONTROLS.SC_AUTO) {
      if (!initial) {
        setTimeout(() => {
          this.showTouchOverlay(this.touchEvent || this.mouseEvent);
          this.app.forceRefresh();
        }, 0);
      }
    }
  }

  updateVkTransparency() {
    const value = this.prefs.getVkTransparency();
    this.app.setKeyboardTransparency(value);
  }

  getShotAspectRatio() { return this.getDefaultAspectRatio(); }
}

const getKeyCode = (k) => {
  switch (k) {
    case 'Quote':
      return 39; //K_QUOTE = 39, TODO: Add this to Quake
    case 'Backspace':
      return 8; //K_BACKSPACE = 8,
    case 'Tab':
      return 9; //K_TAB = 9,
    case 'Clear':
      return 12; //K_CLEAR = 12,
    case 'Enter':
      return 13; // K_RETURN = 13, K_ENTER = 13,
    case 'Pause':
      return 19; //K_PAUSE = 19
    case 'Escape':
      return 27; //K_ESCAPE = 27,
    case 'Space':
      return 32; //K_SPACE = 32,
    case 'Comma':
      return 44; //K_COMMA = 44,
    case 'Minus':
      return 45; //K_MINUS = 45,
    case 'Period':
      return 46; //K_PERIOD = 46,
    case 'Slash':
      return 47; //K_SLASH = 47,
    case 'Digit0':
      return 48; //K_0 = 48,
    case 'Digit1':
      return 49; //K_1 = 49,
    case 'Digit2':
      return 50; //K_2 = 50,
    case 'Digit3':
      return 51; //K_3 = 51,
    case 'Digit4':
      return 52; //K_4 = 52,
    case 'Digit5':
      return 53; //K_5 = 53,
    case 'Digit6':
      return 54; //K_6 = 54,
    case 'Digit7':
      return 55; //K_7 = 55,
    case 'Digit8':
      return 56; //K_8 = 56,
    case 'Digit9':
      return 57; //K_9 = 57,
    case 'Semicolon':
      return 59; //K_SEMICOLON = 59,
    case 'Equal':
      return 61; //K_EQUALS = 61,
    case 'BracketLeft':
      return 91; //K_LEFTBRACKET = 91,
    case 'Backslash':
      return 92; //K_BACKSLASH = 92,
    case 'BracketRight':
      return 93; //K_RIGHTBRACKET = 93,
    case 'Backquote':
      return 96; //K_BACKQUOTE = 96,
    case 'KeyA':
      return 97; //K_a = 97,
    case 'KeyB':
      return 98; //K_b = 98,
    case 'KeyC':
      return 99; //K_c = 99,
    case 'KeyD':
      return 100; //K_d = 100,
    case 'KeyE':
      return 101; //K_e = 101,
    case 'KeyF':
      return 102; //K_f = 102,
    case 'KeyG':
      return 103; //K_g = 103,
    case 'KeyH':
      return 104; //K_h = 104,
    case 'KeyI':
      return 105; //K_i = 105,
    case 'KeyJ':
      return 106; //K_j = 106,
    case 'KeyK':
      return 107; //K_k = 107,
    case 'KeyL':
      return 108; //K_l = 108,
    case 'KeyM':
      return 109; //K_m = 109,
    case 'KeyN':
      return 110; //K_n = 110,
    case 'KeyO':
      return 111; //K_o = 111,
    case 'KeyP':
      return 112; //K_p = 112,
    case 'KeyQ':
      return 113; //K_q = 113,
    case 'KeyR':
      return 114; //K_r = 114,
    case 'KeyS':
      return 115; //K_s = 115,
    case 'KeyT':
      return 116; //K_t = 116,
    case 'KeyU':
      return 117; //K_u = 117,
    case 'KeyV':
      return 118; //K_v = 118,
    case 'KeyW':
      return 119; //K_w = 119,
    case 'KeyX':
      return 120; //K_x = 120,
    case 'KeyY':
      return 121; //K_y = 121,
    case 'KeyZ':
      return 122; //K_z = 122,
    case 'Delete':
      return 127; //K_DEL = 127,
    case 'ArrowUp':
      return 273; //K_UPARROW = 273,
    case 'ArrowDown':
      return 274; //K_DOWNARROW = 274,
    case 'ArrowRight':
      return 275; //K_RIGHTARROW = 275,
    case 'ArrowLeft':
      return 276; //K_LEFTARROW = 276,
    case 'Insert':
      return 277; //K_INS = 277,
    case 'Home':
      return 278; //K_HOME = 278,
    case 'End':
      return 279; //K_END = 279,
    case 'PageUp':
      return 280; //K_PGUP = 280,
    case 'PageDown':
      return 281; //K_PGDN = 281,
    case 'F1':
      return 282; //K_F1 = 282,
    case 'F2':
      return 283; //K_F2 = 283,
    case 'F3':
      return 284; //K_F3 = 284,
    case 'F4':
      return 285; //K_F4 = 285,
    case 'F5':
      return 286; //K_F5 = 286,
    case 'F6':
      return 287; //K_F6 = 287,
    case 'F7':
      return 288; //K_F7 = 288,
    case 'F8':
      return 289; //K_F8 = 289,
    case 'F9':
      return 290; //K_F9 = 290,
    case 'F10':
      return 291; //K_F10 = 291,
    case 'F11':
      return 292; //K_F11 = 292,
    case 'F12':
      return 293; //K_F12 = 293,
    case 'F13':
      return 294; //K_F13 = 294,
    case 'F14':
      return 295; //K_F14 = 295,
    case 'F15':
      return 296; //K_F15 = 296,
    case 'CapsLock':
      return 301; //K_CAPSLOCK = 301,
    case 'ScrollLock':
      return 302; //K_SCROLLOCK = 302,
    case 'ShiftRight':
      return 303; //K_RSHIFT = 303,
    case 'ShiftLeft':
      return 304; //K_LSHIFT = 304,
    case 'ControlRight':
      return 305; //K_RCTRL = 305,
    case 'ControlLeft':
      return 306; //K_LCTRL = 306,
    case 'AltRight':
      return 307; //K_RALT = 307,
    case 'AltLeft':
      return 308; //K_LALT = 308,
    case 'MetaRight':
      return 309; //K_RMETA = 309,
    case 'MetaLeft':
      return 310; //K_LMETA = 310,
    case 'NumLock':
      return 300; //K_NUMLOCK = 300,
    case 'KeypadPeriod':
      return 266;  //  K_KP_PERIOD = 266,
    case 'KeypadMultiply':
      return 268;  //  K_KP_MULTIPLY = 268,
    case 'KeypadDivide':
      return 267;  //  K_KP_DIVIDE = 267,
    case 'KeypadMinus':
      return 269;  // K_KP_MINUS = 269,
    case 'KeypadPlus':
      return 270;  //  K_KP_PLUS = 270,
    case 'KeypadEnter':
      return 271;  //  K_KP_ENTER = 271,
    case 'Print':
      return 316; // K_PRINT = 316,
    default:
  }
  return 0;
};

//K_KP_EQUALS = 272,
//K_EXCLAIM = 33,
//K_QUOTEDBL = 34,
//K_HASH = 35,
//K_DOLLAR = 36,
//K_PERCENT = 37,
//K_AMPERSAND = 38,
//K_QUOTE = 39,
//K_LEFTPAREN = 40,
//K_RIGHTPAREN = 41,
//K_ASTERISK = 42,
//K_PLUS = 43,
//K_COLON = 58,
//K_LESS = 60,
// K_GREATER = 62,
// K_QUESTION = 63,
// K_AT = 64,
// K_CARET = 94,
// K_UNDERSCORE = 95,
// K_BRACELEFT = 123,
// K_BRACERIGHT = 125,
//  /* Numeric keypad */
//  K_KP0 = 256,
//  K_KP1 = 257,
//  K_KP2 = 258,
//  K_KP3 = 259,
//  K_KP4 = 260,
//  K_KP5 = 261,
//  K_KP6 = 262,
//  K_KP7 = 263,
//  K_KP8 = 264,
//  K_KP9 = 265,
//  K_KP_PERIOD = 266,
//  K_KP_DIVIDE = 267,
//  K_KP_MULTIPLY = 268,
//  K_KP_MINUS = 269,
//  K_KP_PLUS = 270,
//  K_KP_ENTER = 271,
//  K_KP_EQUALS = 272,
// K_BAR = 124,
// K_ASCIITILDE = 126,
// K_NUMLOCK = 300,
// K_LSUPER = 311,	/* Left "Windows" key */
// K_RSUPER = 312,	/* Right "Windows" key */
// K_MODE = 313,	/* "Alt Gr" key */
// K_COMPOSE = 314,	/* Multi-key compose key */
// /* Misc. function keys */
// K_HELP = 315,
// K_PRINT = 316,
// K_SYSREQ = 317,
// K_BREAK = 318,
// K_MENU = 319,
// K_POWER = 320,
// K_EURO = 321,
// K_UNDO = 322,
