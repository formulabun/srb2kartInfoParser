import { open } from "fs/promises";
import { EventEmitter } from "events";
import { watchFile } from "fs";


const gamestate = {
  players: [...Array(16)].map(() => new Object()), // eslint-disable-line no-new-object
};

const startsWith = (character) => (func) => (line) => (line[0] !== character ? false : func(line));

const exactMatch = (linematch, eventname, onsucces = Function.prototype) => (line) => {
  if(linematch === line) {
    onsucces();
    return {e:eventname};
  } else
    return false;
}

const longestNameReducer = (longest, newest) =>  !longest || (newest.name.length > longest.name.length) ? newest : longest;

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
    const player = gamestate.players.filter((p) => line.startsWith(p.name, 1)).reduce(longestNameReducer, false);
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
    const player = gamestate.players.filter((p) => line.startsWith(p.name, 1)).reduce(longestNameReducer, false);
    if (!player) return false;
    const { node } = player;
    gamestate.players[node] = {};
    return {
      e: "playerLeave",
      o: player,
    };
  }),
  startsWith("<")((line) => {
    const player = gamestate.players.filter((p) => line.startsWith(p.name, 1)).reduce(longestNameReducer, false);
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
  ((line) => {
    if(! line.startsWith("Map is now \""))
      return false;
    const mapid = line.substring("Map is now \"".length, "map is now \"".length + 5);
    const mapname = line.substring("Map is now \"MAP__: ", line.length - 1);
    return {
      e: 'newMap',
      o: {
        mapid,
        mapname
      }
    }
  }),
  startsWith("$")((line) => {
    return {
      e: 'command',
      o: {
        command: line.substr(1)
      }
    }
  }),
  ((line) => {
    const player = gamestate.players.filter((p) => line.startsWith(p.name)).reduce(longestNameReducer, false); 
    if(!player) return false;
    const { name } = player;
    if(line.substr(name.length) !== "has finished the race.") return false;
    return {
      e: "playerFinish",
      o: player,
    }
  }),
  exactMatch('Entering main game loop...', 'serverStart'),
  exactMatch('Shutdown tty console', 'serverStop', () => {
    gamestate.players = gamestate.players.map(() => ({}));
  }),
  exactMatch('Speeding of to level...', 'speedingOffTo'),
  exactMatch('The round has ended.', 'roundEnd'),
];

class Srb2KartLogEmitter extends EventEmitter {
  constructor(filepath) {
    super();
    (async () => {
      let fh = await open(filepath);
      this.emitLines(await fh.readFile({ encoding: "utf-8" }));

      watchFile(filepath, { interval: 100 }, async (curr, prev) => {
        if (curr.size < prev.size) {
          await fh.close();
          fh = await open(filepath);
        }
        this.emitLines(await fh.readFile({ encoding: "utf-8" }));
      });
    })();
  }

  emitLines(lines) {
    if (lines) {
      lines.split("\n").filter((l) => l).forEach((l) => {
        this.emit("line", l);
        parsers.forEach((parser) => {
          const ret = parser(l);
          if (ret) this.emit(ret.e, ret.o);
        });
      });
    }
  }

}

let s2klogger
function logger(file = "~/.srb2kart/log.txt") {
  if (!s2klogger) {
    s2klogger = new Srb2KartLogEmitter(file);
  }
  return s2klogger;
}

export default logger;
