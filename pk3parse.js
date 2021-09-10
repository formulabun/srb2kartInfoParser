import JSZip from 'jszip';
import fs from 'fs';
import parseSocFile from "./socparse.js";

function extractSoc(filename, socs={}) {
  new Promise((resolve, reject) => {
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
  }).then(zip => {
    const socdir = zip.folder(/soc/i)[0].name
    const socfiles = Promise.all(zip.folder(socdir).file(/.*/).map(e => e.async('string')));
    return Promise.all([socfiles, zip]);
  }).catch(e => {
    console.error('error:', e);
    console.error('there might be something wrong with the file contents.');
  }).then(([socfiles, zip]) =>  {
    socfiles.forEach(file => {
      socs = parseSocFile(file, socs);
    })
    return socs;
  })
}

export default extractSoc;
