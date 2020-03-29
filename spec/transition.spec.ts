import { expect } from 'chai';
import 'mocha';
import { TRACE_LEVELS } from './trace.setup';
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
	onEntry(): void {
		this.ctx.entryList.push(A);
	}
	onExit(): void {
		this.ctx.exitList.push(A);
	}
}

class A1 extends A {
	onEntry(): void {
		this.ctx.entryList.push(A1);
	}
	onExit(): void {
		this.ctx.exitList.push(A1);
	}
}

class A11 extends A1 {
	onEntry(): void {
		this.ctx.entryList.push(A11);
	}
	onExit(): void {
		this.ctx.exitList.push(A11);
	}
}

class A111 extends A11 {
	onEntry(): void {
		this.ctx.entryList.push(A111);
	}
	onExit(): void {
		this.ctx.exitList.push(A111);
	}
}

class A2 extends A {
	onEntry(): void {
		this.ctx.entryList.push(A2);
	}
	onExit(): void {
		this.ctx.exitList.push(A2);
	}
}

class A21 extends A2 {
	onEntry(): void {
		this.ctx.entryList.push(A21);
	}
	onExit(): void {
		this.ctx.exitList.push(A21);
	}
}

class A211 extends A21 {
	onEntry(): void {
		this.ctx.entryList.push(A211);
	}
	onExit(): void {
		this.ctx.exitList.push(A211);
	}
}

class A2111 extends A211 {
	onEntry(): void {
		this.ctx.entryList.push(A2111);
	}
	onExit(): void {
		this.ctx.exitList.push(A2111);
	}
}

class B extends TopState {
	onEntry(): void {
		this.ctx.entryList.push(B);
	}
	onExit(): void {
		this.ctx.exitList.push(B);
	}
}

class B1 extends B {
	onEntry(): void {
		this.ctx.entryList.push(B1);
	}
	onExit(): void {
		this.ctx.exitList.push(B1);
	}
}

@ihsm.initialState
class C extends TopState {
	onEntry(): void {
		this.ctx.entryList.push(C);
	}
	onExit(): void {
		this.ctx.exitList.push(C);
	}
}

@ihsm.initialState
class C1 extends C {
	onEntry(): void {
		this.ctx.entryList.push(C1);
	}
	onExit(): void {
		this.ctx.exitList.push(C1);
	}
}

@ihsm.initialState
class C11 extends C1 {
	onEntry(): void {
		this.ctx.entryList.push(C11);
	}
	onExit(): void {
		this.ctx.exitList.push(C11);
	}
}

@ihsm.initialState
class C111 extends C11 {
	onEntry(): void {
		this.ctx.entryList.push(C111);
	}
	onExit(): void {
		this.ctx.exitList.push(C111);
	}
}

@ihsm.initialState
class C1111 extends C111 {
	onEntry(): void {
		this.ctx.entryList.push(C1111);
	}
	onExit(): void {
		this.ctx.exitList.push(C1111);
	}
}

for (const traceLevel of TRACE_LEVELS) {
	describe(`transition (traceLevel = ${traceLevel})`, function() {
		let ctx: TransitionTrace;
		let sm: ihsm.Hsm<TransitionTrace, Protocol>;
		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel as ihsm.TraceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel as ihsm.TraceLevel);
			ctx = new TransitionTrace();
			sm = ihsm.create(TopState, ctx);
			await sm.sync();
		});

		it(`using sets the initial currentState following the @ihsm.initialState annotation directives (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async (): Promise<void> => {
			expect(sm.currentState).eq(C1111);
			expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
		});

		it(`checks nextState to another branch with common ancestor (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
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

		it(`checks nextState to ancestor (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			sm.post('transitionTo', A111);
			sm.post('transitionTo', A1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A111, A11]);
			expect(ctx.entryList).to.eql([]);
		});

		it(`checks nextState to descendant (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			sm.post('transitionTo', A111);
			sm.post('transitionTo', A1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A111, A11]);
			expect(ctx.entryList).to.eql([]);
		});

		it(`checks nextState to another branch without common ancestor (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			sm.post('transitionTo', A2111);
			sm.post('transitionTo', B1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A2111, A211, A21, A2, A]);
			expect(ctx.entryList).to.eql([B, B1]);
		});

		it(`checks nextState to self (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			sm.post('transitionTo', A);
			sm.post('transitionTo', A);
			await sm.sync();

			expect(ctx.exitList).to.eql([]);
			expect(ctx.entryList).to.eql([]);
		});

		it(`checks nextState to a parent currentState (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			sm.post('transitionTo', A111);
			sm.post('transitionTo', C1);
			await sm.sync();

			expect(ctx.exitList).to.eql([A111, A11, A1, A]);
			expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
		});

		it(`checks nextState to parent currentState which initial currentState is the current currentState (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			sm.post('transitionTo', C1111);
			sm.post('transitionTo', TopState);
			await sm.sync();

			expect(ctx.exitList).to.eql([C1111, C111, C11, C1, C]);
			expect(ctx.entryList).to.eql([C, C1, C11, C111, C1111]);
		});
	});
}
