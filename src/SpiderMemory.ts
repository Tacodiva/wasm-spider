import { SpiderImportMemory } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";

/** A memory instance. It may be defined within this module or imported from another. */
export type SpiderMemory = SpiderMemoryDefinition | SpiderImportMemory | 0;

/** A memory instance defined within this module. */
export class SpiderMemoryDefinition {
    public readonly module: SpiderModule;

    public minSize: number;
    public maxSize: number | undefined;

    /** @hidden */
    public constructor(module: SpiderModule, minSize: number, maxSize?: number) {
        this.module = module;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
}