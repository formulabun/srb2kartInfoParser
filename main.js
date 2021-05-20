const dgram = require('dgram');

const parseServerInfo = (msg) => {
  const res = {};
  var offset = 0;
  // header
  const header = {};
  header.checksum = msg.slice(offset, offset+4); offset += 4;
  header.ack = msg.slice(offset, ++offset);
  header.ackret = msg.slice(offset, ++offset);
  header.packettype = msg.slice(offset, ++offset)
  msg.slice(offset, ++offset);
  res.header = header;

  // important data
  res._255 = msg.readInt8(offset++);
  res.packetversion = msg.readInt8(offset++);
  res.application = msg.toString('utf-8', offset, offset+16); offset += 16;
  res.version = msg.readInt8(offset++);
  res.subversion = msg.readInt8(offset++);
  res.numberofplayers = msg.readInt8(offset++);
  res.maxplayers = msg.readInt8(offset++);
  res.gametype = msg.readInt8(offset++);
  res.modifiedgame = msg.readInt8(offset++);
  res.cheatsenabled = msg.readInt8(offset++);
  res.kartvars = msg.readInt8(offset++);
  res.fileneedednum = msg.readInt8(offset++);
  res.time = msg.readInt32LE(offset); offset+= 4;
  res.leveltime = msg.readInt32LE(offset); offset+= 4;
  res.servername = msg.toString('utf-8', offset, offset+32); offset += 32;
  res.mapname = msg.toString('utf-8', offset, offset+8); offset += 8;
  res.maptitle = msg.toString('utf-8', offset, offset+33); offset += 33;
  res.mapmd5 = msg.slice(offset, offset+16); offset += 16;
  res.actnum = msg.readInt8(offset++);
  res.iszon = msg.readInt8(offset++);
  res.httpsource = msg.toString('utf-8', offset, offset+256); offset+=256;
  res.fileneeded = msg.slice(offset, offset+915); offset+=915;

  return res;
}

const parsePlayerInfo = (msg) => {
  const res = {};
  // TODO everything
  return res;
}

const getSrb2Info = (address, port=5029, servercb, playercb) => {
  const sock = dgram.createSocket('udp4');
  var respGot = 0;

  sock.on('connect', () => {
    const buf = Buffer.from([0x58, 0x46, 0x23, 0x01, 0x00, 0x00, 0x0C, 0x00, 0x01, 0x1f, 0x02, 0x00, 0x00]);
    sock.send(buf);
  });

  sock.on('error', () => {
    sock.close();
  });

  sock.on('message', (msg, rinfo) => {
    respGot++;

    const type = msg[6]
    if( type === 0x0D ) {
      servercb(parseServerInfo(msg));
    }
    if( type === 0x0E ) {
      playercb(parsePlayerInfo(msg));
    }
    if(respGot === 2) {
      sock.close();
    }

  });
  sock.connect(port, address);
}

if(!module.parent)  {
  getSrb2Info("formulabun.club", 5029, console.log, console.log);
}
