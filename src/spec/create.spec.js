import {StateMachine} from '../stateMachine';

const {Machine, Demo} = require('./machine');
const {TopState, State1, State2} = Machine;
const {expect} = require('chai');
const ihsm = require('../ihsm');
const msg = Machine.TopState.prototype;

describe('Hierarchical State Machine creation', function() {

    describe('@initialState decorator', function() {
        it('sets "initialState" in parent of the target class', async function() {
            expect(TopState).have.key('initialState');
            expect(TopState['initialState']).equals(State1);
        });
//        it('sets "isInitial" = true in the target class', async function() {
//            expect(State1).have.key('isInitial');
//            expect(State1['isInitial']).equals(true);
//        });
    });

    describe('init', function() {
        it('adds a {__state__:StateMachine} property', async function() {
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

    describe('send message', function() {

        let actor = null;
        let actorEx = null;//

        beforeEach(async function() {
            actor = new Demo();
            actorEx = ihsm.init(actor, Machine);
        });
        afterEach(async function() { actor = null;});
        it('sends a message', async function() {
            ihsm.send(actor, msg.setMessage, "this is a message");
        });
    });

});
