const assert = require('assert');

/**
 *
 */
class Transition {
    constructor() {
        this.enter = [];
        this.exit = [];
        this.targetState = null;
    }

    /**
     * Adds an enter step
     * @param  {State} state that must be entered
     */
    setTargetState(state) {

    }

    /**
     * Adds an enter step to
     * @param {State} state that must be entered
     */
    addEntry(state) {

    }

    /**
     * Adds an enter step to
     * @param {State} state that must be entered
     */
    addExit(state) {

    }

    /**
     * Execute a transition
     * @param {Actor} actor instance
     */
    execute(actor) {
        if (this.enter.length !== 0) {
            assert(actor.__state__.state === this.enter[0], "Illegal state"); //TODO: setup Error codes
        }
        for (let index = 0; index < this.enter.length; ++index) {
            this.enter[index].prototype.onEntry.apply(actor);
        }
        for (let index = 0; index < this.exit.length; ++index) {
            this.enter[index].prototype.onExit.apply(actor);
        }
        actor.__state__.state = this.targetState;
    }

    /**
     * Execute a transition
     *
     * @param {Actor} actor instance
     */
    async asyncExecute(actor) {
        if (this.enter.length !== 0) {
            assert(actor.__state__.state === this.enter[0], "Illegal state"); //TODO: setup Error codes
        }

        for (let index = 0; index < this.enter.length; ++index) {
            let state = this.enter[index];
            if (state.state.prototype.hasOwnProperty("onEntry")) {
                let result = state.prototype.onEntry.apply(actor);
                if (Promise.isPrototypeOf(result)) {
                    await result;
                }
            }

        }
        for (let index = 0; index < this.enter.length; ++index) {
            let state = this.enter[index];
            if (state.state.prototype.hasOwnProperty("onExit")) {
                let result = state.prototype.onEntry.apply(actor);
                if (Promise.isPrototypeOf(result)) {
                    await result;
                }
            }
        }
        actor.__state__.state = this.targetState;
    }
}

exports.Transition = Transition;