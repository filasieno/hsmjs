/* eslint-disable */
import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

type Cons = new () => TopState;

ihsm.configureTraceLevel('debug');

class TransitionTrace {
	public initList: Cons[] = [];
	public exitList: Cons[] = [];
	public entryList: Cons[] = [];
}

interface IProtocol {
	transitionTo(s: Cons): void;
	clear(): void;
}

class TopState extends ihsm.TopState<TransitionTrace, IProtocol> implements IProtocol {
	transitionTo(s: Cons): void {
		this.clear();
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
		this.ctx.exitList.push(A);
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
	let ctx: TransitionTrace;
	let sm: ihsm.IHsm<TransitionTrace, IProtocol>;

	beforeEach(async () => {
		ctx = new TransitionTrace();
		sm = ihsm.create(TopState, ctx);
		await sm.sync();
	});

	it('sets the initial state following the @ihsm.initialState annotation directives', async (): Promise<void> => {
		expect(sm.state).eq(C1111);
		expect(ctx.initList).to.eql([C, C1, C11, C111, C1111]);
		expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
	});

	it('checks nextState to another branch with common ancestor', async () => {
		sm.post('transitionTo', A111);
		await sm.sync();

		expect(sm.stateName).eq('A111');
		expect(sm.state).eq(A111);

		sm.post('transitionTo', A211);
		await sm.sync();

		expect(sm.stateName, 'A211');
		expect(sm.state).eq(A211);

		expect(ctx.exitList).to.eql([A111, A11, A1]);
		expect(ctx.entryList).to.eql([A2, A21, A211]);
	});

	it('checks nextState to ancestor', async () => {
		sm.post('transitionTo', A111);
		sm.post('transitionTo', A1);
		await sm.sync();

		expect(ctx.exitList).to.eql([A111, A11]);
		expect(ctx.entryList).to.eql([]);
	});

	it('checks nextState to descendant', async () => {
		sm.post('transitionTo', A111);
		sm.post('transitionTo', A1);
		await sm.sync();

		expect(ctx.exitList).to.eql([A111, A11]);
		expect(ctx.entryList).to.eql([]);
	});

	it('checks nextState to another branch without common ancestor', async () => {
		sm.post('transitionTo', A2111);
		sm.post('transitionTo', B1);
		await sm.sync();

		expect(ctx.exitList).to.eql([A2111, A211, A21, A2, A]);
		expect(ctx.entryList).to.eql([B, B1]);
	});

	it('checks nextState to self', async () => {
		sm.post('transitionTo', A);
		sm.post('transitionTo', A);
		await sm.sync();

		expect(ctx.exitList).to.eql([]);
		expect(ctx.entryList).to.eql([]);
	});

	it('checks nextState to a parent state', async () => {
		sm.post('transitionTo', A111);
		sm.post('transitionTo', C1);
		await sm.sync();

		expect(ctx.exitList).to.eql([A111, A11, A1, A]);
		expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
	});

	it('checks nextState to parent state which initial state is the current state', async () => {
		sm.post('transitionTo', C1111);
		sm.post('transitionTo', TopState);
		await sm.sync();

		expect(ctx.exitList).to.eql([C1111, C111, C11, C1, C]);
		expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
	});
});
