import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

type Cons = new () => TopState;

class TransitionTrace {
	public exitList: Cons[] = [];
	public entryList: Cons[] = [];
}

interface Protocol {
	transitionTo(s: Cons): void;
	clear(): void;
}

class TopState extends ihsm.TopState<TransitionTrace, Protocol> implements Protocol {
	transitionTo(s: Cons): void {
		this.clear();
		this.transition(s);
	}
	clear(): void {
		this.ctx.entryList = [];
		this.ctx.exitList = [];
	}
}

class A extends TopState implements Protocol {
	_entry(): void {
		this.ctx.entryList.push(A);
	}
	_exit(): void {
		this.ctx.exitList.push(A);
	}
}

class A1 extends A {
	_entry(): void {
		this.ctx.entryList.push(A1);
	}
	_exit(): void {
		this.ctx.exitList.push(A1);
	}
}

class A11 extends A1 {
	_entry(): void {
		this.ctx.entryList.push(A11);
	}
	_exit(): void {
		this.ctx.exitList.push(A11);
	}
}

class A111 extends A11 {
	_entry(): void {
		this.ctx.entryList.push(A111);
	}
	_exit(): void {
		this.ctx.exitList.push(A111);
	}
}

class A2 extends A {
	_entry(): void {
		this.ctx.entryList.push(A2);
	}
	_exit(): void {
		this.ctx.exitList.push(A2);
	}
}

class A21 extends A2 {
	_entry(): void {
		this.ctx.entryList.push(A21);
	}
	_exit(): void {
		this.ctx.exitList.push(A21);
	}
}

class A211 extends A21 {
	_entry(): void {
		this.ctx.entryList.push(A211);
	}
	_exit(): void {
		this.ctx.exitList.push(A211);
	}
}

class A2111 extends A211 {
	_entry(): void {
		this.ctx.entryList.push(A2111);
	}
	_exit(): void {
		this.ctx.exitList.push(A2111);
	}
}

class B extends TopState {
	_entry(): void {
		this.ctx.entryList.push(B);
	}
	_exit(): void {
		this.ctx.exitList.push(B);
	}
}

class B1 extends B {
	_entry(): void {
		this.ctx.entryList.push(B1);
	}
	_exit(): void {
		this.ctx.exitList.push(B1);
	}
}

@ihsm.initialState
class C extends TopState {
	_entry(): void {
		this.ctx.entryList.push(C);
	}
	_exit(): void {
		this.ctx.exitList.push(C);
	}
}

@ihsm.initialState
class C1 extends C {
	_entry(): void {
		this.ctx.entryList.push(C1);
	}
	_exit(): void {
		this.ctx.exitList.push(C1);
	}
}

@ihsm.initialState
class C11 extends C1 {
	_entry(): void {
		this.ctx.entryList.push(C11);
	}
	_exit(): void {
		this.ctx.exitList.push(C11);
	}
}

@ihsm.initialState
class C111 extends C11 {
	_entry(): void {
		this.ctx.entryList.push(C111);
	}
	_exit(): void {
		this.ctx.exitList.push(C111);
	}
}

@ihsm.initialState
class C1111 extends C111 {
	_entry(): void {
		this.ctx.entryList.push(C1111);
	}
	_exit(): void {
		this.ctx.exitList.push(C1111);
	}
}

function generateTransitionTest(traceLevel: ihsm.TraceLevel) {
	return function() {
		let ctx: TransitionTrace;
		let sm: ihsm.Hsm<TransitionTrace, Protocol>;
		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel);
			ctx = new TransitionTrace();
			sm = ihsm.createHsm(TopState, ctx);
			await sm.sync();
		});

		it(`using sets the initial currentState following the @ihsm.initialState annotation directives (traceLevel:'${traceLevel}')`, async (): Promise<void> => {
			expect(sm.currentState).eq(C1111);
			expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
		});

		it(`checks nextState to another branch with common ancestor (traceLevel:'${traceLevel}')`, async () => {
			sm.post('transitionTo', A111);
			await sm.sync();

			expect(sm.currentStateName).eq('A111');
			expect(sm.currentState).eq(A111);

			sm.post('transitionTo', A211);
			await sm.sync();

			expect(sm.currentStateName, 'A211');
			expect(sm.currentState).eq(A211);

			expect(ctx.exitList).to.eql([A111, A11, A1]);
			expect(ctx.entryList).to.eql([A2, A21, A211]);
		});

		it(`checks nextState to ancestor (traceLevel:'${traceLevel}')`, async () => {
			sm.post('transitionTo', A111);
			sm.post('transitionTo', A1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A111, A11]);
			expect(ctx.entryList).to.eql([]);
		});

		it(`checks nextState to descendant (traceLevel:'${traceLevel}')`, async () => {
			sm.post('transitionTo', A111);
			sm.post('transitionTo', A1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A111, A11]);
			expect(ctx.entryList).to.eql([]);
		});

		it(`checks nextState to another branch without common ancestor (traceLevel:'${traceLevel}')`, async () => {
			sm.post('transitionTo', A2111);
			sm.post('transitionTo', B1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A2111, A211, A21, A2, A]);
			expect(ctx.entryList).to.eql([B, B1]);
		});

		it(`checks nextState to self (traceLevel:'${traceLevel}')`, async () => {
			sm.post('transitionTo', A);
			sm.post('transitionTo', A);
			await sm.sync();

			expect(ctx.exitList).to.eql([]);
			expect(ctx.entryList).to.eql([]);
		});

		it(`checks nextState to a parent currentState (traceLevel:'${traceLevel}')`, async () => {
			sm.post('transitionTo', A111);
			sm.post('transitionTo', C1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A111, A11, A1, A]);
			expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
		});

		it(`checks nextState to parent currentState which initial currentState is the current currentState (traceLevel:'${traceLevel}')`, async () => {
			sm.post('transitionTo', C1111);
			sm.post('transitionTo', TopState);
			await sm.sync();

			expect(ctx.exitList).to.eql([C1111, C111, C11, C1, C]);
			expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
		});
	};
}

for (const traceLevel of Object.values(ihsm.TraceLevel)) {
	describe(`transition spec with traceLevel = ${traceLevel}`, generateTransitionTest(traceLevel as ihsm.TraceLevel));
}
