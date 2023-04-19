import { SpiderImportTable } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";
import { SpiderReferenceType } from "./enums";

export type SpiderTable = SpiderTableDefinition | SpiderImportTable;

export class SpiderTableDefinition {

    public readonly module;
    public type: SpiderReferenceType;
    public minSize: number;
    public maxSize: number | undefined;

    /** @hidden */
    public constructor(module: SpiderModule, type: SpiderReferenceType, minSize: number, maxSize?: number) {
        this.module = module;
        this.type = type;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
}