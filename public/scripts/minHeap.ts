export class MinHeap<T> {
    heap: T[];
    private comparator: (a: T, b: T) => number;

    constructor(comparator: (a: T, b: T) => number) {
        this.heap = [];
        this.comparator = comparator;
    }

    insert(value: T) {
        this.heap.push(value);
        this.bubbleUp(this.heap.length - 1);
    }

    pop(): T | undefined {
        if (this.heap.length === 0) return undefined;
        const poppedValue = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0 && bottom !== undefined) {
            this.heap[0] = bottom;
            this.bubbleDown(0);
        }
        return poppedValue;
    }

    private bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.comparator(this.heap[index], this.heap[parentIndex]) >= 0) break;
            [this.heap[index], this.heap[parentIndex]] = [
                this.heap[parentIndex],
                this.heap[index],
            ];
            index = parentIndex;
        }
    }

    private bubbleDown(index) {
        const length = this.heap.length;
        const element = this.heap[0];
        while (true) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
            let leftChild: T | undefined, rightChild: T | undefined;
            let swapIndex = -1;

            if (leftChildIndex < length) {
                leftChild = this.heap[leftChildIndex];
                if (this.comparator(leftChild, element) < 0) {
                    swapIndex = leftChildIndex;
                }
            }

            if (rightChildIndex < length) {
                rightChild = this.heap[rightChildIndex];
                if (
                    (swapIndex === -1 && this.comparator(rightChild, element) < 0) ||
                    (swapIndex !== -1 && this.comparator(rightChild, leftChild!) < 0)
                ) {
                    swapIndex = rightChildIndex;
                }
            }

            if (swapIndex === -1) break;
            [this.heap[index], this.heap[swapIndex]] = [
                this.heap[swapIndex],
                this.heap[index],
            ];
            index = swapIndex;
        }
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }
}
