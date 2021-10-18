import JSZip from "jszip";
import fs from "fs";
import { basename } from "path";
import parseSocFile from "./socparse.js";
import convertGraphic from "./graphicsconvert.js";

function openFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  }).catch((e) => {
    throw new Error(`${e}Does the file exist?`);
  }).then(
    JSZip.loadAsync,
  ).catch((e) => {
    throw new Error(`${e}Is this a pk3/zip file?`);
  });
}

function extractGraphics(filename) {
  return openFile(filename).then((zip) => {
    const graphicsdir = zip.folder(/graphics/i)[0].name;
    return Promise.all(
      zip.folder(graphicsdir).file(/.*/).map((e) => e.async("nodebuffer").then((content) => ({ file: e.name, content }))),
    );
  }).then((graphics) => graphics.forEach((g) => {
    const out = fs.createWriteStream(`test/Graphics${g.file}`);
    convertGraphic(g.content).pipe(out);
  }));
}

function extractSoc(filename, socs = {}) {
  return openFile(filename).then((zip) => {
    const socdir = zip.folder(/soc/i)[0].name;
    return Promise.all(zip.folder(socdir).file(/.*/).map((e) => e.async("string")));
  }).catch((e) => {
    throw new Error(`${e} there might be something wrong with the file contents of ${filename}.`);
  }).then((socfiles) => {
    socfiles.forEach((file) => {
      socs = parseSocFile(basename(filename), file, socs); // eslint-disable-line no-param-reassign
    });
    return socs;
  });
}

export { extractGraphics, extractSoc };
