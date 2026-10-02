const path = require("node:path");

function getBackendSrcDir(isPackaged) {
  return isPackaged
    ? path.join(__dirname, "..", "..", "backend", "src")
    : path.join(__dirname, "..", "..", "..", "backend", "src");
}

function getFrontendIndexPath(isPackaged) {
  return isPackaged
    ? path.join(__dirname, "..", "..", "frontend", "dist", "index.html")
    : path.join(__dirname, "..", "..", "..", "frontend", "dist", "index.html");
}

function getDatabasePath(userDataPath) {
  return path.join(userDataPath, "data", "restaurant.sqlite");
}

const windowConfig = {
  width: 1200,
  height: 800,
  minWidth: 960,
  minHeight: 640
};

module.exports = {
  getBackendSrcDir,
  getFrontendIndexPath,
  getDatabasePath,
  windowConfig
};
