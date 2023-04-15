import { SpiderExport, SpiderExportFunction } from "./SpiderExport";
import { SpiderFunction } from "./SpiderFunction";
import { InstrList } from "./InstrList";
import { SpiderType } from "./SpiderType";
import { WasmExportType, WasmImportType, WasmValueType } from "./enums";
import { SpiderImport, SpiderImportFunction } from "./SpiderImport";

interface SpiderTypeDesc {
    parameters?: WasmValueType[];
    results?: WasmValueType[];
}

export class SpiderModule {
    public readonly types: SpiderType[];
    public readonly functions: SpiderFunction[];
    public readonly exports: SpiderExport[];
    public readonly imports: SpiderImport[];

    public constructor() {
        this.types = [];
        this.functions = [];
        this.exports = [];
        this.imports = [];
    }

    public createType(parameters: WasmValueType[] = [], ...results: WasmValueType[]): SpiderType {
        const type = new SpiderType(this, parameters, ...results);
        this.types.push(type);
        return type;
    }

    private _getOrCreateType(type: SpiderType | SpiderTypeDesc | undefined) {
        if (type instanceof SpiderType)
            return type;
        else if (type)
            return this.createType(type.parameters, ...(type.results ?? []));
        else
            return this.createType();
    }

    public createFunction(
        type?: SpiderType | SpiderTypeDesc,
        locals: WasmValueType[] = [],
        body: InstrList = new InstrList()) {
        const func = new SpiderFunction(this, this._getOrCreateType(type), locals, body);
        this.functions.push(func);
        return func;
    }

    public exportFunction(name: string, value: SpiderFunction): SpiderExportFunction {
        const exprt: SpiderExportFunction = { type: WasmExportType.func, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public importFunction(module: string, name: string, type?: SpiderType | SpiderTypeDesc): SpiderImportFunction {
        const imprt: SpiderImportFunction = { importType: WasmImportType.func, name, module, functionType: this._getOrCreateType(type) };
        this.imports.push(imprt);
        return imprt;
    }
}