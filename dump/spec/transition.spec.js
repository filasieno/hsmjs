"use strict";

let __importStar = (this && this.__importStar) || function (mod) {
	if (mod && mod.__esModule) return mod;
	let result = {};
	if (mod != null) for (let k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	result['default'] = mod;
	return result;
};

const ihsm = __importStar(require('../main'));

describe('A suite for testing nextState objects.', () => {
	class TopState extends ihsm.State {}
	class A extends TopState  {}
	class A1 extends A { _entry() {console.log(this.name+":ENTRY");}; _exit() {console.log(this.name+":EXIT");} }
	class A11 extends A1 {}
	class A111 extends A11 { _entry() {console.log(this.name+":ENTRY");}; _exit() {console.log(this.name+":EXIT");} }
	class A2 extends A {}
	class A21 extends A2 { _entry() {console.log(this.name+":ENTRY");}; _exit() {console.log(this.name+":EXIT");} }
	class A211 extends A21 {}
	class A2111 extends A211 { _entry() {console.log(this.name+":ENTRY");}; _exit() {console.log(this.name+":EXIT");} }
	class B extends TopState {}
	class B1 extends B { _entry() {console.log(this.name+":ENTRY");}; _exit() {console.log(this.name+":EXIT");} }
	class C extends TopState {}
	class C1 extends C {}
	class C11 extends C1 {}
	class C111 extends C11 {}
	class C1111 extends C111 {}

	TopState._initialState = C;
	C._initialState = C1;
	C1._initialState = C11;
	C11._initialState = C111;
	C111._initialState = C1111;

	it('Checks nextState to another branch with common ancestor', function() {
		let t = ihsm.getTransition(A111, A211);
		expect(t.exitList).toEqual([A111, A11, A1]);
		expect(t.entryList).toEqual([A2, A21, A211]);
	});

	it('Checks nextState to ancestor', function() {
		let t = tran.getTransition(A111, A1);
		expect(t.exitList).toEqual([A111, A11]);
		expect(t.entryList).toEqual([]);
	});

	it('Checks nextState to descendant', function() {
		let t = tran.getTransition(A1, A111);
		expect(t.exitList).toEqual([]);
		expect(t.entryList).toEqual([A11, A111]);
	});

	it('Checks nextState to another branch without common ancestor', function() {
		let t = tran.getTransition(A2111, B1);
		expect(t.exitList).toEqual([A2111, A211, A21, A2, A]);
		expect(t.entryList).toEqual([B, B1]);
	});

	it('Checks nextState to self', function() {
		let t = tran.getTransition(A, A);
		expect(t.exitList).toEqual([]);
		expect(t.entryList).toEqual([]);
	});

	it('Checks nextState to a parent state', function() {
		let t = tran.getTransition(A111, C1);
		expect(t.exitList).toEqual([A111, A11, A1, A]);
		expect(t.entryList).toEqual([C, C1, C11, C111, C1111]);
	});

	it('Checks nextState to parent state which initial state is the current state', function() {
		let t = tran.getTransition(C1111, TopState);
		expect(t.exitList).toEqual([C1111, C111, C11, C1, C]);
		expect(t.entryList).toEqual([C, C1, C11, C111, C1111]);
	});

	it('Checks transition actions', function() {
		let t = tran.getTransition(A2111, B1);
		let actionList = Array.from(t.getTransitionActions());
		expect(actionList).toEqual([A2111.prototype._exit, A21.prototype._exit, B1.prototype._entry]);
	});


});
