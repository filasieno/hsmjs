"use strict";

const tryStuff = require("./trystuff");
const assert = require("assert");

class MyGrandParent {
    constructor() {
        this.grandParentField = "grandParentField";
    }

    helloGrandParent() {

    }
}


class MyParent extends MyGrandParent {
    constructor() {
        super();
        this.parentField = "parentField";
    }

    helloParent() {

    }
}

class MyObject extends MyParent {
    constructor() {
        super();
        this.objectField = "objectField";
    }

    static async hello(self){

   };
}

function state(a,b,c,d) {
    console.log("state called")
}


class MyState {

    async sayHelloAsync(message) {

    }

    $sample() {

    }
}


class State {
    constructor(initialState, name = "Actor") {
        this.name = name;
        this.state = initialState;
    }
}

function init(obj, initialState, name = "Actor") {
    obj.__state__ = new State(initialState, name);
    return new Proxy(obj, {
        get(target, propKey) {
            if (!(propKey in target)) {
                console.log(`Property "${propKey}" not found in object`);
                if (!(propKey in target.__state__.state.prototype)) {
                    console.log(`Handler "${propKey}" not found in "${target.__state__.name}"`);
                }
                return target.__state__.state.prototype[propKey];
            } else {
                console.log(`Reading property "${propKey}"`);
                return target[propKey];
            }
        }
    });
}

let obj = new MyObject();
let actor = init(obj, MyState);


console.log(this);

console.log(actor.objectField);
console.log(actor.parentField);
console.log(actor.grandParentField);


class Other {
    async setValue(value) {
        console.log(arguments);
        this.value = value;
        console.log(`value = "${value}"`);
    }
}

obj = {};
let proto = Other.prototype;
let handler = proto.setValue;
let promise = handler.apply(obj, [100]);
promise.then(() => console.log("done"));
console.log(obj);
// actor.hello();
// actor.helloParent();
// actor.helloGrandParent();
// actor.sayHelloAsync("message").resolve();


obj.actor.request(10, 20, 30);
