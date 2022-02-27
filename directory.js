import {join} from 'path';

// some helper functions for file.js
function empty(path, name) {
  return {
    fullpath: join(path, name),
    children: {},
    get: function(name) {
      return this.children[name];
    },
    search: function(regex) {
      const result = [];
      for( let c in this.children) {
        if( this.children.hasOwnProperty(c) && regex.test(c)) {
          result.push(this.children[c]);
        }
      }
      return result;
    }
  }
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
  path.split('/').forEach(name => d = addSingle(d, name));
}

export {root, empty, addSingle, addPath};
