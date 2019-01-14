const bodyParser = require('koa-bodyparser');
const Koa = require('koa');
const Router = require('koa-router');
const koaStatic = require('koa-static');
const path = require('path');

const port = 18759;

module.exports = function (onCreated = () => {}) {
  const app = new Koa();
  app.use(koaStatic(
    path.join( __dirname, './static')
  ));
  app.use(bodyParser({
    formLimit:"3mb",
    jsonLimit:"3mb",
    textLimit:"3mb",
    enableTypes: ['json', 'form', 'text']
  }));
  const router = new Router();
  require('./modules/locale/router')(router);
  app.use(router.routes());
  app.listen(port, () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`server is starting at ${url}`);
    onCreated(url + '/locale/index');
  });
};
