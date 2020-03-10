var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as ihsm from '../index';
export class Demo {
    constructor() {
        this.counter = 0;
    }
}
export var Machine;
(function (Machine) {
    class State extends ihsm.State {
        setMessage(msg) { return this.hsm.unhandled(); }
        tick() { this.hsm.unhandled(); }
        changeState(s) { this.hsm.nextState = State; }
        async sendBack(value) { return value; }
        async _entry() { }
        async _exit() { }
    }
    Machine.State = State;
    let ErrorState = class ErrorState extends State {
        async onError(err) {
            this.hsm.logErrorObject(err);
        }
    };
    ErrorState = __decorate([
        ihsm.errorState
    ], ErrorState);
    Machine.ErrorState = ErrorState;
    let State1 = class State1 extends State {
        setMessage(msg) { this.ctx.message = "I was set by State1"; }
        tick() {
            this.ctx.message = "State1 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
        _init() { }
        async _entry() { }
        async _exit() { }
    };
    State1 = __decorate([
        ihsm.initialState
    ], State1);
    Machine.State1 = State1;
    class State11 extends State1 {
        tick() {
            this.ctx.message = "State11 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
        async _entry() { }
        async _exit() { }
    }
    Machine.State11 = State11;
    let State12 = class State12 extends State1 {
        _init() { }
        tick() {
            this.ctx.message = "State11 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
    };
    State12 = __decorate([
        ihsm.initialState
    ], State12);
    Machine.State12 = State12;
    let State112 = class State112 extends State12 {
        _init() { }
        tick() {
            this.ctx.message = "State112 was here";
            ++this.ctx.counter;
            this.hsm.nextState = State1;
        }
        async _entry() { }
        async _exit() { }
    };
    State112 = __decorate([
        ihsm.initialState
    ], State112);
    Machine.State112 = State112;
    class State2 extends State {
    }
    Machine.State2 = State2;
})(Machine || (Machine = {}));
//# sourceMappingURL=machine.js.map