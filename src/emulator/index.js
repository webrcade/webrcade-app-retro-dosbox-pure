import {
  Controllers,
  Controller,
  KeyCodeToControlMapping,
  RetroAppWrapper,
  DisplayLoop,
  LOG,
} from '@webrcade/app-common';

class QuakeKeyCodeToControlMapping extends KeyCodeToControlMapping {
  constructor() {
    super({
      // [KCODES.ESCAPE]: CIDS.ESCAPE,
    });
  }
}

export class Emulator extends RetroAppWrapper {
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

    this.wadType = this.getProps().wadType;
    if (!this.wadType) {
      this.wadType = 0;
    }

    this.wadPath = this.getProps().wadPath;
    if (!this.wadPath) {
      this.wadPath = '';
    }
    this.wadPath = this.wadPath.trim();

    this.paks = {};
    this.binaryFileName = null;
    this.dirName = null;

    this.maxKeys = 100;
    this.keyCount = 0;
    this.keys = [];
    for (let i = 0; i < this.maxKeys; i++) {
      this.keys[i] = [0, 0];
    }

    this.pointerLockHandler = async () => {
      if (!document.pointerLockElement) {
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
        //console.log(x + ", " + y)
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
// TODO: Disable when entering menu, etc.
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
        // if (e.code === 'Escape') {
        //   if (this.escapeDownTime === -1) {
        //     this.escapeDownTime = Date.now();
        //   }
        //   return;
        // }
        key[0] = code;
        key[1] = 1;
      }
    };

