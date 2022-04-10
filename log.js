import { open } from "fs/promises";
import { EventEmitter } from "events";
import { watchFile, unwatchFile } from "fs";

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

    this.filepath = filepath;


    (async () => {
      try {
        this.fh = await open(filepath);
        watchFile(filepath, { interval: 100 }, async (curr, prev) => {
          if (prev.size > curr.size) {
            console.log("closing and reopening");
            await this.fh.close();
            this.fh = await open(filepath);
          }
          this.emitLines(await this.fh.readFile({ encoding: "utf-8" }));
        });
        this.emitLines(await this.fh.readFile({ encoding: "utf-8" }));
      } catch(e) {
        // because it's not thrown otherwise
        console.error(e);
      }
    })();

    this.parsers = [
      this.playerJoin,
      this.playerRename,
      this.playerLeave,
      this.playerSay,
      this.newMap,
      this.command,
      this.playerFinish,
      this.ttyShutdown,
      this.speedingOffTo,
      this.roundEnd,
      this.playerVoteCalled,
      this.playerVote,
      this.voteComplete,
      this.logStreamEnd,
      this.gameLoopEnter,
      this.pwadNotFoundOrInvalid
    ];

    this.parsersState = {};
  }

  stop() {
    this.fh.close();
    unwatchFile(this.filepath);
  }

  set gamestate(state) { this._gamestate = state; }
  get players() { return this.players; }

  emitLines(lines) {
    if (lines) {
      lines.split("\n").filter((l) => l).forEach((l) => {
        this.emit("line", {l});
        this.parsers.forEach((parser) => {
          const ret = parser(l);
          if (ret) this.emit(ret.e, ret.o);
        });
        this.emit("parsers called");
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

  playerVoteCalled = startsWith("*")((line) => {
    const player = this._gamestate.players.filter((p) => line.startsWith(p.name, 1)).reduce(longestNameReducer, false);
    if (!player) return false;
    const check = line.substr(1 + player.name.length, " called a vote to ".length);
    if (check !== " called a vote to ") return false;
    const begin = line.substr(1 + player.name.length + " called a vote to ".length);
    const command = begin.substr(0, begin.indexOf("."));
    this.parsersState.vote = {
      callee: player,
      command,
      voteResults: this._gamestate.players.map(p => {return p || {p, choice: -1}})
    };
    return {
      e: "playerVoteCalled",
      o: {
        player, command
      }};
  })

  playerVote = ((line) => {
    if(!this.parsersState.vote) return false;
    const player = this._gamestate.players.filter((p) => line.startsWith(p.name)).reduce(longestNameReducer, false);
    if(!player) return false;
    const choice = parseInt(line.substr(player.name.length + " voted ".length));
    if(!choice) return false;
    this.parsersState.vote.voteResults[player.node] = {player, choice};
    return {
      e: "playerVote",
      o: {
        player,
        choice,
        vote: {
          ...this.parsersState.vote,
          votedYes: this.parsersState.vote.voteResults.filter(o => o.choice === 1).map(o => o.p),
          votedNo: this.parsersState.vote.voteResults.filter(o => o.choice === -1).map(o => o.p),
        }
      }
    };
  })

  voteComplete = startsWith("*")((line) => {
    if(!this.parsersState.vote)
      return false;
    const voteSuccess = line.startsWith("*Vote passed!");
    const voteFailed = line.startsWith("*Vote failed.");
    if(! (voteSuccess || voteFailed)) return false
    const vote = this.parsersState.vote;
    this.parsersState.vote = {};
    return {
      e: "voteComplete",
      o: {
        passed: voteSuccess && !voteFailed,
        vote: {
          ...vote,
          votedYes: vote.voteResults.filter(o => o.choice === 1).map(o => o.p),
          votedNo: vote.voteResults.filter(o => o.choice === -1).map(o => o.p),
        }
      }
    };
  })

  gameLoopEnter = exactMatch('Entering main game loop...', 'gameLoopEnter')
  ttyShutdown = exactMatch('Shutdown tty console', 'ttyShutdown', () => {
    this._gamestate.players = this._gamestate.players.map(() => ({}));
  })

  speedingOffTo = exactMatch('Speeding of to level...', 'speedingOffTo')
  roundEnd = exactMatch('The round has ended.', 'roundEnd')

  logStreamEnd = exactMatch('I_ShutdownSystem(): end of logstream.', 'logStreamEnd')


  pwadNotFoundOrInvalid = exactMatch('A PWAD file was not found or not valid.', 'pwadNotFoundOrInvalid');

}


// map of logfiles
let s2kloggers = new Map();
function logger(file) {
  if (s2kloggers.has(file)) {
    return s2kloggers.get(file);
  }
  return s2kloggers.set(file, new Srb2KartLogEmitter(file)).get(file);
}


export default logger;
