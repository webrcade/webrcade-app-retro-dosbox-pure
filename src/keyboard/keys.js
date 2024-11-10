import { VK_POSITION } from "../emulator/prefs";
import {
  KeyDef
} from "./common";

import {
  ArrowUpwardImage,
  ArrowDownwardImage,
  ArrowBackImage,
  ArrowForwardImage,
  SwapVertImage,
} from '@webrcade/app-common';

const SHIFT_PREFIX = "SHIFT:";

const onKeyboardClose = (kb, ctx) => {
  if (ctx.commodore) {
    ctx.commodore = false;
  }
  if (ctx.leftShift) {
    ctx.leftShift = false;
  }
  if (ctx.rightShift) {
    ctx.rightShift = false;
  }
  if (ctx.control) {
    ctx.control = false;
  }
  if (ctx.alt) {
    ctx.alt = false;
  }
  if (ctx.meta) {
    ctx.meta = false;
  }
  if (ctx.caps) {
    ctx.caps = false;
    onKey(kb, ctx, new KeyDef("CapsLock").code("CapsLock"));
  }
  if (ctx.scroll) {
    ctx.scroll = false;
    onKey(kb, ctx, new KeyDef("ScrollLock").code("ScrollLock"));
  }
  if (ctx.num) {
    ctx.num = false;
    onKey(kb, ctx, new KeyDef("NumLock").code("NumLock"));
  }
}

let nextFlip = 0;

const allowFlip = () => {
  const NOW = Date.now();
  if (nextFlip < NOW) {
    nextFlip = NOW + 200;
    return true;
  }
  console.log('ignoring flip!')
  return false;
}

const showLetters = (kb, ctx) => {
  if (!allowFlip()) return;
  ctx.currentKeys = "default";
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}

const showNumbers = (kb, ctx) => {
  if (!allowFlip()) return;
  ctx.currentKeys = "numbers";
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}

const showCaps = (kb, ctx) => {
  if (!allowFlip()) return;
  ctx.currentKeys = "caps";
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}

const showOther = (kb, ctx) => {
  if (!allowFlip()) return;
  ctx.currentKeys = "other";
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}


const toggleLeftShift = (kb, ctx, key) => {
  ctx.leftShift = !ctx.leftShift;
  kb.setState({ keysContext: { ...ctx } })
  if (ctx.leftShift) {
    onKey(kb, ctx, key);
  }
}

const toggleAlt = (kb, ctx, key) => {
  ctx.alt = !ctx.alt;
  kb.setState({ keysContext: { ...ctx } })
  if (ctx.alt) {
    onKey(kb, ctx, key);
  }
}

const toggleMeta = (kb, ctx, key) => {
  ctx.meta = !ctx.meta;
  kb.setState({ keysContext: { ...ctx } })
  if (ctx.meta) {
    onKey(kb, ctx, key);
  }
}

const toggleControl = (kb, ctx, key) => {
  ctx.control = !ctx.control;
  kb.setState({ keysContext: { ...ctx } })
  if (ctx.control) {
    onKey(kb, ctx, key);
  }
}

const toggleCaps = (kb, ctx, key) => {
  ctx.caps = !ctx.caps;
  kb.setState({ keysContext: { ...ctx } })
  // if (ctx.caps) {
    onKey(kb, ctx, key);
  // }
}

const toggleScroll = (kb, ctx, key) => {
  ctx.scroll = !ctx.scroll;
  kb.setState({ keysContext: { ...ctx } })
  // if (ctx.caps) {
    onKey(kb, ctx, key);
  // }
}

const toggleNum = (kb, ctx, key) => {
  ctx.num = !ctx.num;
  kb.setState({ keysContext: { ...ctx } })
  // if (ctx.caps) {
    onKey(kb, ctx, key);
  // }
}


const leftShiftEnabled = (kb, ctx) => {
  return ctx.leftShift;
}

const altEnabled = (kb, ctx) => {
  return ctx.alt;
}

