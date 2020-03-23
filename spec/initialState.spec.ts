import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

describe('@initialState decorator', function() {
	it('sets State.isInitialState and State.initialState static fields', async (): Promise<void> => {
		class TopState extends ihsm.TopState {}

		@ihsm.initialState
		class A extends TopState {}

		class B extends TopState {}

		expect(A.isInitialState).eq(true);
		expect(A.initialState).eq(undefined);
		expect(B.isInitialState).eq(false);
		expect(B.initialState).eq(undefined);
		expect(TopState.initialState).eq(A);
		expect(TopState.isInitialState).eq(false);
	});

	it('throws InitialStateError if @initialState is set on two or more states that have the same parent', async (): Promise<void> => {
		class TopState extends ihsm.TopState {}

		@ihsm.initialState
		class A extends TopState {}
		try {
			@ihsm.initialState
			class B extends TopState {}
			expect.fail('Should have failed');
		} catch (e) {
			expect(e).is.instanceOf(ihsm.InitialStateError);
		}
	});
});
