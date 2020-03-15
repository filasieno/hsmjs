import * as ihsm from "../index";

class TopState extends ihsm.State {
    sample(...args: any[]) {
        this.hsm.logInfo(`sample ${args}`)
    }
}

class State1 extends TopState {

}

@ihsm.initialState()
class State2 extends TopState {

}

async function Untyped() {

}

(async () => {
    try {
        await Untyped();
    } catch (e) {}
})();
