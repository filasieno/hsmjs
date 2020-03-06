
export declare interface Queue {
    push(task: () => void): void;
}

declare function createQueue(): Queue;

