export class User {
    //currentPrivateContact: any = "";
    id: String = "";
    calling: boolean;

    constructor(id: String, calling: boolean) {
        this.id = id;
        this.calling = calling;
    }
}
