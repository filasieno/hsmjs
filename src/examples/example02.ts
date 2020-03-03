//noinspection DuplicatedCode
import * as ihsm from "../ihsm";

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
let hsm = ihsm.create(SM);
let msg = SM.State.prototype;
hsm.post(msg.say, "Hello World");



