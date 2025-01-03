import {
  AppPrefs
} from '@webrcade/app-common';

export const VK_TRANSPARENCY = {
  LOW: "low",
  HIGH: "high"
}

export const VK_POSITION = {
  MIDDLE: "middle",
  BOTTOM: "bottom"
}

export const GAMEPAD_MODE ={
  GAMEPAD: "gamepad",
  MOUSE: "mouse"
}

export class Prefs extends AppPrefs {
  constructor(emu) {
    super(emu);

    this.emu = emu;
    const app = emu.getApp();

    this.vkTransparencyPath = app.getStoragePath(`${this.PREFS_PREFIX}.vkTransparency`);
    this.vkTransparency = VK_TRANSPARENCY.HIGH;

    // this.vkCloseOnEnterPath = app.getStoragePath(`${this.PREFS_PREFIX}.vkCloseOnEnter`);
    // this.vkCloseOnEnter = true;

    this.vkPositionPath = app.getStoragePath(`${this.PREFS_PREFIX}.vkPosition`);
    this.vkPosition = VK_POSITION.MIDDLE;

    this.forceStartMenuPath = app.getStoragePath(`${this.PREFS_PREFIX}.forceStartMenu`);
    this.forceStartMenu = false;

    //this.gamepadModePath = app.getStoragePath(`${this.PREFS_PREFIX}.gamepadMode`);
    this.gamepadMode = GAMEPAD_MODE.GAMEPAD;
  }

  async load() {
    console.log("## loading prefs.")
    await super.load();
    // TODO: enable once the bug is fixed (when starting in touchpad mode)
    this.vkTransparency = await super.loadValue(this.vkTransparencyPath, VK_TRANSPARENCY.LOW);
    this.vkPosition = await super.loadValue(this.vkPositionPath, VK_POSITION.MIDDLE);
    this.forceStartMenu = await super.loadBool(this.forceStartMenuPath, false);
    // this.gamepadMode = await super.loadValue(this.gamepadModePath, GAMEPAD_MODE.GAMEPAD);
    // this.vkCloseOnEnter = await super.loadBool(this.vkCloseOnEnterPath, true);
  }

  async save() {
    await super.save();
    await super.saveValue(this.vkTransparencyPath, this.vkTransparency);
    await super.saveValue(this.vkPositionPath, this.vkPosition);
    await super.saveBool(this.forceStartMenuPath, this.forceStartMenu);
    // await super.saveValue(this.gamepadModePath, this.gamepadMode);
    // await super.saveBool(this.vkCloseOnEnterPath, this.vkCloseOnEnter);
  }

  getVkTransparency() {
    return this.vkTransparency;
  }

  setVkTransparency(vkTransparency) {
    this.vkTransparency = vkTransparency;
    this.save();
  }

  getGamepadMode() {
    return this.gamepadMode;
  }

  setGamepadMode(mode) {
    this.gamepadMode = mode;
    //this.save();
  }

  // getVkCloseOnEnter() {
  //   return this.vkCloseOnEnter;
  // }

  // setVkCloseOnEnter(value) {
  //   this.vkCloseOnEnter = value;
  //   this.save();
  // }

  getVkPosition() {
    return this.vkPosition
  }

  setVkPosition(vkPosition) {
    this.vkPosition = vkPosition;
    this.save();
  }

  getForceStartMenu() {
    return this.forceStartMenu;
  }

  setForceStartMenu(value) {
    this.forceStartMenu = value;
    this.save();
  }
}
