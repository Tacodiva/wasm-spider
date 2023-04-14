import { SpiderInstructions } from "./SpiderInstructions";
import { SpiderModule } from "./SpiderModule";
import { SpiderType } from "./SpiderType";
import { WasmValueType } from "./enums";

export class SpiderFunction {
    public readonly module: SpiderModule;

    public readonly type: SpiderType;
    public readonly locals: WasmValueType[];
    public readonly body: SpiderInstructions;

    public get parameters(): WasmValueType[] { return this.type.parameters; }
    public get results(): WasmValueType[] { return this.type.results; }

    public constructor(module: SpiderModule, type: SpiderType, locals: WasmValueType[] = [], body: SpiderInstructions = new SpiderInstructions()) {
        this.module = module;
        this.type = type;
        this.locals = locals;
        this.body = body;
    }

}