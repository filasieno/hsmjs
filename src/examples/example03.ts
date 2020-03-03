//noinspection DuplicatedCode
import * as ihsm from "../ihsm";

//
// Write an tentative Example to transform any class in a State Machine
// Useful to support Angular integration
//

class MyParent {

}

class MyObject extends MyParent {

}

function hsmMixin<T>(klass:T, stateMachine: object) : T {

}

namespace SM {

    export class State extends ihsm.TopState {
        // The State machine state
        message!: string;
        @ihsm.message say(msg: string) {
            this.logInfo(`I have to say: "${msg}"`);
        }
        @ihsm.unknownMessage changeState() {}
    }

    @ihsm.initial
    export class A extends State {
        onInit() { this.message = "My Message"; }
        onEntry() {
            //this.logInfo("In state A !!")
        }

        changeState() {
            this.say("hello from A");
            return B; // Transition To B
        }
    }

    export class B extends State {
        onEntry() {
            //this.logInfo("In state B !!")
        }

        changeState() {
            this.say("hello from A");
            return B; // Transition To B
        }
    }
}
ihsm.validateStateMachine(SM);
let MyObjectHsm = hsmMixin(MyObject, SM);

let hsm = ihsm.create(SM);
let msg = SM.State.prototype;
hsm.post(msg.say, "Hello World");



