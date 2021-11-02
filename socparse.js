function maybeParseBool(string) {
  if (string.toLowerCase() === "true") return true;
  if (string.toLowerCase() === "false") return false;
  const maybeInt = parseInt(string, 10);
  if (!Number.isNaN(maybeInt)) return maybeInt;
  return string;
}

function parseSocFile(filename, lines, socs = {}) {
  let type = "";
  let name = "";
  const result = socs;
  lines
    .split(/\r?\n/)
    .filter((l) => l.indexOf("#") !== 0)
    .forEach((line) => {
      if (line.length === 0) {
        type = "";
        name = "";
        return;
      }
      if (type.toLowerCase() === "freeslot") return;
      const lower = line.toLowerCase();
      if (lower.startsWith("level ") || lower.startsWith("object ") || lower.startsWith("state ")) {
        [type, name] = line.toLowerCase().split(" ").filter((w) => w.length);
        if (type.toLowerCase() === "level" && name.length !== 2) name = `0${name}`;
        if (!result[type]) result[type] = {};
        if (!result[type][name]) result[type][name] = {};
        if (!result[type][name].mappack) result[type][name].mappack = filename;
        return;
      }

      if (type.length === 0) return;

      let [k, v] = line.split("=").map((w) => w.trim()); // eslint-disable-line prefer-const
      // I hate doing this
      switch (k?.toLowerCase()) {
      case "hidden":
        v = maybeParseBool(v);
        break;
      case "numlaps":
        v = parseInt(v, 10);
        break;
      case "typeoflevel":
        [v] = v.split(",");
        v = v.toLowerCase();
        if (v === "match") v = "battle";
        break;
      default:
      }
      result[type][name][k.toLowerCase()] = v;
    });

  return result;
}

export default parseSocFile;
