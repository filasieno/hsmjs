var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var _context;
    Object.defineProperty(exports, "__esModule", { value: true });
    function classDecorator(constructor) {
        return class extends constructor {
            constructor() {
                super(...arguments);
                this.newProperty = "new property";
                this.hello = "override";
                this.sample = "sample";
            }
        };
    }
    class State {
        _init() { }
        _entry() { }
        _exit() { }
    }
    class Hsm {
        constructor() {
            _context.set(this, void 0);
        }
        setContext(context) {
            __classPrivateFieldSet(this, _context, context);
        }
        init() {
        }
        ;
    }
    _context = new WeakMap();
    function actor(constructor) {
        return class Actor extends constructor {
            constructor(...args) {
                super(...args);
                this.__hsm__ = new Hsm();
                this.__hsm__.setContext(this);
                this.__hsm__.init();
            }
        };
    }
    class TopState extends State {
        hello() {
            console.log("hello");
        }
    }
    let Greeter = class Greeter {
        constructor(hello = "x") {
            this.hello = hello;
        }
    };
    Greeter = __decorate([
        actor
    ], Greeter);
    class GreeterChild extends Greeter {
    }
    function main() {
        let d = new Greeter();
        console.log(d);
    }
    setTimeout(main, 1000);
});
//# sourceMappingURL=ihsm.js.map