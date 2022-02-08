import {open} from 'fs/promises';

async function _getHeader(filehandle) {
  const buffer = Buffer.alloc(12);
  await filehandle.read(buffer, 0, 12, 0);
  return {
    identification: buffer.toString('utf8', 0, 4),
    numlumps: buffer.readUInt32LE(4),
    infotableofs: buffer.readUInt32LE(8),
  };
}

export async function getHeader(filename) {
  const file = await open(filename);
  return await _getHeader(file);
}

async function _getDirectory(filehandle) {
  const lumpTypeSize = 16;
  const header = await _getHeader(filehandle);
  const buffer = Buffer.alloc(header.numlumps * lumpTypeSize);
  await filehandle.read(buffer, 0, header.numlumps * lumpTypeSize, header.infotableofs);
  const result = new Array(header.numlumps);
  let filelump;
  for(let i = 0, j = 0; i < header.numlumps * lumpTypeSize; i += lumpTypeSize, j++) {
    filelump = {};
    filelump.filepos = buffer.readUInt32LE(i);
    filelump.size = buffer.readUInt32LE(i+4);
    filelump.name = buffer.toString('utf8', i+8, i+16).replace(/\x00+/, '');
    result[j] = filelump;
  }
  return result;
}

export async function getDirectory(filename) {
  const file = await open(filename);
  return await _getDirectory(file);
}

async function _getLump(filehandle, lumpname) {
  const directory = await _getDirectory(filehandle);
  const lumpdata = directory.filter(e => e.name === lumpname);
  if (lumpdata.length !== 1) throw "Lump is not found, or not unique";
  const buffer = Buffer.alloc(lumpdata[0].size);
  await filehandle.read(buffer, 0, lumpdata[0].size, lumpdata[0].filepos);
  return buffer;
}

export async function getLump(filename, lumpname) {
  const file = await open(filename);
  return await _getLump(file, lumpname);
}
