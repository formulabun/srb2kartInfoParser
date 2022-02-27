import { open } from "fs/promises";

async function _getHeader(filehandle) {
  const buffer = Buffer.alloc(12);
  await filehandle.read(buffer, 0, 12, 0);
  return {
    identification: buffer.toString("utf8", 0, 4),
    numlumps: buffer.readUInt32LE(4),
    infotableofs: buffer.readUInt32LE(8),
  };
}

async function getHeader(filename) {
  const file = await open(filename);
  const header = await _getHeader(file);
  file.close();
  return header;
}

async function isWad(filename) {
  const header = await getHeader(filename);
  return header.identification === "IWAD" || header.identification === "PWAD";
}

async function _getDirectory(filehandle) {
  const lumpTypeSize = 16;
  const header = await _getHeader(filehandle);
  const buffer = Buffer.alloc(header.numlumps * lumpTypeSize);
  await filehandle.read(buffer, 0, header.numlumps * lumpTypeSize, header.infotableofs);
  const result = new Array(header.numlumps);
  let filelump;
  for (let i = 0, j = 0; i < header.numlumps * lumpTypeSize; i += lumpTypeSize, j++) {
    filelump = {};
    filelump.filepos = buffer.readUInt32LE(i);
    filelump.size = buffer.readUInt32LE(i + 4);
    filelump.name = buffer.toString("utf8", i + 8, i + 16).replace(/\x00+/, "");
    result[j] = filelump;
  }
  return result;
}

async function getDirectory(filename) {
  const file = await open(filename);
  const directory = await _getDirectory(file);
  file.close();
  return directory;
}

async function _getLumps(filehandle, lumpname) {
  const directory = await _getDirectory(filehandle);
  const lumpdata = directory.filter((e) => e.name === lumpname);
  if (lumpdata.length === 0) throw `Lump ${lumpname} is not found`;
  return await Promise.all(lumpdata.map((lump) => {
    const buffer = Buffer.alloc(lump.size);
    return filehandle.read(buffer, 0, lump.size, lump.filepos).then(() => buffer);
  }));
}

async function getLumps(filename, lumpname) {
  const file = await open(filename);
  const lumps = await _getLumps(file, lumpname);
  file.close();
  return lumps;
}

export {
  getHeader, isWad, getDirectory, getLumps,
};
