import { SpiderImportTable } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderReferenceType } from "./enums";

/** A table, which can be thought of as a memory for reference types. */
export type SpiderTable = SpiderTableDefinition | SpiderImportTable;

/** A table, which can be thought of as a memory for reference types, defined within this module. */
export class SpiderTableDefinition {
    public readonly module;

    /** The type of reference this table contains. */
    public type: SpiderReferenceType;
    /** The inital number of entries in this table. */
    public minSize: number;
    /** The maximum number of entries this table can grow to contain. */
    public maxSize: number | undefined;

    /** @hidden */
    public constructor(module: SpiderModule, type: SpiderReferenceType, minSize: number, maxSize?: number) {
        this.module = module;
        this.type = type;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
}