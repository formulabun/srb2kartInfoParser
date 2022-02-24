import {basename} from 'path';

import { isWad, getDirectory, getLumps } from './main.js';
import { isPk3, openFile as pk3Open } from './pk3parse.js';
import { root, addPath } from './directory.js';
import parseSocFile from './socparse.js';
import convertGraphic from './graphicsconvert.js';

export class Pk3 {
  constructor(path) {
    this.path = path;
  }

  async loadData() {
    this.data = await pk3Open(this.path);
  }

  getDirectory() {
    if(this.directory) return this.directory;
    this.directory = empty();
    this.data.forEach((relPath, file) => {
      addPath(this.directory, relPath);
    });
    return this.directory;
  }

  getText(file) {
    return this.data.file(file).async("string");
  }

  getImage(file) {
    const base = basename(file);
    if( /MAP..P/i.test(base) ) {
    }
  }

  getImage(file, palette) {
    return this.data.file(file).async("nodebuffer").then(content => graphicsconvert(content, palette));
  }

  getSoc(file) {
    return this.data.file(file).async("string").then(content => parseSocFile(basename(this.path), content, {}));
  }

  getAllSocs() {
    let fullSoc = {};
    const socs = [];
    this.data.folder("SOC").forEach((path, file) => socs.push(file.async("string")));
    return Promise.all(socs).then(socfiles => 
      socfiles.forEach(socfile => parseSocFile(basename(this.path), socfile, fullSoc))
    ).then(() => fullSoc);
  }

  getBuffer(file) {
    return this.data.file(file).async("nodebuffer");
  }
}

export class wad {
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
  if( await isPk3(filename)) return new Pk3(filename);
  throw "Not a wad or pk3.";
}
