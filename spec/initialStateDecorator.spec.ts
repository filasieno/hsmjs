import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

describe('@initialState decorator', function() {
	it('sets TopState._isInitialState and TopState._initialState on TopState constructor', async (): Promise<void> => {
		class TopState extends ihsm.TopState {}

		@ihsm.initialState
		class A extends TopState {}

		class B extends TopState {}

		expect(ihsm.isInitialState(A)).eq(true);
		expect(ihsm.hasInitialState(A)).eq(false);
		expect(ihsm.isInitialState(B)).eq(false);
		expect(ihsm.hasInitialState(B)).eq(false);
		expect(ihsm.isInitialState(TopState)).eq(false);
		expect(ihsm.hasInitialState(TopState)).eq(true);
		expect(ihsm.getInitialState(TopState)).eq(A);
	});

	it('throws InitialStateError if @initialState is set on two or more states that have the same parent', async (): Promise<void> => {
		class TopState extends ihsm.TopState {}

		@ihsm.initialState
		class A extends TopState {}

		try {
			@ihsm.initialState
			class B extends TopState {}
			expect.fail('Should have failed');
		} catch (e) {}
	});
});