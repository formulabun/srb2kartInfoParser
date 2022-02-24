import {expect} from 'chai';

import {Pk3} from '../file.js';

describe("file.js", function() {
  describe("pk3file", function() {
    const apk3 = "./test/pk3s/KRB_IP-v2.1.pk3";
    describe("#getAllSocs", function() {
      it("works", function(done) {
        const pk3file = new Pk3(apk3);
        pk3file.loadData().then(() => pk3file.getAllSocs().then((socs) => {
          expect(socs.level.s0).to.be.ok; 
          expect(socs.level.s1).to.be.ok; 
          expect(socs.level.s2).to.be.ok; 
          done();
        })).catch(done)
      });
    });
  });
});
