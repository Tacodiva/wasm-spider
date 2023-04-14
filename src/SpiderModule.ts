import { SpiderExport, SpiderExportFunction } from "./SpiderExport";
import { SpiderFunction } from "./SpiderFunction";
import { InstrList } from "./InstrList";
import { SpiderType } from "./SpiderType";
import { WasmExportType, WasmValueType } from "./enums";

export class SpiderModule {
    public readonly types: SpiderType[];
    public readonly functions: SpiderFunction[];
    public readonly exports: SpiderExport[];

    public constructor() {
        this.types = [];
        this.functions = [];
        this.exports = [];
    }

    public createType(parameters: WasmValueType[] = [], ...results: WasmValueType[]): SpiderType {
        const type = new SpiderType(this, parameters, ...results);
        this.types.push(type);
        return type;
    }

    public createFunction(
        type?: SpiderType | { parameters?: WasmValueType[], results?: WasmValueType[] },
        locals: WasmValueType[] = [],
        body: InstrList = new InstrList()) {
        let spiderType;
        if (type instanceof SpiderType)
            spiderType = type;
        else if (type)
            spiderType = this.createType(type.parameters, ...(type.results ?? []));
        else
            spiderType = this.createType();
        const func = new SpiderFunction(this, spiderType, locals, body);
        this.functions.push(func);
        return func;
    }

    public createExport(name: string, value: SpiderFunction): SpiderExportFunction {
        const exprt: SpiderExportFunction = { type: WasmExportType.func, name, value };
        this.exports.push(exprt);
        return exprt;
    }
}