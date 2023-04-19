import { SpiderImportMemory } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";

/** A memory instance. It may be defined within this module or imported from another. */
export type SpiderMemory = SpiderMemoryDefinition | SpiderImportMemory | 0;

/** A memory instance defined within this module. */
export class SpiderMemoryDefinition {
    public readonly module: SpiderModule;

    /** The minimum number of pages this memory can have. */
    public minSize: number;
    /** The maximum number of pages this memory can be grown to. */
    public maxSize: number | undefined;

    /** @hidden */
    public constructor(module: SpiderModule, minSize: number, maxSize?: number) {
        this.module = module;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
}