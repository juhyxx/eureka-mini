const fs = require('fs');
const path = require('path');

const config = require('./config.json');

module.exports = {
  mkdir(dir = '') {
    let fullDir = dir ? this.public(dir) : config.PUBLIC_DIR;
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir);
    }
  },

  public(pathToFile) {
    return pathToFile ? path.join(config.PUBLIC_DIR, pathToFile) : config.PUBLIC_DIR;
  },
  source(pathToFile) {
    return path.join(config.SOURCE_DIR, pathToFile);
  }
};
