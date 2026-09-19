// Kept as a learning reference even though this project uses electron-builder
// for the actual package/update pipeline.
//
// Electron Forge is the official Electron packaging/distribution ecosystem.
// We use electron-builder here because its NSIS + electron-updater flow makes
// the complete private-app update pipeline easier to inspect in one project.
//
// See docs/07-packaging.md and docs/09-updates.md.
module.exports = {
  packagerConfig: {
    asar: true
  }
};
