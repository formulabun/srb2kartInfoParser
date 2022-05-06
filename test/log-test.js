import { logger } from "../main.js";

import { expect } from "chai";

describe("logger", function () {
  it("doesn't crash on default file and produces some lines", function () {
    var lines = 0;
    const log = logger("/home/Fl_GUI/.srb2kart/log.txt");
    log.on("line", (l) => (lines = lines + 1));
    return new Promise((res, rej) =>
      log.on("logStreamEnd", () => {
        console.log("finished");
        expect(lines).to.be.at.least(15);
        log.stop();
        res();
      })
    );
  });

  describe("parsers", function () {
    let log;
    before(function () {
      log = logger("/dev/null");
    });

    after(function () {
      log.stop();
    });

    describe("#playerJoin, Rename and Leave", function () {
      it("works", function () {
        const join = log.playerJoin(
          "*Player 2 has joined the game (node 1) (127.0.0.1:41187)"
        );
        const rename = log.playerRename("*Player 2 renamed to Fl_GUI");
        const leave = log.playerLeave("*Fl_GUI left the game");
        expect(join).to.be.ok;
        expect(rename).to.be.ok;
        expect(leave).to.be.ok;
      });
    });

    describe("voting", function () {
      it("works", function () {
        const join = log.playerJoin(
          "*Player 2 has joined the game (node 1) (127.0.0.1:41187)"
        );
        const voteStart = log.playerVoteCalled(
          "*Player 2 called a vote to exitlevel. Vote in chat with y / n."
        );
        const vote = log.playerVote("Player 2 voted  1");
        const voteResult = log.voteComplete("*Vote passed! (1 yes, 0 no)");
        log.playerLeave("*Player 2 left the game");
        expect(voteStart).to.be.ok;
        expect(voteStart.o.player.name).to.equal("Player 2");
        expect(voteStart.o.command).to.equal("exitlevel");
        expect(vote).to.be.ok;
        expect(vote.o.player.name).to.equal("Player 2");
        expect(vote.o.vote.command).to.equal("exitlevel");
        expect(vote.o.choice).to.equal(1);
        expect(voteResult).to.be.ok;
        expect(voteResult.o.vote.command).to.equal("exitlevel");
        expect(voteResult.o.passed).to.be.true;
        expect(voteResult.o.vote.votedYes.length).to.equal(1);
        expect(voteResult.o.vote.votedNo.length).to.equal(0);
      });

      it("works for undecisive players", function () {
        const join = log.playerJoin(
          "*Player 2 has joined the game (node 1) (127.0.0.1:41187)"
        );
        const voteStart = log.playerVoteCalled(
          "*Player 2 called a vote to exitlevel. Vote in chat with y / n."
        );
        const voteYes = log.playerVote("Player 2 voted  1");
        expect(voteYes.o.vote.votedYes.length).to.equal(1);
        expect(voteYes.o.vote.votedNo.length).to.equal(0);

        const voteNo = log.playerVote("Player 2 voted  -1");
        expect(voteNo.o.vote.votedYes.length).to.equal(0);
        expect(voteNo.o.vote.votedNo.length).to.equal(1);

        const voteYesAgain = log.playerVote("Player 2 voted  1");
        const voteResult = log.voteComplete("*Vote passed! (1 yes, 0 no)");
        expect(voteYesAgain.o.vote.votedYes.length).to.equal(1);
        expect(voteYesAgain.o.vote.votedNo.length).to.equal(0);
        log.playerLeave("*Player 2 left the game");
      });
    });
    it("sink", function () {
      const join = log.playerJoin(
        "*Player 2 has joined the game (node 1) (127.0.0.1:41187)"
      );
      const rename = log.playerRename("*Player 2 renamed to Fl_GUI");
      const sink = log.sinkHit("Fl_GUI was hit by a kitchen sink.");
      const leave = log.playerLeave("*Fl_GUI left the game");
      expect(sink.o).to.be.ok;
      expect(sink.o.player).to.be.ok;
      expect(sink.o.player.name).to.equal("Fl_GUI");
    });
  });
});
