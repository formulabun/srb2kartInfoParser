import {expect} from 'chai';
import fs from 'fs';

import { openFile } from '../pk3parse.js';

import {
  getLumps,
  convertGraphic
} from '../main.js';

describe("graphics", function() {
  describe("convertGraphic", function() {
    const srb2pk3 = './test/wads/srb2.pk3';
    const mapskart = './test/wads/maps.kart';
    it("works", function(done) {
      getLumps(srb2pk3, "PLAYPAL").then(([pal]) =>
        getLumps(mapskart, "MAP01P").then(([lump]) => {
          expect(pal).to.be.ok;
          expect(lump).to.be.ok;
          const img = convertGraphic(lump, pal);
          expect(img).to.be.ok;
          return fs.writeFile('./test/Graphics/MAP01.png', img.toBuffer('image/png'), done);
        })
      ).catch(done);
    });
  });
});
