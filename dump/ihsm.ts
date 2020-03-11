export type PostEvent<EventHandler> = EventHandler extends (...args: any[]) => void | Promise<any> ? (...payload: any[]) => void : never;
export type SendEvent<EventHandler> = EventHandler extends (...args: any[]) => infer C ? C extends void ? (...payload: any[]) => Promise<void> : C extends Promise<infer RT> ? (...payload: any[]) => Promise<RT> : never : never;
export type PostProtocol<UserTopState extends State<UserData>, UserData> = { [P in keyof UserTopState]: SendEvent<UserTopState[P]> };
export type SendProtocol<UserTopState extends State<UserData>, UserData> = { [P in keyof UserTopState]: PostEvent<UserTopState[P]> };

export interface IBoundHsm<UserTopState extends State<UserData>, UserData> {
    post(eventName: string, ...args: any[]): void;
    transition<UserData>(nextState: State<UserData>): void;
}

export abstract class State<UserData = { [key: string]: any }> implements IBoundHsm<State<UserData>, UserData>{
    protected ctx!: UserData;

    protected abstract _init(args: any[]): Promise<void> | void;
    protected _entry(): Promise<void> | void { }
    protected _exit(): Promise<void> | void { }

    post(eventName: string, ...args: any[]): void {
    }

    transition<UserData>(nextState: State<UserData>): void {
    }

}

export interface IHsm<UserTopState extends State<UserData>, UserData> {
    //post: SendProtocol<UserTopState>;
    //send: SendProtocol<UserTopState>;
    postMsg(name: string, args: any[]): void;
    sendMsg(name: string, args: any[]): Promise<any>;
}

// function setProperty<
//     UserData,
//     UserTopState extends State<UserData>,
//     Extension extends {[key: string]: IHsm<UserTopState, UserData>},
//     Key extends keyof UserData
// >//
// (userData: UserData, propertyName: Key): UserData[Key] {
//     // o[propertyName] is of type UserData[Key]
//     return userData[propertyName];
// }
//
// // type hsmKeyType<UserData, Key extends keyof UserData> =
//
// function initActor<UserData extends { new (...args: any[]): UserData }, Key extends (keyof UserData)>(constructor: UserData, hsmField: HsmKey = "hsm") {
//     return class extends constructor {
//
//     }
// }
//    return class extends constructor {
//        __ihsm_hsm__ = new Hsm<State<any>>();
//        constructor(...args: any[]) {
//            super(...args);
//            this.__ihsm_hsm__.ctx = this;
//            this.__ihsm_hsm__.postMsg('_init', args);
//            let self = this;
//            Object.defineProperty(self, hsmField, {
//                get: function () { return self.__ihsm_hsm__ },
//                set: function (newValue) { throw new Error(`Field '${hsmField}' is readonly`) }
//            });
//        }
//    };
//
type Constructor<T> = new (...args: any[]) => any;

export function init<UserData extends Pick<UserData, Key>, Key = 'hsm'>(c: Constructor<UserData>) {


}


export class Hsm<TopState extends State<UserData>, UserData> implements IHsm<TopState, UserData>, IBoundHsm<TopState, UserData> {
    // send!: SendProtocol<TopState>;
    // post!: SendProtocol<TopState>;
    ctx!: UserData;
    hsm!: Hsm<TopState, UserData>;
    currentState!: State<any>;
    nextState!: State<any>;

    constructor() {

    }

    setContext(context: any) {
        this.ctx = context;
    }

    init() {
        // Execute initialization
    }

    postMsg(name: string, args: any[]) {

    }

    async sendMsg(name: string, args: any[]) {

    }
    post(eventName: string, ...args: any[]): void {
    }


}

class BoundHsm {

}


class TopState extends State<TopState, Greeter> {
    hello(): void {
        console.log("hello");
    }
    protected _init(args: any[]): Promise<void> | void {
        return undefined;
    }
}

function sample() {

}

@sample
function {

}

class Greeter {
    //@ihsm.init
    readonly hsm!: IHsm<TopState>;
    constructor(private hello = "x") { }
}

function main() {
    let d = new Greeter();
    console.log(d);
    //d.actor.send.hello();
}

setTimeout(main, 1000);
