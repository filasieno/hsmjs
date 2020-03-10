var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ihsm = __importStar(require("../index"));
    class MyData {
        constructor() {
            this.millis = 1000;
        }
    }
    var StateMachine;
    (function (StateMachine) {
        function sleep(millis) {
            return new Promise((resolve) => {
                setInterval(() => { resolve(); }, millis);
            });
        }
        class State extends ihsm.State {
            async waitAndLog(preMessage, postMessage) { this.hsm.unhandled(); }
            justLog(msg) { this.hsm.unhandled(); }
            eventHandler() { this.hsm.unhandled(); }
            getMessage() { this.hsm.unhandled(); }
            setAndGet(msg) { this.hsm.unhandled(); }
        }
        StateMachine.State = State;
        let State1 = class State1 extends ihsm.State {
            async waitAndLog(preMessage, postMessage) {
                this.hsm.logInfo(preMessage);
                await sleep(this.ctx.millis);
                console.log(postMessage);
                this.hsm.logInfo(preMessage);
            }
        };
        State1 = __decorate([
            ihsm.initialState
        ], State1);
        StateMachine.State1 = State1;
    })(StateMachine || (StateMachine = {}));
    let myData = new MyData();
    let hsm = ihsm.initHsm(StateMachine, myData, 20);
    hsm.logLevel = 20;
    hsm.name = "MyActor";
    hsm.send.waitAndLog("pre message", "postMessage");
});
//# sourceMappingURL=typing.js.map