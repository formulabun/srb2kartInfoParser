function parseSocFile(filename, lines, socs={}) {

  var type, name, k, v;
  type = name = "";
  lines
    .split(/\r?\n/)
    .filter(l => l.indexOf("#") != 0)
    .forEach(line => {
      if (line.length === 0) {
        type = name = "";
        return;
      }
      if (type.toLowerCase() === "freeslot") return
      const lower = line.toLowerCase();
      if (lower.startsWith("level ") || lower.startsWith("object ") || lower.startsWith("state ")) {
        [type, name] = line.toLowerCase().split(" ").filter(w => w.length);
        if (!socs[type]) socs[type] = {};
        if (!socs[type][name]) socs[type][name] = {};
        if (!socs[type][name].mappack) socs[type][name].mappack = filename;
        return;
      }

      if(type.length === 0) return;

      [k, v] = line.split("=").map(w => w.trim());
      socs[type][name][k.toLowerCase()] = v;
    });
  
  return socs;
}

export default parseSocFile;
