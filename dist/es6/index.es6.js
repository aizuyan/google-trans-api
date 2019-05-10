"use strict";
import { sleep, log } from "./util";
import * as puppeteer from 'puppeteer';
const os = require("os");
const platform = os.platform();
let instanceId = 1;
let repairing = false;
export default class Trans {
    constructor(options) {
        // chrome instance pool
        this.chromePool = [];
        // Trans instance options
        this.options = {
            worker: 2,
            responseCb: async (response) => {
                const url = response.url();
                console.log(`[info] intercept url ${url}`);
                try {
                    const status = response.status();
                    const text = await response.text();
                    console.log(`[info] status=>${status} text=>${text}`);
                }
                catch (err) {
                    console.log(`[error] ${err.message}`);
                }
                return Promise.resolve("");
            },
            transPageUrl: "https://translate.google.cn/#auto/zh-CN",
            handles: true,
            executablePath: "",
            proxyServer: "",
            initPageTimeout: 0,
            maxTimesInstance: 200,
        };
        this.options = Object.assign(this.options, options);
    }
    async createPuppeteerInstance() {
        let args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ];
        if (this.options.proxyServer) {
            args.push(this.options.proxyServer);
        }
        let browser = await puppeteer.launch({
            headless: this.options.handles,
            executablePath: this.options.executablePath,
            args: args
        });
        let page = await browser.newPage();
        let pageWrap = {
            page,
            times: 0,
            browser: browser,
            instanceId: instanceId++
        };
        page.from = pageWrap;
        page.on('response', async (response) => {
            const url = response.url();
            console.log(pageWrap.times + " >> 请求url：" + url);
            if (page.msg && url.indexOf(page.msg) != -1) {
                let ret = await this.options.responseCb(response) || "";
                page.trans = ret;
            }
        });
        if (this.options.transPageUrl) {
            let opt = {};
            if (this.options.initPageTimeout) {
                opt.timeout = this.options.initPageTimeout;
            }
            await page.goto(this.options.transPageUrl, opt);
        }
        log('[info]', 'create puppeteer instance', 'instanceid is', pageWrap.instanceId);
        return Promise.resolve(pageWrap);
    }
    // init puppeteer instance pool
    async init() {
        try {
            for (let i = 0; i < this.options.worker; i++) {
                let pageObj = await this.createPuppeteerInstance();
                this.chromePool.push(pageObj);
            }
        }
        catch (e) {
            console.log(`[error] when init`);
            return Promise.resolve(-1);
        }
        return Promise.resolve(0);
    }
    // clear google trans page
    async clear(page) {
        try {
            page.trans = "";
            page.msg = "";
            let source = await page.$("#source");
            if (source) {
                if (platform == "darwin") {
                    await source.click({ clickCount: 3 });
                    await page.keyboard.press("Backspace");
                }
                else {
                    await page.keyboard.down('Control');
                    await page.keyboard.press('KeyA');
                    await page.keyboard.up('Control');
                    await page.keyboard.press("Backspace");
                }
            }
            page.from && console.timeEnd(page.from.times + " >>");
        }
        catch (e) {
            console.log(`[error] when clear`);
        }
    }
    async recyclePageObj(pageObj) {
        if (pageObj.times > this.options.maxTimesInstance) {
            pageObj.browser.close();
            let pageObjNew = await this.createPuppeteerInstance();
            this.chromePool.unshift(pageObjNew);
        }
        else {
            this.chromePool.unshift(pageObj);
        }
    }
    async dynamicRepair() {
        while (this.options.worker > this.chromePool.length) {
            let instance = await this.createPuppeteerInstance();
            this.chromePool.unshift(instance);
        }
    }
    async trans(msg) {
        try {
            let pageObj = this.chromePool.pop();
            if (!pageObj) {
                if (!repairing) {
                    repairing = true;
                    await this.dynamicRepair();
                    repairing = false;
                }
                console.log("overload return empty");
                return Promise.resolve("");
            }
            log('[info]', 'get instance[', pageObj.instanceId, '] runing times[', pageObj.times, ']');
            pageObj.times++;
            console.time(pageObj.times + " >>");
            console.log(pageObj.times + " >>" + `开始翻译：${msg}`);
            msg = msg.trim();
            if (platform == "darwin") {
                msg = msg.replace(/(\n)/g, "");
            }
            console.log(pageObj.times + " >>" + `格式化之后：${msg}`);
            if (!msg) {
                await this.recyclePageObj(pageObj);
                console.timeEnd(pageObj.times + " >>");
                return Promise.resolve("");
            }
            let page = pageObj.page;
            page.msg = encodeURIComponent(msg);
            await page.waitFor("#source");
            let source = await page.$("#source");
            if (!source) {
                console.log(pageObj.times + " >>" + `获取元素焦点失败`);
                return Promise.resolve("");
            }
            source.focus();
            await page.keyboard.type(msg);
            let times = 0;
            while (true) {
                console.log(pageObj.times + " >>" + new Date());
                await sleep(300);
                if (page.trans) {
                    const trans = page.trans;
                    await this.clear(page);
                    await this.recyclePageObj(pageObj);
                    console.log(pageObj.times + " >>" + "翻译结构：" + trans.substr(5));
                    return Promise.resolve(trans.substr(5));
                }
                times++;
                if (times >= 50) {
                    await this.clear(page);
                    await this.recyclePageObj(pageObj);
                    console.log(pageObj.times + " >>" + "翻译超时");
                    return Promise.resolve('');
                }
            }
        }
        catch (e) {
            console.log(`[error] when trans action ${msg} ${e.message}`);
            return Promise.resolve('');
        }
    }
}
