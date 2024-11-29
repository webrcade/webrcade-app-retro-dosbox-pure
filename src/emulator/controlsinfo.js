export class ControlsInfo {
  constructor(emu) {
    this.emu = emu;
    this.str = "";
    this.map = null;
  }

  getInfo() {
    return this.map;
  }

  parseInfo() {
    if (this.map) return;

    const map = new Map();
    this.map = map;
    const input = this.str;

    // Split the input by new lines to process each line
    const lines = input.split('\n');

    let currentKey = null;
    let currentFunction = null;
    let currentText = [];

    lines.forEach(line => {
      // Trim each line to remove unnecessary whitespace
      line = line.trim();

      // Skip empty lines
      if (!line) {
        return;
      }

      // Check if the line represents a key (e.g., Up, L2, etc.)
      const keyMatch = line.match(/^[A-Za-z0-9\s-]+$/);
      if (keyMatch) {
        // If we have an existing key, store its data
        if (currentKey !== null) {
          map.set(currentKey, { text: currentText, function: currentFunction });
        }

        // Reset for the new key
        currentKey = keyMatch[0];
        currentText = [];
        currentFunction = null;
        return;
      }

      // Check for '[Edit]' lines, which contain 'Keyboard <key>'
      const editMatch = line.match(/^\[Edit\] (Keyboard .+)$/);
      if (editMatch) {
        // Capture the text (e.g., "Keyboard 3", "Keyboard Esc")
        currentText.push(editMatch[1].trim());
        return;
      }

      // Check for 'Function:' and capture the function
      const functionMatch = line.match(/^Function:\s*(.+)$/);
      if (functionMatch) {
        currentFunction = functionMatch[1].trim();
      }
    });

    // Don't forget to add the last key if we were processing one
    if (currentKey !== null) {
      map.set(currentKey, { text: currentText, function: currentFunction });
    }

    return map;
  }

  addInfo(str) {
    this.str += str + "\n";
  }
}
