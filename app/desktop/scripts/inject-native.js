const fs = require("node:fs");
const path = require("node:path");

const target = path.join(
  __dirname,
  "../dist/linux-unpacked/resources/app.asar.unpacked/node_modules/better-sqlite3/build/Release/better_sqlite3.node"
);

const source = path.join(
  __dirname,
  "../prebuilds/electron-v140-linux-x64/better_sqlite3.node"
);

if (fs.existsSync(source) && fs.existsSync(path.dirname(target))) {
  fs.copyFileSync(source, target);
  console.log("Injected Electron ABI 140 binary for better-sqlite3 successfully.");
}