    document.onkeyup = (e) => {
      const code = getKeyCode(e.code);
      if (code !== 0 && this.keyCount < this.maxKeys) {
        let key = this.keys[this.keyCount++];
        // if (e.code === 'Escape') {
        //   if (
        //     this.escapeDownTime !== -1 &&
        //     Date.now() - this.escapeDownTime < 1000
        //   ) {
        //     key[0] = code;
        //     key[1] = 0;
        //     key = this.keys[this.keyCount++];
        //     key[0] = code;
        //     key[1] = 1;
        //   } else {
        //     if (this.pause(true)) {
        //       this.showPauseMenu();
        //     }
        //   }
        //   this.escapeDownTime = -1;
        //   return;
        // }
        key[0] = code;
        key[1] = 0;
      }
    };
  }

  getMouseAbsX() {
    return this.mouseAbsX >> 0;
  }

  getMouseAbsY() {
    return this.mouseAbsY >> 0;
  }

  getExitOnLoopError() {
    return true;
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
    if (p) {
      this.blockKeys = false;
    } else {
      this.blockKeys = true;
    }
    this.setPointerLock(!p && this.gameRunning);
  }

  setGameRunning(running) {
    console.log("isGameRunning: " + running);
    this.gameRunning = running;
    this.setPointerLock(running);
  }

  onShowQuakeMenu(show) {
    // alert('show menu: ' + show);
    this.analogMode = !show;
  }


  createDisplayLoop(debug) {
    return new DisplayLoop(60, false, debug, false, true);
  }

  onFrame() {
    if (this.firstFrame) {
      const canvas = this.canvas;
      this.blockKeys = true;
      this.firstFrame = false;

      window.addEventListener("contextmenu", e => e.preventDefault());
    }

    if (window.Module && window.Module._wrc_update_mouse) {
      window.Module._wrc_update_mouse(
        this.mouseX,
        this.mouseY,
        //document.pointerLockElement ? this.mouseButtons : 0,
        this.mouseButtons
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
    // const { dirName } = this;
    // const { FS } = window;

    // try {
    //   const saveName = `${dirName}.zip`;
    //   const pathPrefix = this.savePathPrefix;
    //   const files = [];
    //   for (let i = -1; i < MAX_SAVES; i++) {
    //     const fileName = i === -1 ? 'config.cfg' : `s${i}.sav`;
    //     const path = `${pathPrefix}${fileName}`;
    //     try {
    //       const res = FS.analyzePath(path, true);
    //       if (res.exists) {
    //         const s = FS.readFile(path);
    //         if (s) {
    //           files.push({
    //             name: fileName,
    //             content: s,
    //           });
    //         }
    //       }
    //     } catch (e) {
    //       LOG.error(e);
    //     }
    //   }

    //   const hasChanges = await this.getSaveManager().checkFilesChanged(files);
    //   if (hasChanges) {
    //     await this.getSaveManager().save(
    //       `${this.saveStatePrefix}${saveName}`,
    //       files,
    //       this.saveMessageCallback,
    //     );
    //   }
    // } catch (e) {
    //   LOG.error('Error persisting save state: ' + e);
    // }
  }

  async loadState() {
    const { FS } = window;

    if (this.binaryFileName) {
      // Remove "/content", convert slashes, and make upper case
      const path = `C:${this.binaryFileName.replace(/\//g, '\\').substring(8).toUpperCase()}`;

      console.log("AUTOBOOT: " + path);
      FS.writeFile("/content/AUTOBOOT.DBP", path, { encoding: 'utf8' });
    }

    // const { dirName } = this;
    // const { FS } = window;

    // try {
    //   const saveName = `${dirName}.zip`;

    //   // Load from new save format
    //   const files = await this.getSaveManager().load(
    //     `${this.saveStatePrefix}${saveName}`,
    //     this.loadMessageCallback,
    //   );

    //   // Cache file hashes
    //   await this.getSaveManager().checkFilesChanged(files);

    //   const pathPrefix = this.savePathPrefix;
    //   FS.mkdir(pathPrefix.substring(0, pathPrefix.length - 1));

    //   for (let i = -1; i < MAX_SAVES; i++) {
    //     const fileName = i === -1 ? 'config.cfg' : `s${i}.sav`;
    //     const path = `${pathPrefix}${fileName}`;
    //     try {
    //       const res = FS.analyzePath(path, true);
    //       if (!res.exists) {
    //         let s = null;
    //         for (let j = 0; j < files.length; j++) {
    //           const f = files[j];
    //           if (f.name === fileName) {
    //             s = f.content;
    //             break;
    //           }
    //         }
    //         if (s) {
    //           FS.writeFile(path, s);
    //         }
    //       }
    //     } catch (e) {
    //       LOG.error(e);
    //     }
    //   }
    // } catch (e) {
    //   LOG.error('Error loading save state: ' + e);
    // }
  }

  applyGameSettings() {}

  onArchiveFile(isDir, name, stats) {
    const autoStartPath = this.getProps().autoStartPath;
    const lowerName = name.toLowerCase();
console.log(name);
    if (autoStartPath &&
        autoStartPath.length > 0 &&
        lowerName.indexOf(autoStartPath.toLowerCase().trim()) !== -1) {
      this.binaryFileName = name;
    }

    // // const { paks } = this;
    // const lowerName = name.toLowerCase();

    // if (lowerName.endsWith('.pak')) {
    //   const parts = name.split('/');
    //   if (parts.length >= 2) {
    //     const pak = parts[parts.length - 1];
    //     const path = parts[parts.length - 2];
    //     let p = paks[path];
    //     if (!p) {
    //       paks[path] = [];
    //     }
    //     paks[path].push([pak, name]);
    //   }
    // }
  }

  // findPak(findPath) {
  //   const { paks } = this;
  //   const findPathLower = findPath.toLowerCase();
  //   for (let p in paks) {
  //     const pathPaks = paks[p];
  //     for (let i = 0; i < pathPaks.length; i++) {
  //       const pakInfo = pathPaks[i];
  //       // const pak = pakInfo[0];
  //       const fullPath = pakInfo[1];
  //       if (fullPath.toLowerCase().includes(findPathLower)) {
  //         return p;
  //       }
  //     }
  //   }
  //   return null;
  // }

  // getMainPakFile(name) {
  //   const pakFiles = this.paks[name];
  //   pakFiles.sort((a, b) => {
  //     const paka = a[0].toLowerCase();
  //     const pakb = b[0].toLowerCase();
  //     if (paka < pakb) {
  //       return 1;
  //     }
  //     if (paka > pakb) {
  //       return -1;
  //     }
  //     return 0;
  //   });
  //   return pakFiles[0][1];
  // }

  onArchiveFilesFinished() {

console.log("ARCHIVE FILES FINISHED")

    const throwError = (path) => {
      throw Error(`Unable to find '${path}' in archive.`);
    };

    // const getMainFor = (path) => {
    //   const name = this.findPak(path);
    //   if (!name) throwError(path);
    //   this.binaryFileName = this.getMainPakFile(name);
    //   this.dirName = name;
    //   this.savePathPrefix = `/home/web_user/retroarch/userdata/saves/${name}/`;
    // };

    // const t = this.wadType;
    // if (!this.findPak(QUAKE_FULL_SHAREWARE_PATH)) {
    //   throwError(QUAKE_FULL_SHAREWARE_PATH);
    // }
    // if (t !== QUAKE && t !== AUTO) {
    //   if (!this.findPak(QUAKE_FULL_PATH)) {
    //     throwError(QUAKE_FULL_PATH);
    //   }
    // }

    // switch (t) {
    //   case QUAKE:
    //     getMainFor(QUAKE_PATH);
    //     break;
    //   case SCOURGE:
    //     getMainFor(SCOURGE_PATH);
    //     break;
    //   case DISSOLUTION:
    //     getMainFor(DISSOLUTION_PATH);
    //     break;
    //   case DOPA:
    //     getMainFor(DOPA_PATH);
    //     break;
    //   case CUSTOM:
    //     const path = this.wadPath;
    //     if (path.length === 0) {
    //       throw Error('A custom game path was not provided.');
    //     }
    //     getMainFor(path);
    //     break;
    //   case AUTO:
    //     const { paks } = this;
    //     let found = false;
    //     if (Object.keys(paks).length === 2) {
    //       for (let p in paks) {
    //         if (p.toLowerCase() === 'id1') {
    //           continue;
    //         }
    //         getMainFor(p);
    //         found = true;
    //         break;
    //       }
    //     }
    //     if (!found) {
    //       getMainFor(QUAKE_PATH);
    //     }
    //     break;
    //   default:
    // }
  }

  getArchiveBinaryFileName() {
    return "/content/";
  }

  // resizeScreen(canvas) {
  //   // Determine the zoom level
  //   let zoomLevel = 0;
  //   if (this.getProps().zoomLevel) {
  //     zoomLevel = this.getProps().zoomLevel;
  //   }

  //   const wsize = 96 + zoomLevel;
  //   const hsize = 96 + zoomLevel;
  //   canvas.style.setProperty('width', `${wsize}vw`, 'important');
  //   canvas.style.setProperty('height', `${hsize}vh`, 'important');
  //   canvas.style.setProperty(
  //     'max-width',
  //     `calc(${hsize}vh*1.333)`,
  //     'important',
  //   );
  //   canvas.style.setProperty(
  //     'max-height',
  //     `calc(${wsize}vw*0.75)`,
  //     'important',
  //   );
  // }

  // getShotAspectRatio() {
  //   return 1.333;
  // }

  isForceAspectRatio() {
    return false;
  }

  getDefaultAspectRatio() {
    return 1.333;
  }

  resizeScreen(canvas) {
    this.canvas = canvas;
    // // Determine the zoom level
    // let zoomLevel = 0;
    // if (this.getProps().zoomLevel) {
    //   zoomLevel = this.getProps().zoomLevel;
    // }

    // const size = 96 + zoomLevel;
    // canvas.style.setProperty('width', `${size}vw`, 'important');
    // canvas.style.setProperty('height', `${size}vh`, 'important');
    // canvas.style.setProperty('max-width', `calc(${size}vh*1.22)`, 'important');
    // canvas.style.setProperty('max-height', `calc(${size}vw*0.82)`, 'important');
    this.updateScreenSize();
  }

  getShotAspectRatio() { return this.getDefaultAspectRatio(); }
}

const getKeyCode = (k) => {
  switch (k) {
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
    default:
  }
  return 0;
};

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
