const ihsm = require("../../main/ts");

exports.aNonStateExport = 10;

class Top extends ihsm.State { }

class A extends Top {
    request(arg1, arg2, arg3) { }
    async asyncRequest(arg) { }
}

class B extends A { static initial }
class C extends A { }
class D extends B { }

//@sample
class E extends B {

}

exports.Top = Top;
exports.A = A;
exports.B = B;
exports.C = C;
exports.D = C;
exports.E = E;

ihsm.validate(exports);
console.log("Done");