const metaEnabled = (kb, ctx) => {
  return ctx.meta;
}

const controlEnabled = (kb, ctx) => {
  return ctx.control;
}

const capsEnabled = (kb, ctx) => {
  return ctx.caps;
}

const scrollEnabled = (kb, ctx) => {
  return ctx.scroll;
}

const numEnabled = (kb, ctx) => {
  return ctx.num;
}

const locationToggle = (kb, ctx) => {
  const prefs = window.emulator.getPrefs()
  prefs.setVkPosition(
    prefs.getVkPosition() === VK_POSITION.MIDDLE ?
      VK_POSITION.BOTTOM : VK_POSITION.MIDDLE
  )
  kb.forceRefresh();
}

const onKey = (kb, ctx, key) => {
  let shift = false;
  let code = null;
  if (key.c.startsWith(SHIFT_PREFIX)) {
    shift = true;
    code = key.c.substring(SHIFT_PREFIX.length);
  }

  if (code === null) {
    code = key.c;
  }

  if (ctx.leftShift || shift) {
    window.emulator.sendKeyDown("ShiftLeft");
  }
  if (ctx.rightShift) {
    window.emulator.sendKeyDown("ShiftRight");
  }
  if (ctx.control) {
    window.emulator.sendKeyDown("ControlLeft");
  }
  if (ctx.alt) {
    window.emulator.sendKeyDown("AltLeft");
  }
  if (ctx.meta) {
    window.emulator.sendKeyDown("MetaLeft");
  }

  window.emulator.sendKeyDown(code);

  setTimeout(() => {
    window.emulator.sendKeyUp(code);

    if (ctx.rightShift) {
      window.emulator.sendKeyUp("ShiftRight");
    }
    if (ctx.leftShift || shift) {
      window.emulator.sendKeyUp("ShiftLeft");
    }
    if (ctx.control) {
      window.emulator.sendKeyUp("ControlLeft");
    }
    if (ctx.alt) {
      window.emulator.sendKeyUp("AltLeft");
    }
    if (ctx.meta) {
      window.emulator.sendKeyUp("MetaLeft");
    }
  }, 50);
}

const onEnter = (kb, ctx, key) => {
  onKey(kb, ctx, key);
  if (kb.isCloseOnEnter()) {
    window.emulator.app.setKeyboardShown(false);
  }
}

