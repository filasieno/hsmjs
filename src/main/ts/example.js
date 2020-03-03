"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const ihsm = __importStar(require("./ihsm"));
var SM;
(function (SM) {
    class State extends ihsm.TopState {
        say(msg) {
            this.logInfo(`I have to say this: "${msg}"`);
        }
        changeState() { }
    }
    __decorate([
        ihsm.message
    ], State.prototype, "say", null);
    __decorate([
        ihsm.unknownMessage
    ], State.prototype, "changeState", null);
    SM.State = State;
    let A = class A extends State {
        onInit() { this.message = "My Message"; }
        onEntry() {
        }
        changeState() {
            this.say("hello from A");
            return B;
        }
    };
    A = __decorate([
        ihsm.initial
    ], A);
    SM.A = A;
    class B extends State {
        onEntry() {
        }
        changeState() {
            this.say("hello from A");
            return B;
        }
    }
    SM.B = B;
})(SM || (SM = {}));
ihsm.validateStateMachine(SM);
let hsm = ihsm.create(SM);
let msg = SM.State.prototype;
hsm.post(msg.say, "Hello World");
