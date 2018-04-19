const colors = require('colors');
const http = require('http');
const fs = require('fs');
const WebSocketServer = require('websocket').server;

const common = require('./common');
const config = require('./config.json');

module.exports = {
  run() {
    let server = http.createServer(this._listener);
    server.listen(config.PORT, () => {
      console.log(`listening ${config.PORT} ...`.green);
    });

    let wsServer = new WebSocketServer({ httpServer: server });

    wsServer.on('request', r => {
      this.wsConnection = r.accept('echo-protocol', r.origin);
    });
  },

  _listener(req, response) {
    const url = req.url;

    switch (true) {
      case /\/images\//.test(url):
        try {
          response.writeHead(200, { 'Content-Type': 'image/jpeg;' });
          response.end(fs.readFileSync(url.replace(/\//, '')));
        } catch (e) {
          console.log(colors.red(req.method), url);
          response.writeHead(400);
          response.end();
        }
        break;

      case /^\/$/.test(url):
        try {
          console.log(colors.green(req.method), url);
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          response.end(fs.readFileSync(common.public('index.html'), 'utf8'));
        } catch (e) {
          console.log(colors.red(req.method), url);
          response.writeHead(302, { Location: '../404.html' });
          response.end();
        }
        break;

      case /^\/category\/(\d+)\/detail\/$/.test(url):
        console.log(colors.green(req.method), url);
        response.writeHead(302, { Location: '../' });
        response.end();
        break;

      case /^\/category\/(\d+)\/detail\/(\d+)$/.test(url):
        console.log(colors.green(req.method), url);
        const params = url.match(/category\/(\d+)[a-z\/]+(\d+)/);
        const categoryId = params[1];
        const detailId = params[2];

        try {
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          response.end(fs.readFileSync(common.public(`category/${categoryId}/${detailId}.html`), 'utf8'));
        } catch (e) {
          response.writeHead(302, { Location: '../404.html' });
          response.end();
        }
        break;

      case /^\/category\/(\d+)\/detail\/(\d+)\/$/.test(url): //backlash on the end of url solution
        response.writeHead(302, { Location: url.replace(/\/$/, '') });
        response.end();
        break;

      case /^\/category\/(\d+)\/(\?page=(\d+))?$/.test(url): //backlash on the end of url solution
        response.writeHead(302, { Location: url.replace(/\/$/, '') });
        response.end();
        break;

      case /^\/category\/(\d+)(\?page=(\d+))?$/.test(url):
        console.log(colors.green(req.method), url);
        try {
          let pageParsed = url.match(/.*page=(\d+).*/);
          let page = pageParsed ? pageParsed[1] : '0';
          let fileName = common.public(`${url.replace(/\?.*/, '')}/index-${page}.html`);

          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          response.end(fs.readFileSync(fileName, 'utf8'));
        } catch (e) {
          response.writeHead(302, { Location: '../404.html' });
          response.end();
        }
        break;

      case /^\/category\/$/.test(url):
        response.writeHead(302, { Location: '../' });
        response.end();
        break;

      case /^\/style.css/.test(url):
        console.log(colors.green(req.method), url);
        response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
        response.end(fs.readFileSync(common.public('style.css'), 'utf8'));
        break;

      case /^\/script.js/.test(url):
        console.log(colors.green(req.method), url);
        response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
        response.end(fs.readFileSync(common.public('script.js'), 'utf8'));
        break;

      default:
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(fs.readFileSync(common.public('404.html'), 'utf8'));
    }
  },

  reload() {
    if (this.wsConnection) {
      this.wsConnection.sendUTF('reload');
    } else {
      console.log('Client is not connected'.red);
    }
  }
};
