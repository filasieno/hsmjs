export class UserParentComponent {

    private readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    sayName() {
        console.log(this.name)
    }
}

export class UserClass extends UserParentComponent {

    private readonly surname: string;

    constructor(name: string, surname: string) {
        super(name);
        this.surname = surname;
    }

    saySurname() {
        console.log(this.surname)
    }
}