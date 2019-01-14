const fs= require('fs');
const util = require('util');

const MESSAGES = 'messages';
const LANG = ['enUS', 'zhCN'];

module.exports = function (router) {
  router.get('/', async (ctx, next) => {
    ctx.redirect('/locale/select-dir.html');
  });
  router.get('/locale/index', async (ctx, next) => {
    let { dir } = ctx.query;
    if (!dir) {
      ctx.redirect('/locale/select-dir.html');
    } else {
      if (!dir.endsWith('/') && !dir.endsWith('\\')) {
        dir = dir + '/';
      }
      const files = [MESSAGES, ...LANG].map(t => `${dir}${t}.json`);
      const fileExists = util.promisify(fs.exists);
      const all = await Promise.all(files.map(fileExists));
      const allExist = all.reduce((a, b) => a && b, true );
      if (allExist) {
        ctx.redirect('/locale/edit.html?dir=' + encodeURIComponent(dir));
      } else {
        ctx.redirect('/locale/path-error.html?data=' + encodeURIComponent(JSON.stringify({
          dir,
          files,
        })));
      }
    }
  });

  router.post('/locale/server',async (ctx, next) => {
    const postData = ctx.request.body;
    switch (postData.type) {
      case 'getFileData': {
        const dir = postData.payload;
        const files = [MESSAGES, ...LANG].map(t => `${dir}${t}.json`);
        const readFile= util.promisify(fs.readFile);
        const [ messages, enUS, zhCN ] = await Promise.all(files.map(t => readFile(t)));
        ctx.response.body = {
          success: 1,
          data: {
            messages: messages.toString(),
            langs: {
              enUS: enUS.toString(),
              zhCN: zhCN.toString(),
            }
          },
        };
        break;
      }
      case 'saveFileData': {
        const { dir, messages, langs: { enUS, zhCN } } = postData.payload;
        const files = [MESSAGES, ...LANG].map(t => `${dir}${t}.json`);
        const [ fileMessages, fileEnUS, fileZhCN ] = files;
        fs.writeFileSync(fileMessages, messages);
        fs.writeFileSync(fileEnUS, enUS);
        fs.writeFileSync(fileZhCN, zhCN);
        ctx.response.body = {
          success: 1,
          data: null,
        };
        break;
      }
      default:
        ctx.response.body = {
          success: 0,
          data: null,
        };
    }
  });
};
