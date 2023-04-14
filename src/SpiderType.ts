import { SpiderModule } from "./SpiderModule";
import { WasmValueType } from "./enums";

export class SpiderType {

    public readonly parameters: WasmValueType[];
    public readonly results: WasmValueType[];

    public readonly module: SpiderModule;

    public constructor(module: SpiderModule, parameters: WasmValueType[] = [], ...results: WasmValueType[]) {
        this.module = module;
        this.parameters = parameters;
        this.results = results;
    }

}