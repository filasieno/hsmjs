"use strict";

class MyClass {
    construct() {
        this.name = "MyClass";
    }

    runMe() {
        class State {
            sample() {
                console.log(this);
            }
        }
        State.prototype.sample.apply(this)
    }
}

let c = new MyClass();
c.runMe();


function sample() {
    this.x = 10;
    return this;
}

let myVar = sample();
console.log(myVar);