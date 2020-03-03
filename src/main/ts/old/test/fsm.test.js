const assert = require("assert");
const fsm = require("../../main/ts/fsm");

describe('Test FSM', () => {
    //this.timeout(20000);

    it("Tests the actor methods", (done) => {
        const SLEEP_TIME = 100;

        function sleep(millis) {
            return new Promise(resolve => setTimeout(resolve, millis));
        }

        class MyState1 extends fsm.State {
            stop(self) {
                self.log("Stopping");
                self.logMe();
                done();
            }

            async say(self, msg) {
                self.log(msg);
                actor.transition(MyState2);
                await sleep(self.timeout);
            }
        }

        class MyState2 extends fsm.State {
            stop(self) {
                self.log("Stopping");
                self.logMe();
                done();
            }

            async say(self, msg) {
                self.log(msg);
                self.transition(MyState1);
                await sleep(self.timeout);
            }
        }

        class InitialState extends fsm.State {
            onEntry(self) {
                self.timeout = SLEEP_TIME;
                self.post("moveTo", MyState1);
            }

            async moveTo(self, nextState) {
                actor.transition(nextState);
                await sleep(self.timeout);
            }
        }

        let actor = fsm.createActor(InitialState, 'MyActor', true, false);

        actor.post("say", 1);
        actor.post("say", 2);
        actor.post("say", 3);
        actor.post("say", 4);
        actor.post("say", 5);
        actor.post("stop",);

        console.log("Ready to go");


    });


    it("Test post with wait post", async () => {
        const SLEEP_TIME = 1;

        async function doStep(payload) {
            console.log(`step ${payload}`)
        }

        function sleep(millis) {
            return new Promise(resolve => setTimeout(resolve, millis));
        }

        class MyState extends fsm.State {
            async doStuff(self, payload) {
                self.log(`begin doStuff ${payload}`);
                await sleep(SLEEP_TIME);
                self.log("end doStuff");
            }

            async doError(self) {
                throw new Error("signal");
            }
        }

        let actor = fsm.createActor(MyState, "MyActor", true, false);

        await doStep(1);
        await actor.send("doStuff", 2);
        await sleep(1000);
        await doStep(3);
        await actor.send("doStuff", 4);
        await sleep(1000);
        await doStep(5);
        await actor.send("doStuff", 6);
        await sleep(1000);
        await doStep(7);
        try {
            await actor.send("doError");
            assert.fail("Should have failed");
        } catch(err) {
            console.log("done");
        }

    }).timeout(-1);
});