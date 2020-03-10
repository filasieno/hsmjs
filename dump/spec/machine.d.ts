import * as ihsm from '../index';
export declare class Demo {
    counter: number;
    message?: string;
}
export declare namespace Machine {
    class State extends ihsm.State<State, Demo> {
        setMessage(msg: string): void;
        tick(): void;
        changeState(s: State): void;
        sendBack(value: any): Promise<any>;
        _entry(): Promise<void>;
        _exit(): Promise<void>;
    }
    class ErrorState extends State {
        onError(err: Error): Promise<void>;
    }
    class State1 extends State {
        setMessage(msg: string): void;
        tick(): void;
        _init(): void;
        _entry(): Promise<void>;
        _exit(): Promise<void>;
    }
    class State11 extends State1 {
        tick(): void;
        _entry(): Promise<void>;
        _exit(): Promise<void>;
    }
    class State12 extends State1 {
        _init(): void;
        tick(): void;
    }
    class State112 extends State12 {
        _init(): void;
        tick(): void;
        _entry(): Promise<void>;
        _exit(): Promise<void>;
    }
    class State2 extends State {
    }
}
//# sourceMappingURL=machine.d.ts.map