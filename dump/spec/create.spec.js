const {StateMachine} = require('../stateMachine');
const {Machine, Demo} = require('./machine');
const {TopState, State1, State2} = Machine;
const {expect} = require('chai');
const ihsm = require('../ihsm');
const msg = Machine.TopState.prototype;

describe('Hierarchical UserTopState Machine creation', function() {

    describe('@initialState decorator', function() {
        it('sets "initialState" in parent of the target class', async function() {
            expect(TopState).hasOwnProperty('_initialState');
            expect(TopState['_initialState']).equals(State1);
        });
    });

    describe('init', function() {
        it('adds a {__hsm__:StateMachine} property', async function() {
            let demo = new Demo();
            let demoEx = ihsm.init(demo, Machine);
            expect(demoEx).hasOwnProperty('__state__');
            expect(demoEx.__state__).instanceOf(StateMachine);
            expect(demoEx).equals(demo);
        });
        it('executes _init()', async function() {
            let demo = new Demo();
            let demoEx = ihsm.init(demo, Machine);
            expect(demoEx).hasOwnProperty('__state__');
            expect(demoEx.__state__).instanceOf(StateMachine);
            expect(demoEx).equals(demo);
        });
    });

    describe('sync send message', function() {

        let actor = null;
        let actorEx = null;//

        beforeEach(async function() {
            actor = new Demo();
            actorEx = ihsm.init(actor, Machine);
        });
        afterEach(async function() {
            actor = null;
            actorEx = null;
        });

        it('sends a message', async function() {
            ihsm.send(actor, msg.setMessage, 'this is a message');
        });

    });

    describe('async send message', function() {

        let actor = null;
        let actorEx = null;

        beforeEach(async function() {
            actor = new Demo();
            actorEx = ihsm.init(actor, Machine);
        });
        afterEach(async function() {
            actor = null;
            actorEx = null;
        });

        it('sends a message', async function() {
            ihsm.send(actor, msg.setMessage, 'this is a message');
        });

        it('sends an async message', async function() {
            await ihsm.asyncSend(actor, msg.setMessage, 'this is a message');
        });

        it('sends an async that will trigger a nextState', async function() {
            await ihsm.asyncSend(actor, msg.tick);
        });

        it('changes state', async function() {
            await ihsm.asyncSend(actor, msg.changeState, State2);
            await ihsm.asyncSend(actor, msg.changeState, TopState);
        });

        it('sends an async that will trigger a nextState', async function() {
            let value = ['Hello World'];
            let res = await ihsm.asyncSend(actor, msg.sendBack, value);
            expect(res).equals(value);
        });

    });

});
