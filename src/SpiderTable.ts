import { SpiderModule } from "./SpiderModule";

export class SpiderTable {

    public readonly module;
    public minSize: number;
    public maxSize: number | undefined;

    public constructor(module: SpiderModule, minSize: number, maxSize?: number) {
        this.module = module;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
}