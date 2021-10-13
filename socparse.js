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
      if (v?.toLowerCase() === "true") v = true;
      else if (v?.toLowerCase() === "false") v = false;
      else if (k?.toLowerCase() === "numlaps") v = parseInt(v, 10);
      result[type][name][k.toLowerCase()] = v;
    });

  return result;
}

export default parseSocFile;
