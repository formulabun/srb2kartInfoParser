import JSZip from 'jszip';
import fs from 'fs';
import parseSocFile from "./socparse.js";
import convertGraphic from "./graphicsconvert.js";
import { basename } from 'path';

function openFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  }).catch((e) => {
    console.error("error", e);
    console.error('does the file exist?');
  }).then(
    JSZip.loadAsync
  ).catch(e => {
    console.error('error:', e);
    console.error('is this a pk3/zip file?');
  })
}

function extractGraphics(filename) {
  return openFile(filename
  ).then(zip => {
    const graphicsdir = zip.folder(/graphics/i)[0].name;
    return Promise.all(
      zip.folder(graphicsdir).file(/.*/).map(e => 
        e.async('nodebuffer').then(content => ({file:e.name, content}))
      ));
  }).then(graphics => {
    return graphics.forEach(g => {
      const out = fs.createWriteStream("test/Graphics" + g.file);
      convertGraphic(g.content).pipe(out);
      out.on('finish', () => console.log(`written ${g.file}`));
    });
  })
}

function extractSoc(filename, socs={}) {
  return openFile(filename
  ).then(zip => {
    const socdir = zip.folder(/soc/i)[0].name
    return Promise.all(zip.folder(socdir).file(/.*/).map(e => e.async('string')));
  }).catch(e => {
    console.error('error:', e);
    console.error(`there might be something wrong with the file contents of ${filename}.`);
  }).then((socfiles) =>  {
    socfiles.forEach(file => {
      socs = parseSocFile(basename(filename), file, socs);
    })
    return socs;
  })
}

export {extractGraphics, extractSoc};
