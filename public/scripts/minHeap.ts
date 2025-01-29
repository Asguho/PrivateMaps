export class MinHeap {
  data: any;
  compare: (a: any, b: any) => number;
  constructor(compare: (a: any, b: any) => number) {
    this.data = [];
    this.compare = compare;
  }

  insert(value: any) {
    this.data.push(value);
    this.bubbleUp(this.data.length - 1);
  }

  pop() {
    if (this.data.length === 1) return this.data.pop();
    const root = this.data[0];
    this.data[0] = this.data.pop();
    this.bubbleDown(0);
    return root;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.data[index], this.data[parentIndex]) >= 0) break;
      [this.data[index], this.data[parentIndex]] = [this.data[parentIndex], this.data[index]];
      index = parentIndex;
    }
  }

  bubbleDown(index: number) {
    const length = this.data.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.data[index], this.data[smallest]] = [this.data[smallest], this.data[index]];
      index = smallest;
    }
  }
}
