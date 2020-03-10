export declare class TaskQueue {
    push(task: (doneCallback: () => void) => void): void;
}

export function createTaskQueue(): TaskQueue;
