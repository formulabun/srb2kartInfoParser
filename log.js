import { open } from "fs/promises";
import { EventEmitter } from "events";
import { watchFile } from "fs";

// couple of helper function
const startsWith = (character) => (func) => (line) => (line[0] !== character ? false : func(line));

const exactMatch = (linematch, eventname, onsucces = Function.prototype) => (line) => {
  if(linematch === line) {
    onsucces();
    return {e:eventname};
  } else
    return false;
}

const longestNameReducer = (longest, newest) =>  !longest || (newest.name.length > longest.name.length) ? newest : longest;


// event emitter class
class Srb2KartLogEmitter extends EventEmitter {
  constructor(filepath) {
    super();
    this._gamestate = {
      players: [...Array(16)].map(() => new Object()), // eslint-disable-line no-new-object
    };

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

    this.parsers = [
      this.playerJoin,
      this.playerRename,
      this.playerLeave,
      this.playerSay,
      this.newMap,
      this.command,
      this.playerFinish,
      this.serverStart,
      this.serverStop,
      this.speedingOffTo,
      this.roundEnd,
    ];
  }

  set gamestate(state) { this._gamestate = state; }
  get players() { return this.players; }

  emitLines(lines) {
    if (lines) {
      lines.split("\n").filter((l) => l).forEach((l) => {
        this.emit("line", l);
        this.parsers.forEach((parser) => {
          const ret = parser(l);
          if (ret) this.emit(ret.e, ret.o);
        });
      });
    }
  }
  // bunch of parsers
  playerJoin = startsWith("*")((line) => {
    const regex = /^\*(Player \d+) has joined the game \(node (\d+)\) \((.*)\)$/i;
    const match = line.match(regex);
    if (!match) return false;
    const node = parseInt(match[2], 10);
    this._gamestate.players[node] = { name: match[1], ip: match[3], node };
    return {
      e: "playerJoin",
      o: this._gamestate.players[node],
    };
  })
  playerRename = startsWith("*")((line) => {
    if (line.search("renamed to") === -1) return false;
    const player = this._gamestate.players.filter((p) => line.startsWith(p.name, 1)).reduce(longestNameReducer, false);
    if (!player) return false;
    const { node } = player;
    const oldName = this._gamestate.players[node].name;
    if (!line.startsWith(" renamed to ", 1 + oldName.length)) return false;
    const newName = line.substring(1 + oldName.length + " renamed to ".length);
    this._gamestate.players[node].name = newName;
    return {
      e: "playerRename",
      o: {
        oldName,
        newName,
        player: this._gamestate.players[node],
      },
    };
  })

  playerLeave = startsWith("*")((line) => {
    if (line.search("left the game") === -1) return false;
    const player = this._gamestate.players.filter((p) => line.startsWith(p.name, 1)).reduce(longestNameReducer, false);
    if (!player) return false;
    const { node } = player;
    this._gamestate.players[node] = {};
    return {
      e: "playerLeave",
      o: player,
    };
  })

  playerSay = startsWith("<")((line) => {
    const player = this._gamestate.players.filter((p) => line.startsWith(p.name, 1)).reduce(longestNameReducer, false);
    if (!player) return false;
    const message = line.substring(1 + player.name.length + 2);
    return {
      e: "playerSay",
      o: {
        player,
        message,
      },
    };
  })

  newMap = ((line) => {
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
  })

  command = startsWith("$")((line) => {
    return {
      e: 'command',
      o: {
        command: line.substr(1)
      }
    }
  })

  playerFinish = ((line) => {
    const player = this._gamestate.players.filter((p) => line.startsWith(p.name)).reduce(longestNameReducer, false); 
    if(!player) return false;
    const { name } = player;
    if(line.substr(name.length) !== "has finished the race.") return false;
    return {
      e: "playerFinish",
      o: player,
    }
  })

  serverStart = exactMatch('Entering main game loop...', 'serverStart')
  serverStop = exactMatch('Shutdown tty console', 'serverStop', () => {
    this._gamestate.players = this._gamestate.players.map(() => ({}));
  })

  speedingOffTo = exactMatch('Speeding of to level...', 'speedingOffTo')
  roundEnd = exactMatch('The round has ended.', 'roundEnd')
}


// singleton
let s2klogger
function logger(file = "~/.srb2kart/log.txt") {
  if (!s2klogger) {
    s2klogger = new Srb2KartLogEmitter(file);
  }
  return s2klogger;
}


export default logger;
