import {
  getHeader,
  getDirectory,
  getLump
} from "../wadparse.js";

import {expect} from 'chai';

describe("wadparse", function () {
  const akiwad = "./test/wads/KC_AkiIzayoi_v1.2.wad";
  describe("#getHeader", function () {
    it("doesn't crash", function() {
      return getHeader(akiwad);
    });
    it("gives the correct result", function(done) {
      getHeader(akiwad).then(header => {
        expect(header).to.be.ok;
        expect(header.identification).to.equal("PWAD");
        expect(header.numlumps).to.equal(102);
        expect(header.infotableofs).to.be.ok; // I don't want to check this by hand
        done();
      }).catch(done);
    });
  })

  describe("#getDirectory", function () {
    it("doesnt't crash and returns something", function(done) {
      getDirectory(akiwad).then(res => {
        expect(res).to.be.ok;
        done();
      }).catch(done);
    });
  });

  describe("#getLump", function() {
    it("doesn't crash and returns somethig", function(done) {
      getLump(akiwad, "S_SKIN").then(res => {
        expect(res).to.be.ok;
        done();
      }).catch(done);
    });
  });
});
