import { isWad, getDirectory, getLumps } from './main.js';
import { isPk3, openFile as pk3Open } from './pk3parse.js';


class pk3 {
  constructor(path) {
    this.path = path;
  }

  async loadData() {
    this.data = await pk3Open(this.path);
  }

  getDirectory() {
  }

  getText(file) {
  }

  getImage(file) {
  }

  getImage(file, palette) {
  }

  getSoc(file) {
  }

  getBuffer(file) {
  }
}

class wad {
  constructor(filename) {
  }

  async loadData() {
  }

  getText(file) {
  }

  getImage(file) {
  }

  getImage(file, palette) {
  }
  
  getSoc(file) {
  }
  
  getBuffer(file) {
  }
}

export default async function openFile(filename) {
  if( await isWad(filename)) return new wad(filename);
  if( await isPk3(filename)) return new pk3(filename);
  throw "Not a wad or pk3.";
}
