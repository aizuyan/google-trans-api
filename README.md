## 使用示例

```
const koa = require('koa')
const app = new koa()
const router = require('koa-router')();
const GoogleTrans = require('google-trans-api').default
// 如果可以顺利下载puppeteer就不需要该配置
const chromePath = '/path/to/puppeteer chrome'

(async () => {
  let instance = new GoogleTrans({
    handles: false,
    worker:3,
    executablePath: chromePath,
    initPageTimeout: 0,
    //proxyServer: '--proxy-server=socks5://127.0.0.1:1080',
    regExpIncludeUrl: url => {
      const reg = new RegExp("translate.google.cn/translate_a/single.*?q=.*")
      return reg.test(url)
    },
    responseCb: async response => {
      const url = response.url()
      console.log(url)
      try {
        const text = await response.text()
        const status = response.status()

        let ret = JSON.parse(text)
        ret = ret[0]
        let data = ""
        for (let i = 0; i < ret.length; i++) {
          if (ret[i][0]) {
            data += ret[i][0]
          }
        }
        return Promise.resolve(data)
      } catch (err) {
        console.error(`Failed getting data from: ${url}`)
        console.error(err);
      }
    }
  })

  let flag = await instance.init()
  if (flag < 0) {
    console.log("[error] init error")
    return
  }

  router.get('/trans-auto', async ctx => {
    try {
      let msg = decodeURIComponent(ctx.query.msg)
      let ret = await instance.trans(msg)
      ctx.response.body = ret
    } catch (e) {
      console.log(`[error] when trans ${e.message}`)
      ctx.response.body = ""
    }
  })

  app
    .use(router.routes())
    .use(router.allowedMethods())

  app.listen(3000, () => {
    console.log('server is running at http://localhost:3000')
  })
})()

```
