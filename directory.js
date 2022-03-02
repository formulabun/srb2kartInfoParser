import { join } from "path";
import _ from 'lodash';

// helper class for file.js

class Directory {
  constructor(path, name) {
    this.fullpath = join(path, name);
    this.children = {};
  }

  get(name) {
    return this.children[name];
  }

  search(regex) {
    const result = [];
    for (const c in this.children) {
      if (this.children.hasOwnProperty(c) && regex.test(c)) {
        result.push(this.children[c]);
      }
    }
    return result;
  }

  allFiles() {
    return _.flattenDeep(this._allFiles());
  }

  _allFiles() {
    const result = [];
    result.push(this.fullpath);
    for (const c in this.children) {
      if(this.children.hasOwnProperty(c)) {
        result.push(this.children[c]._allFiles());
      }
    }
    return result;
  }
}

function empty(path, name) {
  return new Directory(path, name);
}

function root() {
  return empty("", "/");
}

function addSingle(dir, name) {
  dir.children[name] = dir.children[name] || empty(dir.fullpath, name);
  return dir.get(name);
}

function addPath(dir, path) {
  let d = dir;
  path.split("/").forEach((name) => d = addSingle(d, name));
}

export {
  root, empty, addSingle, addPath,
};
