const colors = require("colors");
const http = require("http");
const fs = require("fs");
const common = require('./common');
const WebSocketServer = require("websocket").server;
const config = require('./config.json');

module.exports = {
  run() {
    this.server = http.createServer(this._listener);
    this.server.listen(config.PORT, () => {
      console.log(`listening ${config.PORT} ...`.green);
    });

    let wsServer = new WebSocketServer({ httpServer: this.server });

    wsServer.on("request", r => {
      this.wsConnection = r.accept("echo-protocol", r.origin);
    });
  },

  _listener(req, response) {
    let content;
    const url = req.url;

    switch (true) {
      case /\/images\//.test(url):
        try {
          response.writeHead(200, { 'Content-Type': 'image/jpeg;' });
          content = fs.readFileSync(url.replace(/\//, ''));
          response.end(content);
        } catch (e) {
          console.log(colors.red(req.method), url);
          response.writeHead(400);
          response.end();
        }
        break;

      case /^\/$/.test(url):
        try {
          console.log(colors.green(req.method), url);
          content = fs.readFileSync('public/index.html', 'utf8');
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          response.end(content);
        } catch (e) {
          console.log(colors.red(req.method), url);
          response.writeHead(302, { Location: '../404.html' });
          response.end();
        }
        break;

      case /^\/category\/(\d+)\/detail\/(\d+)$/.test(url):
				console.log(colors.green(req.method), url);
				const params = url.match(/category\/(\d+)[a-z\/]+(\d+)/);
				const categoryId = params[1];
				const detailId = params[2];

				try {
					console.log(categoryId, detailId);
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          content = fs.readFileSync(`public/category/${categoryId}/${detailId}.html`, 'utf8');
          response.end(content);
        } catch (e) {
          response.writeHead(302, { Location: '../404.html' });
          response.end();
        }
        break;

      case /^\/category\/(\d+)$/.test(url):
        console.log(colors.green(req.method), url);
        try {
          content = fs.readFileSync('public' + url + '/index.html', 'utf8');
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          response.end(content);
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
        content = fs.readFileSync('public/style.css', 'utf8');
        response.end(content);
        break;

      default:
        //console.log(colors.red(req.method), url);
        content = fs.readFileSync('public/404.html', 'utf8');
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(content);
        response.end(content);
    }
  },

  reload() {
    if (this.wsConnection) {
      this.wsConnection.sendUTF("reload");
    } else {
      console.log("Client is not connected".red);
    }
  }
};
