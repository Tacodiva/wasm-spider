import { SpiderImportTable } from "./SpiderImport";
import { SpiderModule } from "./SpiderModule";

export type SpiderTable = SpiderTableDefinition | SpiderImportTable;

export class SpiderTableDefinition {

    public readonly module;
    public minSize: number;
    public maxSize: number | undefined;

    public constructor(module: SpiderModule, minSize: number, maxSize?: number) {
        this.module = module;
        this.minSize = minSize;
        this.maxSize = maxSize;
    }
}