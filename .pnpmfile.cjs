module.exports = {
  hooks: {
    readPackage(pkg) {
      // Erlaube Build-Scripts für better-sqlite3
      if (pkg.name === 'better-sqlite3') {
        pkg.scripts = pkg.scripts || {};
      }
      return pkg;
    }
  }
};
