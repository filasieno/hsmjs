
class State {

}

class Hsm {

}

function init(initialState) {
    return new Hsm(initialState);
}

function Pippo(arg1, arg2) {

    class A extends State {
        stop(a, c, b) { }
        async say(self, msg) { }
    }

    class B extends State {
        static initial;
        stop(self) { }
        async say(self, msg) { }
    }

    class InitialState extends A {
        onEntry() { }
        async moveTo(self, nextState) { }
    }

    let hsm = init(InitialState);
    return hsm;
}

hsm.send("x");
hsm.post("x");

hsm.send.request(10, 20, 30);
hsm.post.request(10, 20, 30);

hsm.send("stop", 10, 20, 30);


