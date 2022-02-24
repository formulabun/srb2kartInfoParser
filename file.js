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

  async setBaseFile(file) {
    const srb2pk3 = await openFile(file)
    await srb2pk3.loadData()
    this.PLAYPAL = await srb2pk3.getBuffer("PLAYPAL")
  }

  async loadData() {
    this.data = await pk3Open(this.path);
    return this;
  }

  getDirectory() {
    if(this.directory) return this.directory;
    this.directory = root();
    this.data.forEach((relPath, file) => {
      addPath(this.directory, relPath);
    });
    return this.directory;
  }

  getText(file) {
    return this.data.file(file).async("string");
  }

  async getImage(file) {
    const base = basename(file);
    const dir = this.getDirectory();
    if( /^MAP..P.*/i.test(base) ) {
      const mapid = base.substr(3,2).toLowerCase();
      const soc = await this.getAllSocs();
      const paletteid = soc.level[mapid].palette;
      let palette;
      if(paletteid) {
        const palettePath = dir.search(/palettes/i)?.search(new RegExp(`^PAL${paletteid}\.pal$`)).fullpath;
        palette = await this.getBuffer(palettePath);
      } else {
        if( ! this.PLAYPAL) throw "Missing basefile."
        palette = this.PLAYPAL;
      }
      return this.getImageWithPalette(file, palette)
    }
  }

  getImageWithPalette(file, palette) {
    return this.data.file(file).async("nodebuffer").then(content => convertGraphic(content, palette));
  }

  getSoc(file) {
    return this.data.file(file).async("string").then(content => parseSocFile(basename(this.path), content, {}));
  }

  getAllSocs() {
    let fullSoc = {};
    const socs = [];
    const socfolder = this.data.folder(/soc/i)[0].name;
    this.data.folder(socfolder).forEach((path, file) => socs.push(file.async("string")));
    return Promise.all(socs).then(socfiles => 
      socfiles.forEach(socfile => parseSocFile(basename(this.path), socfile, fullSoc))
    ).then(() => fullSoc);
  }

  getBuffer(file) {
    return this.data.file(file.substr(file[0] === "/" ? 1 : 0)).async("nodebuffer");
  }
}

export class Wad {
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
  if( await isWad(filename)) return new Wad(filename);
  if( await isPk3(filename)) return new Pk3(filename);
  throw "Not a wad or pk3.";
}
