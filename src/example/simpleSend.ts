interface Protocol {
    hello(): Promise<any>;
    say(pre: string, post: string): void;
}

type SignalOf<Protocol> = Protocol extends { [key: string]: any } ? keyof Protocol : never;

type PayloadOf<Signal, Protocol> = Protocol extends { [key: string]: any } ? keyof Protocol : never;

type PostHandler<Sig, Protocol> = (signal: Sig, ...payload: any[]) => any

type Payload<Type extends (...payload: any[]) => any > = Type extends (...payload: infer Payload) => any ? Payload : never;

class PostMessage<Protocol = undefined> {
    post<Protocol extends { [key: string]: (...payload: any[]) => any }, Sig extends keyof Protocol, Handler extends Protocol[Sig]>(signal: Sig, ...payload: Payload<Handler>): void {

    }
}

async function main() {
    let postMessage = new PostMessage<Protocol>();
    postMessage.post("say");
}

(async () => {
    try {
        await main();
    } catch (e) {
    }
})();

