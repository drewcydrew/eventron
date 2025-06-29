declare module 'simjs' {
  export class Sim {
    constructor();
    start(): void;
    stop(): void;
    time(): number;
    schedule(callback: () => void, delay: number): void;
  }
}
