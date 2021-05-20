#!/usr/bin/env node
const dgram = require('dgram');


const parseServerInfo = (msg) => {
  return {};
}

const parsePlayerInfo = (msg) => {
  return {};
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

getSrb2Info("formulabun.club", 5029, console.log, console.log);
