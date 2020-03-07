"use strict";

let __importStar = (this && this.__importStar) || function (mod) {
	if (mod && mod.__esModule) return mod;
	let result = {};
	if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	result["default"] = mod;
	return result;
};

const ihsm = __importStar(require('../ihsm'));
const tran = __importStar(require('../transition'));

describe("A suite for testing transition objects.", () => {
	class TopState extends ihsm.State {}
	class A extends TopState {}
	class A1 extends A {}
	class A11 extends A1 {}
	class A111 extends A11 {}
	class A2 extends A {}
	class A21 extends A2 {}
	class A211 extends A21 {}
	class A2111 extends A211 {}
	class B extends TopState {}
	class B1 extends B {}
	class C extends TopState {}
	class C1 extends C {}
	class C11 extends C1 {}
	class C111 extends C11 {}
	class C1111 extends C111 {}
	C1._initialState=C11;
	C11._initialState=C111;
	C111._initialState=C1111;

	it("Checks transition to another branch with common ancestor", function () {
		let t = tran.getTransition(A111, A211);
		expect(t.exitList).toEqual([A111, A11, A1]);
		expect(t.entryList).toEqual([A2, A21, A211]);
	});

	it("Checks transition to ancestor", function () {
		let t = tran.getTransition(A111, A1);
		expect(t.exitList).toEqual([A111, A11]);
		expect(t.entryList).toEqual([]);
	});

	it("Checks transition to descendant", function () {
		let t = tran.getTransition(A1, A111);
		expect(t.exitList).toEqual([]);
		expect(t.entryList).toEqual([A11, A111]);
	});

	it("Checks transition to another branch without common ancestor", function () {
		let t = tran.getTransition(A2111, B1);
		expect(t.exitList).toEqual([A2111, A211, A21, A2, A]);
		expect(t.entryList).toEqual([B, B1]);
	});

	it("Checks transition to self", function () {
		let t = tran.getTransition(A, A);
		expect(t.exitList).toEqual([]);
		expect(t.entryList).toEqual([]);
	});

	it("Checks transition to a parent state", function () {
		let t = tran.getTransition(A111, C1);
		expect(t.exitList).toEqual([A111, A11, A1, A]);
		expect(t.entryList).toEqual([C, C1, C11, C111, C1111]);
	});

});