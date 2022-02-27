import {basename} from 'path';

import { isWad, getDirectory, getLumps } from './wadparse.js';
import { isPk3, openFile as pk3Open } from './pk3parse.js';
import { root, empty, addSingle, addPath } from './directory.js';
import parseSocFile from './socparse.js';
import convertGraphic from './graphicsconvert.js';

const notImplementedError = Error("Not (yet) implemented.")

function combineSocs(filename, socs) {
  let resSoc = {};
  socs.forEach(socfile => {
    resSoc = parseSocFile(filename, socfile, resSoc)
  });
  return resSoc;
}

class Srb2kfile {
  constructor(path) {
    this.path = path;
  }

  async setBaseFile(filepath) {
    const srb2pk3 = await openFile(filepath)
    await srb2pk3.loadData()
    this.PLAYPAL = await srb2pk3.getBuffer("PLAYPAL")
  }

  loadData() {
    console.log("data")
    throw notImplementedError
  }

  getDirectory() {
    console.log("directory")
    throw notImplementedError;
  }

  getText() {
    console.log("text")
    throw notImplementedError;
  }

  async getImage(file) {
    const base = basename(file);
    const dir = this.getDirectory();
    if( /^MAP..P.*/i.test(base) ) {
      const mapid = base.substr(3,2).toLowerCase();
      const soc = await this.getAllSocs();
      const paletteId = soc.level[mapid].palette;
      let palette, palettePath;
      if(paletteId) {
        palettePath = this.findPalette(paletteId);
      }
      if(palettePath) {
        palette = await this.getBuffer(palettePath);
      } else {
        if( ! this.PLAYPAL) throw "Missing basefile."
        palette = this.PLAYPAL;
      }
      return this.getImageWithPalette(file, palette)
    }
  }
  getImageWithPalette(file, palette) {
    return this.getBuffer(file).then(content => convertGraphic(content, palette));
  }
  getSoc(file) {
    return this.data.getText(file).then(content => parseSocFile(basename(this.path), content, {}));
  }
  getAllSocs() {
    console.log("all socs")
    throw notImplementedError;
  }
  findPalette(paletteId) {
    console.log("palette")
    throw notImplementedError;
  }
  getBuffer() {
    console.log("buffer")
    throw notImplementedError;
  }
}

export class Pk3 extends Srb2kfile {

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

  getText(filepath) {
    return this.data.file(filepath).async("string");
  }


  getAllSocs() {
    let fullSoc = {};
    const socs = [];
    const socfolder = this.data.folder(/soc/i)[0].name;
    this.data.folder(socfolder).forEach((path, file) => socs.push(file.async("string")));
    return Promise.all(socs).then(socfiles => combineSocs(basename(this.path), socfiles));
  }

  findPalette(paletteId) {
    return this.directory.search(/palettes/i)[0].search(new RegExp(`^PAL${paletteId}\.pal$`))[0].fullpath;
  }

  getBuffer(file) {
    return this.data.file(file.substr(file[0] === "/" ? 1 : 0)).async("nodebuffer");
  }
}

export class Wad extends Srb2kfile {

  async loadData() {
    this.directory = empty("", "");
    const dir = await getDirectory(this.path);
    dir.forEach(file => {
      addSingle(this.directory, file.name);
    });
    return this;
  }

  getDirectory() {
    return this.directory;
  }

  getText(filepath) {
    return this.getBuffer(filepath).then(lump => lump.toString('utf-8'));
  }

  async getSoc(file) {
    const socText = await this.getText(file)
    const soc = parseSocFile(basename(this.path), socText, {});
    return soc
  }

  async getAllSocs() {
    const socfiles = [...this.directory.search(/MAINCFG/), ...this.directory.search(/^SOC_/i)].map(f => f.fullpath)

    const socs =  await Promise.all(socfiles.map(file => this.getText(file)));
    const res = combineSocs(basename(this.path), socs);
    return res;
  }

  
  findPalette(paletteId) {
    return this.directory.search(new RegExp(`PAL${paletteId}(\.pal)?$`)).fullpath;
  }

  getBuffer(file) {
    console.log(file);
    return this.getBuffers(file).then(bs => bs[0]);
  }

  getBuffers(file) {
    return getLumps(this.path, file);
  }
}

export default async function openFile(filename) {
  if( await isWad(filename)) return new Wad(filename).loadData();
  if( await isPk3(filename)) return new Pk3(filename).loadData();
  throw "Not a wad or pk3.";
}
