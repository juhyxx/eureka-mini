const config = require('./config.json');
const fs = require('fs');

module.exports = {
  mkdir(dir = '') {
    let fullDir = dir ? this.public(dir) : config.PUBLIC_DIR;
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir);
    }
  },

  public(path) {
    return config.PUBLIC_DIR + '/' + path;
  },
  source(path) {
    return config.SOURCE_DIR + '/' + path;
  }
};
