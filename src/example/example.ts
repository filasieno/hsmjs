import * as ihsm from '../ihsm';

class Pippo {
    name!: string;
}

namespace SM {

    export class TopState extends ihsm.State<Pippo> {
        async eventA(name: string) {}
        async eventB() {}
        eventC() {}
        eventD() {}
        eventE() {}
        eventI() {}
    }

    @ihsm.initialState
    export class S1 extends TopState {
        eventI() {
            return S2;
        }
    }

    export class S11 extends S1 {
    }

    export class S2 extends TopState {
    }

    @ihsm.initialState
    export class S21 extends S2 {
    }

    @ihsm.initialState
    export class S211 extends S21 {
        eventD() {
            return S211;
        }
    }

}


/*

@ihsm.initial
export class initial extends State {
    onInit() {
        this.logInfo("topState-INIT;");
        foo = 0;
        return s2;
    }
}

export class s extends ihsm.TopState {
    onInit()   { this.logInfo("s-INIT;"); return s11; }
    onEntry()  { this.logInfo("s-ENTRY;"); }
    onExit()   { this.logInfo("s-EXIT;" ); }
    onEventE() { this.logInfo("s-E;"); return s11; }
    onEventI() {
        this.logInfo("s-I;");
        if ( foo != 0 ) {
            this.logInfo("s-I;");
            foo = 0;
        }
        return null; // IGNORE
    }
}


export class s1 extends s {
    onInit()   { this.logInfo("s1-INIT;"); return s11; }
    onEntry()  { this.logInfo("s1-ENTRY;"); }
    onExit()   { this.logInfo("s1-EXIT;" ); }
    onEventA() { this.logInfo("s1-State1;"); return s1; }
    onEventB() { this.logInfo("s1-State2;"); return s11; }
    onEventC() { this.logInfo("s1-C;"); return s2; }
    onEventD() { return s11; }
}

export class s11 extends s1 {
    onEntry()  { this.logInfo("s11-ENTRY;"); }
    onExit()   { this.logInfo("s11-EXIT;" ); }

    onEventD() {
        if ( foo != 0 ) {
            this.logInfo("s11-D;");
            foo = 0;
            return s1;
        }
    }
    onEventG() { this.logInfo("s11-G;"); return s211; }
    onEventH() { this.logInfo("s11-H;"); return s; }
}


export class s2 extends State {}
export class s211 extends State {}

choice1(this: State) {
    if ( foo == 0 ) {
        this.logInfo("s1-D;");
        foo = 1;
        return s;
    }
    return
}
*/
