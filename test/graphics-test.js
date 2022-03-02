import { expect } from "chai";
import fs from "fs";

import { openFile } from "../pk3parse.js";

import { getLumps } from "../main.js";
import convertGraphic from "../graphicsconvert.js";

describe("graphics", function () {
  describe("convertGraphic", function () {
    const srb2pk3 = "./test/wads/srb2.pk3";
    const mapskart = "./test/wads/maps.kart";
    it("works", function (done) {
      getLumps(srb2pk3, "PLAYPAL")
        .then(([pal]) =>
          getLumps(mapskart, "MAP01P").then(([lump]) => {
            expect(pal).to.be.ok;
            expect(lump).to.be.ok;
            const imgstream = convertGraphic(lump, pal);
            expect(imgstream).to.be.ok;
            const filestream = fs.createWriteStream('./test/Graphics/MAP01.png');
            imgstream.pipe(filestream);
            filestream.on('finish', done);
          })
        )
        .catch(done);
    });
  });
});
