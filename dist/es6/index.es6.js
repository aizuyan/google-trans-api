"use strict";
import { sleep, log } from "./util";
import * as puppeteer from 'puppeteer';
const os = require("os");
const url = require('url');
const platform = os.platform();
let instanceId = 1;
let repairing = false;
let sourceResultsMap = {};
const OVERLOAD = 1000;
const QUERY_MSG_EMPTY = 1001;
const SOURCE_ELEMENT_GET_ERROR = 1002;
const OVER_TIME = 1003;
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
            regExpIncludeUrl: url => {
                const reg = new RegExp("translate.google.cn/translate_a/single.*?q=.*");
                return reg.test(url);
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
    /**
     * get param q from original url
     *
     * @param urlStr
     */
    getQueryFromUrl(urlStr) {
        let query = url.parse(urlStr).query;
        let q = query.q || "";
        return q;
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
            log(`[info] request url ${url}`);
            if (this.options.regExpIncludeUrl &&
                typeof (this.options.regExpIncludeUrl) === "function" &&
                !this.options.regExpIncludeUrl(url)) {
                return true;
            }
            const q = this.getQueryFromUrl(url);
            if (!q) {
                return true;
            }
            let ret = await this.options.responseCb(response) || "";
            // save to the global var, ret is result, new Date is the record date, to clear
            sourceResultsMap[q] = [ret, new Date()];
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
    /**
     * supplement puppeteer instance when not enough
     */
    async dynamicRepair() {
        while (this.options.worker > this.chromePool.length) {
            let instance = await this.createPuppeteerInstance();
            this.chromePool.unshift(instance);
        }
    }
    /**
     * trans func, called by api
     *
     * @param msg
     */
    async trans(msg) {
        console.log(sourceResultsMap);
        let pageObj = this.chromePool.pop();
        try {
            if (!pageObj) {
                if (!repairing) {
                    repairing = true;
                    await this.dynamicRepair();
                    repairing = false;
                }
                throw OVERLOAD;
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
                throw QUERY_MSG_EMPTY;
            }
            let page = pageObj.page;
            // type source info to the textarea
            await page.waitFor("#source");
            let source = await page.$("#source");
            if (!source) {
                throw SOURCE_ELEMENT_GET_ERROR;
            }
            source.focus();
            await page.keyboard.type(msg);
            // wait for result or error
            let times = 0;
            while (true) {
                console.log(sourceResultsMap, msg);
                console.log(pageObj.times + " >>" + new Date());
                await sleep(300);
                if (sourceResultsMap[msg]) {
                    let result = sourceResultsMap[msg][0];
                    console.log(pageObj.times + " >>" + "翻译结果：" + result);
                    //sourceResultsMap[msg] = null
                    await this.clear(page);
                    await this.recyclePageObj(pageObj);
                    return Promise.resolve(result);
                }
                times++;
                if (times >= 50) {
                    throw OVER_TIME;
                }
            }
        }
        catch (e) {
            const message = e.message;
            switch (message) {
                case OVERLOAD:
                    return Promise.resolve(OVERLOAD);
                case QUERY_MSG_EMPTY:
                    await this.recyclePageObj(pageObj);
                    console.timeEnd(pageObj.times + " >>");
                    return Promise.resolve(QUERY_MSG_EMPTY);
                case SOURCE_ELEMENT_GET_ERROR:
                    console.log(pageObj.times + " >>" + `获取元素焦点失败`);
                    return Promise.resolve(SOURCE_ELEMENT_GET_ERROR);
                case OVER_TIME:
                    console.log(pageObj.times + " >>" + "翻译超时");
                    return Promise.resolve('');
                default:
                    log(`[error]`, pageObj.instanceId, e);
                    return Promise.resolve('');
            }
        }
    }
}
