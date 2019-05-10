"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var puppeteer = require("puppeteer");
var os = require("os");
var platform = os.platform();
var instanceId = 1;
var repairing = false;
var Trans = /** @class */ (function () {
    function Trans(options) {
        var _this = this;
        // chrome instance pool
        this.chromePool = [];
        // Trans instance options
        this.options = {
            worker: 2,
            responseCb: function (response) { return __awaiter(_this, void 0, void 0, function () {
                var url, status_1, text, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            url = response.url();
                            console.log("[info] intercept url " + url);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            status_1 = response.status();
                            return [4 /*yield*/, response.text()];
                        case 2:
                            text = _a.sent();
                            console.log("[info] status=>" + status_1 + " text=>" + text);
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _a.sent();
                            console.log("[error] " + err_1.message);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/, Promise.resolve("")];
                    }
                });
            }); },
            transPageUrl: "https://translate.google.cn/#auto/zh-CN",
            handles: true,
            executablePath: "",
            proxyServer: "",
            initPageTimeout: 0,
            maxTimesInstance: 200,
        };
        this.options = Object.assign(this.options, options);
    }
    Trans.prototype.createPuppeteerInstance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var args, browser, page, pageWrap, opt;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        args = [
                            "--no-sandbox",
                            "--disable-setuid-sandbox",
                        ];
                        if (this.options.proxyServer) {
                            args.push(this.options.proxyServer);
                        }
                        return [4 /*yield*/, puppeteer.launch({
                                headless: this.options.handles,
                                executablePath: this.options.executablePath,
                                args: args
                            })];
                    case 1:
                        browser = _a.sent();
                        return [4 /*yield*/, browser.newPage()];
                    case 2:
                        page = _a.sent();
                        pageWrap = {
                            page: page,
                            times: 0,
                            browser: browser,
                            instanceId: instanceId++
                        };
                        page.from = pageWrap;
                        page.on('response', function (response) { return __awaiter(_this, void 0, void 0, function () {
                            var url, ret;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        url = response.url();
                                        console.log(pageWrap.times + " >> 请求url：" + url);
                                        if (!(page.msg && url.indexOf(page.msg) != -1)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.options.responseCb(response)];
                                    case 1:
                                        ret = (_a.sent()) || "";
                                        page.trans = ret;
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); });
                        if (!this.options.transPageUrl) return [3 /*break*/, 4];
                        opt = {};
                        if (this.options.initPageTimeout) {
                            opt.timeout = this.options.initPageTimeout;
                        }
                        return [4 /*yield*/, page.goto(this.options.transPageUrl, opt)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        util_1.log('[info]', 'create puppeteer instance', 'instanceid is', pageWrap.instanceId);
                        return [2 /*return*/, Promise.resolve(pageWrap)];
                }
            });
        });
    };
    // init puppeteer instance pool
    Trans.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var i, pageObj, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.options.worker)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createPuppeteerInstance()];
                    case 2:
                        pageObj = _a.sent();
                        this.chromePool.push(pageObj);
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        console.log("[error] when init");
                        return [2 /*return*/, Promise.resolve(-1)];
                    case 6: return [2 /*return*/, Promise.resolve(0)];
                }
            });
        });
    };
    // clear google trans page
    Trans.prototype.clear = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var source, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        page.trans = "";
                        page.msg = "";
                        return [4 /*yield*/, page.$("#source")];
                    case 1:
                        source = _a.sent();
                        if (!source) return [3 /*break*/, 9];
                        if (!(platform == "darwin")) return [3 /*break*/, 4];
                        return [4 /*yield*/, source.click({ clickCount: 3 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.keyboard.press("Backspace")];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 4: return [4 /*yield*/, page.keyboard.down('Control')];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, page.keyboard.press('KeyA')];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, page.keyboard.up('Control')];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, page.keyboard.press("Backspace")];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        page.from && console.timeEnd(page.from.times + " >>");
                        return [3 /*break*/, 11];
                    case 10:
                        e_2 = _a.sent();
                        console.log("[error] when clear");
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    Trans.prototype.recyclePageObj = function (pageObj) {
        return __awaiter(this, void 0, void 0, function () {
            var pageObjNew;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(pageObj.times > this.options.maxTimesInstance)) return [3 /*break*/, 2];
                        pageObj.browser.close();
                        return [4 /*yield*/, this.createPuppeteerInstance()];
                    case 1:
                        pageObjNew = _a.sent();
                        this.chromePool.unshift(pageObjNew);
                        return [3 /*break*/, 3];
                    case 2:
                        this.chromePool.unshift(pageObj);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Trans.prototype.dynamicRepair = function () {
        return __awaiter(this, void 0, void 0, function () {
            var instance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.options.worker > this.chromePool.length)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createPuppeteerInstance()];
                    case 1:
                        instance = _a.sent();
                        this.chromePool.unshift(instance);
                        return [3 /*break*/, 0];
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    Trans.prototype.trans = function (msg) {
        return __awaiter(this, void 0, void 0, function () {
            var pageObj, page, source, times, trans, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 18, , 19]);
                        pageObj = this.chromePool.pop();
                        if (!!pageObj) return [3 /*break*/, 3];
                        if (!!repairing) return [3 /*break*/, 2];
                        repairing = true;
                        return [4 /*yield*/, this.dynamicRepair()];
                    case 1:
                        _a.sent();
                        repairing = false;
                        _a.label = 2;
                    case 2:
                        console.log("overload return empty");
                        return [2 /*return*/, Promise.resolve("")];
                    case 3:
                        util_1.log('[info]', 'get instance[', pageObj.instanceId, '] runing times[', pageObj.times, ']');
                        pageObj.times++;
                        console.time(pageObj.times + " >>");
                        console.log(pageObj.times + " >>" + ("\u5F00\u59CB\u7FFB\u8BD1\uFF1A" + msg));
                        msg = msg.trim();
                        if (platform == "darwin") {
                            msg = msg.replace(/(\n)/g, "");
                        }
                        console.log(pageObj.times + " >>" + ("\u683C\u5F0F\u5316\u4E4B\u540E\uFF1A" + msg));
                        if (!!msg) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.recyclePageObj(pageObj)];
                    case 4:
                        _a.sent();
                        console.timeEnd(pageObj.times + " >>");
                        return [2 /*return*/, Promise.resolve("")];
                    case 5:
                        page = pageObj.page;
                        page.msg = encodeURIComponent(msg);
                        return [4 /*yield*/, page.waitFor("#source")];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, page.$("#source")];
                    case 7:
                        source = _a.sent();
                        if (!source) {
                            console.log(pageObj.times + " >>" + "\u83B7\u53D6\u5143\u7D20\u7126\u70B9\u5931\u8D25");
                            return [2 /*return*/, Promise.resolve("")];
                        }
                        source.focus();
                        return [4 /*yield*/, page.keyboard.type(msg)];
                    case 8:
                        _a.sent();
                        times = 0;
                        _a.label = 9;
                    case 9:
                        if (!true) return [3 /*break*/, 17];
                        console.log(pageObj.times + " >>" + new Date());
                        return [4 /*yield*/, util_1.sleep(300)];
                    case 10:
                        _a.sent();
                        if (!page.trans) return [3 /*break*/, 13];
                        trans = page.trans;
                        return [4 /*yield*/, this.clear(page)];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, this.recyclePageObj(pageObj)];
                    case 12:
                        _a.sent();
                        console.log(pageObj.times + " >>" + "翻译结构：" + trans.substr(5));
                        return [2 /*return*/, Promise.resolve(trans.substr(5))];
                    case 13:
                        times++;
                        if (!(times >= 50)) return [3 /*break*/, 16];
                        return [4 /*yield*/, this.clear(page)];
                    case 14:
                        _a.sent();
                        return [4 /*yield*/, this.recyclePageObj(pageObj)];
                    case 15:
                        _a.sent();
                        console.log(pageObj.times + " >>" + "翻译超时");
                        return [2 /*return*/, Promise.resolve('')];
                    case 16: return [3 /*break*/, 9];
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        e_3 = _a.sent();
                        console.log("[error] when trans action " + msg + " " + e_3.message);
                        return [2 /*return*/, Promise.resolve('')];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    return Trans;
}());
exports.default = Trans;
