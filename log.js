import { open } from "fs/promises";
import { EventEmitter } from "events";
import { watchFile } from "fs";

let emitter;

const gamestate = {
  players: [...Array(16)].map(() => new Object()), // eslint-disable-line no-new-object
};

const startsWith = (character) => (func) => (line) => (line[0] !== character ? false : func(line));

const parsers = [
  startsWith("*")((line) => {
    const regex = /^\*(Player \d+) has joined the game \(node (\d+)\) \((.*)\)$/i;
    const match = line.match(regex);
    if (!match) return false;
    const node = parseInt(match[2], 10);
    gamestate.players[node] = { name: match[1], ip: match[3], node };
    return {
      e: "playerJoin",
      o: gamestate.players[node],
    };
  }),
  startsWith("*")((line) => {
    if (line.search("renamed to") === -1) return false;
    const [player] = gamestate.players.filter((p) => line.startsWith(p.name, 1));
    if (!player) return false;
    const { node } = player;
    const oldName = gamestate.players[node].name;
    if (!line.startsWith(" renamed to ", 1 + oldName.length)) return false;
    const newName = line.substring(1 + oldName.length + " renamed to ".length);
    gamestate.players[node].name = newName;
    return {
      e: "playerRename",
      o: {
        oldName,
        newName,
        player: gamestate.players[node],
      },
    };
  }),
  startsWith("*")((line) => {
    if (line.search("left the game") === -1) return false;
    const [player] = gamestate.players.filter((p) => line.startsWith(p.name, 1));
    if (!player) return false;
    const { node } = player;
    gamestate.players[node] = {};
    return {
      e: "playerLeave",
      o: {
        player,
      },
    };
  }),
  startsWith("<")((line) => {
    const [player] = gamestate.players.filter((p) => line.startsWith(p.name, 1));
    if (!player) return false;
    const message = line.substring(1 + player.name.length + 2);
    return {
      e: "playerSay",
      o: {
        player,
        message,
      },
    };
  }),
];

function emitLines(lines) {
  if (lines) {
    lines.split("\n").filter((l) => l).forEach((l) => {
      emitter.emit("line", l);
      parsers.forEach((parser) => {
        const ret = parser(l);
        if (ret) emitter.emit(ret.e, ret.o);
      });
    });
  }
}

function startEmitter(filepath) {
  (async () => {
    let fh = await open(filepath);
    emitLines(await fh.readFile({ encoding: "utf-8" }));

    watchFile(filepath, { interval: 100 }, async (curr, prev) => {
      if (curr.size < prev.size) {
        await fh.close();
        fh = await open(filepath);
      }
      emitLines(await fh.readFile({ encoding: "utf-8" }));
    });
  })();

  return emitter;
}

function logger(file = "~/.srb2kart/log.txt") {
  if (!emitter) {
    emitter = new EventEmitter();
    startEmitter(file);
  }
  return emitter;
}

export default logger;
