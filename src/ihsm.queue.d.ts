export declare class Queue {
    push(task: () => void): void;
}

declare function create(): Queue;

