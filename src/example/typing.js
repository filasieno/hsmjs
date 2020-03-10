var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
        define(["require", "exports", "assert", "../index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const assert_1 = __importDefault(require("assert"));
    const ihsm = __importStar(require("../index"));
    class MyData {
        constructor() {
            this.millis = 100;
        }
    }
    var StateMachine;
    (function (StateMachine) {
        function sleep(millis) {
            return new Promise((resolve) => {
                setInterval(() => { resolve(); }, millis);
            });
        }
        class TopState extends ihsm.State {
        }
        StateMachine.TopState = TopState;
        let State1 = class State1 extends TopState {
            async switchAndLog(preMessage, postMessage) {
                console.log(preMessage);
                this.hsm.transition(State2);
                console.log(postMessage);
            }
            async setAndGet(name) {
                this.ctx.name = name;
                return name;
            }
        };
        State1 = __decorate([
            ihsm.initialState
        ], State1);
        StateMachine.State1 = State1;
        class State2 extends TopState {
            async switchAndLog(preMessage, postMessage) {
                console.log(preMessage);
                this.hsm.transition(State1);
                console.log(postMessage);
            }
            async setAndGet(name) {
                this.ctx.name = name;
                return name;
            }
        }
        StateMachine.State2 = State2;
        console.log("Initialized");
    })(StateMachine || (StateMachine = {}));
    async function main() {
        let myData = new MyData();
        let hsm = ihsm.initHsm(StateMachine, myData, 20);
        assert_1.default(hsm.currentState === StateMachine.State1);
        hsm.send.switchAndLog("pre", "post");
        await hsm.asyncSend.switchAndLog("pre", "post");
        await hsm.send.setAndGet("name");
        let x = await hsm.asyncSend.setAndGet("name");
        console.log(x);
        console.log("done");
    }
    (async () => {
        try {
            await main();
            console.log();
        }
        catch (e) {
            console.log(e);
        }
    })();
});
//# sourceMappingURL=typing.js.map