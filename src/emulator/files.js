import {
  LOG,
} from '@webrcade/app-common';

export class FileTracker {
  BACKUP_DIR = "/__BACKUP__";
  CONTENT_DIR = "/content"

  constructor(emu) {
    this.emu = emu;
    this.deletedPaths = {}
    this.pendingPaths = {}
  }

  getDeletedPaths() {
    return this.deletedPaths;
  }

  setDeletedPaths(paths) {
    this.deletedPaths = paths;
  }

  createDirectories(FS, path) {
    this.emu.createDirectories(FS, path);
  }

  syncToBackup(FS) {
    // Copy files
    for (const srcPath in this.pendingPaths) {
      const destPath = this.BACKUP_DIR + "/" + srcPath;

      const destDir = destPath.substring(0, destPath.lastIndexOf('/'));
      this.createDirectories(FS, destDir);

      try {
        const fullPath = this.CONTENT_DIR + "/" + srcPath;
        const content = FS.readFile(fullPath);
        FS.writeFile(destPath, content);
        console.log(`Copied ${srcPath} to ${destPath}`);
      } catch (error) {
        console.error(`Error copying ${srcPath} to ${destPath}:`, error);
      }
    }

    // Delete files
    for (const delPath in this.deletedPaths) {
      const path = this.BACKUP_DIR + "/" + delPath;
      try {
        FS.unlink(path);
      } catch (e) {
        //console.error(`Error deleting ${path}:`, e.message);
      }
    }

    // Reset pending paths
    this.pendingPaths = {}
  }

  syncFromBackup(FS) {
    const walkFiles = (path) => {
      const dir = FS.readdir(path);
      dir.forEach(entry => {
          const fullPath = path + '/' + entry;
          if (entry === '.' || entry === '..') return;
          const stat = FS.stat(fullPath);
          const isDirectory = (stat.mode & 0o40000) !== 0; // Check if it's a directory
          const isFile = (stat.mode & 0o100000) !== 0; // Check if it's a regular file
          if (isDirectory) {
              walkFiles(fullPath);
          } else if (isFile) {
              const s = FS.readFile(fullPath);
              if (s) {
                const outPath = this.CONTENT_DIR + fullPath.substring(this.BACKUP_DIR.length);
                const destDir = outPath.substring(0, outPath.lastIndexOf('/'));
                this.createDirectories(FS, destDir);
                console.log("Writing file: " + outPath);
                FS.writeFile(outPath, s);
              }
          }
      });
    }
    walkFiles(this.BACKUP_DIR);

    // Delete files
    for (const path in this.deletedPaths) {
      const fullPath = this.CONTENT_DIR + "/" + path;
      try {
        FS.unlink(fullPath);
      } catch (e) {
        //LOG.error(`Error deleting file ${fullPath}: ${e}`);
      }
    }
  }

  normalizePath(path) {
    return path.replace(/\\/g, '/');
  }

  removeFromDeleted(path) {
    path = this.normalizePath(path);
    if (this.deletedPaths.hasOwnProperty(path)) {
      delete this.deletedPaths[path];
    }
  }

  removeFromPending(path) {
    path = this.normalizePath(path);
    if (this.pendingPaths.hasOwnProperty(path)) {
      delete this.pendingPaths[path];
    }
  }

  onFileModified(path) {
    path = this.normalizePath(path);
    console.log("File modified: " + path);
    this.pendingPaths[path] = true;
    this.removeFromDeleted(path);
  }

  onFileRenamed(oldPath, newPath) {
    oldPath = this.normalizePath(oldPath);
    newPath = this.normalizePath(newPath);
    console.log("File renamed: " + oldPath + " = " + newPath);
    this.deletedPaths[oldPath] = true;
    this.pendingPaths[newPath] = true;
    this.removeFromDeleted(newPath);
    this.removeFromPending(oldPath);
  }

  onFileDeleted(path) {
    console.log("File deleted: " + path);
    this.deletedPaths[path] = true;
    this.removeFromPending(path);
  }
}
