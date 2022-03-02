import { getHeader, getDirectory, getLumps } from "../main.js";
import { isWad } from "../wadparse.js";

import { expect } from "chai";

describe("wadparse", function () {
  const akiwad = "./test/wads/KC_AkiIzayoi_v1.2.wad";
  const chars_kart = "./test/wads/chars.kart";
  const apk3 = "./test/pk3s/KRB_IP-v2.1.pk3";
  describe("#iswad", function () {
    it("is true for a wad", function (done) {
      isWad(akiwad)
        .then((res) => {
          expect(res).to.be.true;
          done();
        })
        .catch(done);
    });

    it("is false for a pk3", function (done) {
      isWad(apk3)
        .then((res) => {
          expect(res).to.be.false;
          done();
        })
        .catch(done);
    });
  });
  describe("#getHeader", function () {
    it("doesn't crash", function () {
      return getHeader(akiwad);
    });
    it("gives the correct result", function (done) {
      getHeader(akiwad)
        .then((header) => {
          expect(header).to.be.ok;
          expect(header.identification).to.equal("PWAD");
          expect(header.numlumps).to.equal(102);
          expect(header.infotableofs).to.be.ok; // I don't want to check this by hand
          done();
        })
        .catch(done);
    });
  });

  describe("#getDirectory", function () {
    it("doesnt't crash and returns something", function (done) {
      getDirectory(akiwad)
        .then((res) => {
          expect(res).to.be.ok;
          done();
        })
        .catch(done);
    });
  });

  describe("#getLumps", function () {
    it("doesn't crash and returns somethig", function (done) {
      getLumps(akiwad, "S_SKIN")
        .then((res) => {
          expect(res).to.be.ok;
          done();
        })
        .catch(done);
    });

    it("returns all the files if multiple", function (done) {
      getLumps(chars_kart, "S_SKIN")
        .then((res) => {
          expect(res).to.be.ok;
          expect(res).to.have.lengthOf(4);
          done();
        })
        .catch(done);
    });
  });
});
