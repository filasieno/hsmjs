/* eslint-disable */
import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

type Cons = new () => TopState;

class TransitionTrace {
	public initList: Cons[] = [];
	public exitList: Cons[] = [];
	public entryList: Cons[] = [];
}

interface IProtocol {
	transitionTo(s: Cons): void;
	clear(): void;
}

class TopState extends ihsm.TopState<TransitionTrace, IProtocol> {
	transitionTo(s: Cons): void {
		this.transition(s);
	}
	clear(): void {
		this.ctx.initList = [];
		this.ctx.entryList = [];
		this.ctx.exitList = [];
	}
}

class A extends TopState implements IProtocol {
	_init(): void {
		this.ctx.initList.push(A);
	}
	_entry(): void {
		this.ctx.entryList.push(A);
	}
	_exit(): void {
		this.ctx.entryList.push(A);
	}
}

class A1 extends A {
	_init(): void {
		this.ctx.initList.push(A1);
	}

	_entry(): void {
		this.ctx.entryList.push(A1);
	}
	_exit(): void {
		this.ctx.exitList.push(A1);
	}
}

class A11 extends A1 {
	_init(): void {
		this.ctx.initList.push(A11);
	}
	_entry(): void {
		this.ctx.entryList.push(A11);
	}
	_exit(): void {
		this.ctx.exitList.push(A11);
	}
}

class A111 extends A11 {
	_init(): void {
		this.ctx.initList.push(A111);
	}
	_entry(): void {
		this.ctx.entryList.push(A111);
	}
	_exit(): void {
		this.ctx.exitList.push(A111);
	}
}

class A2 extends A {
	_init(): void {
		this.ctx.initList.push(A2);
	}
	_entry(): void {
		this.ctx.entryList.push(A2);
	}
	_exit(): void {
		this.ctx.exitList.push(A2);
	}
}

class A21 extends A2 {
	_init(): void {
		this.ctx.initList.push(A21);
	}
	_entry(): void {
		this.ctx.entryList.push(A21);
	}
	_exit(): void {
		this.ctx.exitList.push(A21);
	}
}

class A211 extends A21 {
	_init(): void {
		this.ctx.initList.push(A211);
	}
	_entry(): void {
		this.ctx.entryList.push(A211);
	}
	_exit(): void {
		this.ctx.exitList.push(A211);
	}
}

class A2111 extends A211 {
	_init(): void {
		this.ctx.initList.push(A2111);
	}
	_entry(): void {
		this.ctx.entryList.push(A2111);
	}
	_exit(): void {
		this.ctx.exitList.push(A2111);
	}
}

class B extends TopState {
	_init(): void {
		this.ctx.initList.push(B);
	}
	_entry(): void {
		this.ctx.entryList.push(B);
	}
	_exit(): void {
		this.ctx.exitList.push(B);
	}
}

class B1 extends B {
	_init(): void {
		this.ctx.initList.push(B1);
	}
	_entry(): void {
		this.ctx.entryList.push(B1);
	}
	_exit(): void {
		this.ctx.exitList.push(B1);
	}
}

@ihsm.initialState
class C extends TopState {
	_init(): void {
		this.ctx.initList.push(C);
	}
	_entry(): void {
		this.ctx.entryList.push(C);
	}
	_exit(): void {
		this.ctx.exitList.push(C);
	}
}

@ihsm.initialState
class C1 extends C {
	_init(): void {
		this.ctx.initList.push(C1);
	}
	_entry(): void {
		this.ctx.entryList.push(C1);
	}
	_exit(): void {
		this.ctx.exitList.push(C1);
	}
}

@ihsm.initialState
class C11 extends C1 {
	_init(): void {
		this.ctx.initList.push(C11);
	}
	_entry(): void {
		this.ctx.entryList.push(C11);
	}
	_exit(): void {
		this.ctx.exitList.push(C11);
	}
}

@ihsm.initialState
class C111 extends C11 {
	_init(): void {
		this.ctx.initList.push(C111);
	}
	_entry(): void {
		this.ctx.entryList.push(C111);
	}
	_exit(): void {
		this.ctx.exitList.push(C111);
	}
}

@ihsm.initialState
class C1111 extends C111 {
	_init(): void {
		this.ctx.initList.push(C1111);
	}
	_entry(): void {
		this.ctx.entryList.push(C1111);
	}
	_exit(): void {
		this.ctx.exitList.push(C1111);
	}
}

describe('transition', function() {
	it('sets the initial state following the @ihsm.initialState annotation directives', async (): Promise<void> => {
		let ctx = new TransitionTrace();
		const sm = ihsm.create(TopState, ctx);
		await sm.sync();

		expect(sm.CurrentState).eq(C1111);
		const t: Cons[] = [C, C1, C11, C111, C1111];
		expect(ctx.initList.length).equals(t.length);
		for (let i = 0; i < ctx.initList.length; ++i) {
			expect(ctx.initList[i]).equals(t[i]);
		}
	});

	/**
	it('Checks nextState to another branch with common ancestor', async function() {
		const sm = ihsm.create(TopState, {});

		sm.post('clear');
		await sm.sync();

		sm.post('transitionTo', A111);
		sm.post('clear');
		await sm.sync();
		expect(sm.ctx.exitList).eq([A111, A11, A1]);
		expect(sm.ctx.entryList).eq([A2, A21, A211]);
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

	 */
});
