import { SpiderModule } from "./SpiderModule";

export class SpiderMemory {
    public readonly module: SpiderModule;

    public minSize: number;
    public maxSize: number | undefined;

    public constructor(module: SpiderModule, minSize: number, maxSize?: number) {
        this.module = module;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
}