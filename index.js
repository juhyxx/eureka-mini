const http = require('http');
const fs = require('fs');
const path = require('path');

const less = require('less');
const colors = require('colors');
const watch = require('watch');
const url = require('url');
const server = require('./lib/server');
const renderer = require('./lib/renderer');
const common = require('./lib/common');
const config = require('./lib/config.json');

common.mkdir();
renderer.init();

watch.watchTree('app', { ignoreDotFiles: true }, (f, prev, curr) => {
  if (typeof f == 'object' && prev === null && curr === null) {
    console.log('Watching'.blue);
  } else {
    console.log('change'.blue, f);

    switch (path.extname(f)) {
      case '.hbs':
        renderer.render().then(() => server.reload());
        break;

      case '.less':
        compileLess().then(() => server.reload());
        break;
      case '.js':
				 fs.writeFileSync(common.public('script.js'), fs.readFileSync(common.source('script.js'), 'utf8'), 'utf8');
				 server.reload();
        break;
    }
  }
});

function compileLess() {
  return new Promise(resolve => {
    //solves problem with LESS caching of imported files
    const fileManagers = (less.environment && less.environment.fileManagers) || [];
    fileManagers.forEach(fileManager => {
      if (fileManager.contents) {
        fileManager.contents = {};
      }
    });
    fs.readFile('app/styles/index.less', 'utf8', (err, content) => {
      less.render(content).then(rendered => {
        fs.writeFile(common.public('style.css'), rendered.css, 'utf8', () => resolve());
      });
    });
  });
}

Promise.all([renderer.render(), compileLess()]).then(() => server.run());
