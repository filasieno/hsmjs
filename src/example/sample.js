class ParentX {
    insideParentX() {}
}

class X extends ParentX {
    payload = "message";
    insideX() {}
}


let o = X;
console.log(o.prototype.insideX.name);
