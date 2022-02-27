import { expect } from "chai";
import { root, empty, addSingle, addPath } from "../directory.js";

describe("directory", function () {
  describe("#root", function () {
    it("works", function () {
      const a = root();
      expect(a).to.be.ok;
      expect(a.fullpath).to.equal("/");
      expect(a.get("something")).to.not.be.ok;
    });
  });

  describe("#empty", function () {
    it("works", function () {
      const a = root();
      const b = empty(a.fullpath, "dirA");
      expect(b).to.be.ok;
      expect(b.fullpath).to.equal("/dirA");
    });
  });

  describe("#addSingle", function () {
    it("works", function () {
      const a = root();
      addSingle(a, "dirB");
      expect(a.get("dirB")).to.be.ok;
    });

    it("doesn't overwrite", function () {
      const a = root();
      addSingle(addSingle(a, "dirA"), "dirB");
      addSingle(a, "dirA");
      expect(a.get("dirA").get("dirB")).to.be.ok;
    });
  });

  describe("#addPath", function () {
    it("works", function () {
      const a = root();
      addPath(a, "a/b/c");
      expect(a.get("a")).to.be.ok;
      expect(a.get("a").get("b")).to.be.ok;
      expect(a.get("a").get("b").get("c")).to.be.ok;
    });
  });

  describe("#search", function () {
    it("works", function () {
      const a = root();
      addPath(a, "spam");
      addPath(a, "bar");
      addPath(a, "foo");
      expect(a.search(/sp../)[0].fullpath).to.equal("/spam");
    });

    it("works for multiple matches", function () {
      const a = root();
      addPath(a, "foobar");
      addPath(a, "foospam");
      addPath(a, "foospambar");
      expect(a.search(/^foo.*/)).to.have.lengthOf(3);
    });
  });
});