const KEYS = {
  "default": [
    [
      new KeyDef("q").code("KeyQ").setOnClick(onKey),
      new KeyDef("w").code("KeyW").setOnClick(onKey),
      new KeyDef("e").code("KeyE").setOnClick(onKey),
      new KeyDef("r").code("KeyR").setOnClick(onKey),
      new KeyDef("t").code("KeyT").setOnClick(onKey),
      new KeyDef("y").code("KeyY").setOnClick(onKey),
      new KeyDef("u").code("KeyU").setOnClick(onKey),
      new KeyDef("i").code("KeyI").setOnClick(onKey),
      new KeyDef("o").code("KeyO").setOnClick(onKey),
      new KeyDef("p").code("KeyP").setOnClick(onKey),
    ],
    [
      new KeyDef("a").code("KeyA").setOnClick(onKey),
      new KeyDef("s").code("KeyS").setOnClick(onKey),
      new KeyDef("d").code("KeyD").setOnClick(onKey),
      new KeyDef("f").code("KeyF").setOnClick(onKey),
      new KeyDef("g").code("KeyG").setOnClick(onKey),
      new KeyDef("h").code("KeyH").setOnClick(onKey),
      new KeyDef("j").code("KeyJ").setOnClick(onKey),
      new KeyDef("k").code("KeyK").setOnClick(onKey),
      new KeyDef("l").code("KeyL").setOnClick(onKey),
      new KeyDef(";").code("Semicolon").setOnClick(onKey),
    ],
    [
      new KeyDef("CAPS").setOnClick(showCaps),
      new KeyDef("z").code("KeyZ").setOnClick(onKey),
      new KeyDef("x").code("KeyX").setOnClick(onKey),
      new KeyDef("c").code("KeyC").setOnClick(onKey),
      new KeyDef("v").code("KeyV").setOnClick(onKey),
      new KeyDef("b").code("KeyB").setOnClick(onKey),
      new KeyDef("n").code("KeyN").setOnClick(onKey),
      new KeyDef("m").code("KeyM").setOnClick(onKey),
      new KeyDef("Delete").setWidth(2).code("Backspace").setOnClick(onKey),
    ],
    [
      new KeyDef("123...").setOnClick(showNumbers),
      new KeyDef("!@#...").setOnClick(showOther),
      new KeyDef("[").code("BracketLeft").setOnClick(onKey),
      new KeyDef("]").code("BracketRight").setOnClick(onKey),
      new KeyDef("Space").setWidth(2).code("Space").setOnClick(onKey),
      new KeyDef(",").code("Comma").setOnClick(onKey),
      new KeyDef(".").code("Period").setOnClick(onKey),
      new KeyDef("Enter").setWidth(2).code("Enter").setOnClick(onEnter),
    ],
  ],
  "caps": [
    [
      new KeyDef("Q").code(SHIFT_PREFIX + "KeyQ").setOnClick(onKey),
      new KeyDef("W").code(SHIFT_PREFIX + "KeyW").setOnClick(onKey),
      new KeyDef("E").code(SHIFT_PREFIX + "KeyE").setOnClick(onKey),
      new KeyDef("R").code(SHIFT_PREFIX + "KeyR").setOnClick(onKey),
      new KeyDef("T").code(SHIFT_PREFIX + "KeyT").setOnClick(onKey),
      new KeyDef("Y").code(SHIFT_PREFIX + "KeyY").setOnClick(onKey),
      new KeyDef("U").code(SHIFT_PREFIX + "KeyU").setOnClick(onKey),
      new KeyDef("I").code(SHIFT_PREFIX + "KeyI").setOnClick(onKey),
      new KeyDef("O").code(SHIFT_PREFIX + "KeyO").setOnClick(onKey),
      new KeyDef("P").code(SHIFT_PREFIX + "KeyP").setOnClick(onKey),
    ],
    [
      new KeyDef("A").code(SHIFT_PREFIX + "KeyA").setOnClick(onKey),
      new KeyDef("S").code(SHIFT_PREFIX + "KeyS").setOnClick(onKey),
      new KeyDef("D").code(SHIFT_PREFIX + "KeyD").setOnClick(onKey),
      new KeyDef("F").code(SHIFT_PREFIX + "KeyF").setOnClick(onKey),
      new KeyDef("G").code(SHIFT_PREFIX + "KeyG").setOnClick(onKey),
      new KeyDef("H").code(SHIFT_PREFIX + "KeyH").setOnClick(onKey),
      new KeyDef("J").code(SHIFT_PREFIX + "KeyJ").setOnClick(onKey),
      new KeyDef("K").code(SHIFT_PREFIX + "KeyK").setOnClick(onKey),
      new KeyDef("L").code(SHIFT_PREFIX + "KeyL").setOnClick(onKey),
      new KeyDef(":").code(SHIFT_PREFIX + "Semicolon").setOnClick(onKey),
    ],
    [
      new KeyDef("caps").setOnClick(showLetters),
      new KeyDef("Z").code(SHIFT_PREFIX + "KeyZ").setOnClick(onKey),
      new KeyDef("X").code(SHIFT_PREFIX + "KeyX").setOnClick(onKey),
      new KeyDef("C").code(SHIFT_PREFIX + "KeyC").setOnClick(onKey),
      new KeyDef("V").code(SHIFT_PREFIX + "KeyV").setOnClick(onKey),
      new KeyDef("B").code(SHIFT_PREFIX + "KeyB").setOnClick(onKey),
      new KeyDef("N").code(SHIFT_PREFIX + "KeyN").setOnClick(onKey),
      new KeyDef("M").code(SHIFT_PREFIX + "KeyM").setOnClick(onKey),
      new KeyDef("Delete").setWidth(2).code("Backspace").setOnClick(onKey),
    ],
    [
      new KeyDef("123...").setOnClick(showNumbers),
      new KeyDef("!@#...").setOnClick(showOther),
      new KeyDef("{").code(SHIFT_PREFIX + "BracketLeft").setOnClick(onKey),
      new KeyDef("}").code(SHIFT_PREFIX + "BracketRight").setOnClick(onKey),
      new KeyDef("Space").setWidth(2).code("Space").setOnClick(onKey),
      new KeyDef("<").code(SHIFT_PREFIX + "Comma").setOnClick(onKey),
      new KeyDef(">").code(SHIFT_PREFIX + "Period").setOnClick(onKey),
      new KeyDef("Enter").setWidth(2).code("Enter").setOnClick(onEnter),
    ],
  ],
  "numbers": [
    [
      new KeyDef("1").code("Digit1").setOnClick(onKey),
      new KeyDef("2").code("Digit2").setOnClick(onKey),
      new KeyDef("3").code("Digit3").setOnClick(onKey),
      new KeyDef("4").code("Digit4").setOnClick(onKey),
      new KeyDef("5").code("Digit5").setOnClick(onKey),
      new KeyDef("6").code("Digit6").setOnClick(onKey),
      new KeyDef("7").code("Digit7").setOnClick(onKey),
      new KeyDef("8").code("Digit8").setOnClick(onKey),
      new KeyDef("9").code("Digit9").setOnClick(onKey),
      new KeyDef("0").code("Digit0").setOnClick(onKey),
    ],
    [
      new KeyDef("Esc").code("Escape").setOnClick(onKey),
      new KeyDef("`").code("Backquote").setOnClick(onKey),
      new KeyDef("-").code("Minus").setOnClick(onKey),
      new KeyDef("=").code("Equal").setOnClick(onKey),
      new KeyDef("ScrLk").code("ScrollLock").setOnClick(toggleScroll).setIsEnabledCb(scrollEnabled),
      new KeyDef("Ins").code("Insert").setOnClick(onKey),
      new KeyDef("PgUp").code("PageUp").setOnClick(onKey),
      new KeyDef("Home").code("Home").setOnClick(onKey),
      new KeyDef("Up").setImage(ArrowUpwardImage).code("ArrowUp").setOnClick(onKey),
      new KeyDef("End").code("End").setOnClick(onKey),
    ],
    [
      new KeyDef("Tab").code("Tab").setOnClick(onKey),
      new KeyDef("\\").code("Backslash").setOnClick(onKey),
      new KeyDef("/").code("Slash").setOnClick(onKey),
      new KeyDef("'").code("Quote").setOnClick(onKey),
      new KeyDef("NmLk").code("NumLock").setOnClick(toggleNum).setIsEnabledCb(numEnabled),
      new KeyDef("Del").code("Delete").setOnClick(onKey),
      new KeyDef("PdDn").code("PageDown").setOnClick(onKey),
      new KeyDef("Left").setImage(ArrowBackImage).code("ArrowLeft").setOnClick(onKey),
      new KeyDef("Down").setImage(ArrowDownwardImage).code("ArrowDown").setOnClick(onKey),
      new KeyDef("Right").setImage(ArrowForwardImage).code("ArrowRight").setOnClick(onKey),
    ],
    [
      new KeyDef("abc...").setOnClick(showLetters),
      new KeyDef("!@#...").setOnClick(showOther),
      new KeyDef("Position").setImage(SwapVertImage).setOnClick(locationToggle),
      new KeyDef("Shift").code("ShiftLeft").setWidth(2).setOnClick(toggleLeftShift).setIsEnabledCb(leftShiftEnabled),
      new KeyDef("Ctrl").code("ControlLeft").setWidth(2).setOnClick(toggleControl).setIsEnabledCb(controlEnabled),
      new KeyDef("Alt").code("AltLeft").setOnClick(toggleAlt).setIsEnabledCb(altEnabled),
      new KeyDef("Meta").code("MetaLeft").setOnClick(toggleMeta).setIsEnabledCb(metaEnabled),
      new KeyDef("CapLk").code("CapsLock").setOnClick(toggleCaps).setIsEnabledCb(capsEnabled),
    ],
  ],
  "other": [
    [
      new KeyDef("!").code(SHIFT_PREFIX + "Digit1").setOnClick(onKey),
      new KeyDef("@").code(SHIFT_PREFIX + "Digit2").setOnClick(onKey),
      new KeyDef("#").code(SHIFT_PREFIX + "Digit3").setOnClick(onKey),
      new KeyDef("$").code(SHIFT_PREFIX + "Digit4").setOnClick(onKey),
      new KeyDef("%").code(SHIFT_PREFIX + "Digit5").setOnClick(onKey),
      new KeyDef("^").code(SHIFT_PREFIX + "Digit6").setOnClick(onKey),
      new KeyDef("&").code(SHIFT_PREFIX + "Digit7").setOnClick(onKey),
      new KeyDef("*").code(SHIFT_PREFIX + "Digit8").setOnClick(onKey),
      new KeyDef("(").code(SHIFT_PREFIX + "Digit9").setOnClick(onKey),
      new KeyDef(")").code(SHIFT_PREFIX + "Digit0").setOnClick(onKey),
    ],
    [
      new KeyDef("Esc").code("Escape").setOnClick(onKey),
      new KeyDef("~").code(SHIFT_PREFIX + "Backquote").setOnClick(onKey),
      new KeyDef("_").code(SHIFT_PREFIX + "Minus").setOnClick(onKey),
      new KeyDef("+").code(SHIFT_PREFIX + "Equal").setOnClick(onKey),
      new KeyDef("Kp/").code("KeypadDivide").setOnClick(onKey),
      new KeyDef("Kp-").code("KeypadMinus").setOnClick(onKey),
      new KeyDef("F1").code("F1").setOnClick(onKey),
      new KeyDef("F2").code("F2").setOnClick(onKey),
      new KeyDef("F3").code("F3").setOnClick(onKey),
      new KeyDef("F4").code("F4").setOnClick(onKey),
    ],
    [
      new KeyDef("Tab").code("Tab").setOnClick(onKey),
      new KeyDef("|").code(SHIFT_PREFIX + "Backslash").setOnClick(onKey),
      new KeyDef("?").code(SHIFT_PREFIX + "Slash").setOnClick(onKey),
      new KeyDef("\"").code(SHIFT_PREFIX + "Quote").setOnClick(onKey),
      new KeyDef("Kp.").code("KeypadPeriod").setOnClick(onKey),
      new KeyDef("Kp*").code("KeypadMultiply").setOnClick(onKey),
      new KeyDef("F5").code("F5").setOnClick(onKey),
      new KeyDef("F6").code("F6").setOnClick(onKey),
      new KeyDef("F7").code("F7").setOnClick(onKey),
      new KeyDef("F8").code("F8").setOnClick(onKey),
    ],
    [
      new KeyDef("abc...").setOnClick(showLetters),
      new KeyDef("123...").setOnClick(showNumbers),
      new KeyDef("Pause").code("Pause").setOnClick(onKey),
      new KeyDef("Print").code("Print").setOnClick(onKey),
      new KeyDef("Kp+").code("KeypadPlus").setOnClick(onKey),
      new KeyDef("KpEnt").code("KeypadEnter").setOnClick(onKey),
      new KeyDef("F9").code("F9").setOnClick(onKey),
      new KeyDef("F10").code("F10").setOnClick(onKey),
      new KeyDef("F11").code("F11").setOnClick(onKey),
      new KeyDef("F12").code("F12").setOnClick(onKey),
    ],
  ]
}


export { KEYS, onKeyboardClose }