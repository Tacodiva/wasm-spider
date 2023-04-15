import { SpiderExport, SpiderExportFunction, SpiderExportGlobal, SpiderExportMemory } from "./SpiderExport";
import { SpiderFunction } from "./SpiderFunction";
import { InstrList } from "./InstrList";
import { SpiderType } from "./SpiderType";
import { WasmExportType, WasmImportType, WasmValueType } from "./enums";
import { SpiderImport, SpiderImportFunction, SpiderImportGlobal, SpiderImportMemory } from "./SpiderImport";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";

interface SpiderTypeDesc {
    parameters?: WasmValueType[];
    results?: WasmValueType[];
}

export class SpiderModule {
    public readonly types: SpiderType[];
    public readonly functions: SpiderFunction[];
    public readonly exports: SpiderExport[];
    public readonly imports: SpiderImport[];
    public readonly globals: SpiderGlobal[];
    public readonly memories: SpiderMemory[];

    public constructor() {
        this.types = [];
        this.functions = [];
        this.exports = [];
        this.imports = [];
        this.globals = [];
        this.memories = [];
    }

    public createType(parameters: WasmValueType[] = [], ...results: WasmValueType[]): SpiderType {
        const type = new SpiderType(this, parameters, results);
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
        vars: WasmValueType[] = [],
        body: InstrList = new InstrList()) {
        const func = new SpiderFunction(this, this._getOrCreateType(type), vars, body);
        this.functions.push(func);
        return func;
    }

    public exportFunction(name: string, value: SpiderFunction): SpiderExportFunction {
        const exprt: SpiderExportFunction = { type: WasmExportType.func, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public importFunction(module: string, name: string, type: SpiderType | SpiderTypeDesc): SpiderImportFunction {
        const imprt: SpiderImportFunction = { importType: WasmImportType.func, name, module, functionType: this._getOrCreateType(type) };
        this.imports.push(imprt);
        return imprt;
    }

    public createGlobal(type: WasmValueType, mutable: boolean, value: number): SpiderGlobal {
        const global = new SpiderGlobal(this, type, mutable, value);
        this.globals.push(global);
        return global;
    }

    public importGlobal(module: string, name: string, type: WasmValueType, mutable: boolean): SpiderImportGlobal {
        const imprt: SpiderImportGlobal = { importType: WasmImportType.global, name, module, globalType: type, globalMutable: mutable };
        this.imports.push(imprt);
        return imprt;
    }

    public exportGlobal(name: string, value: SpiderGlobal): SpiderExportGlobal {
        const exprt: SpiderExportGlobal = { type: WasmExportType.global, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public createMemory(minSize: number = 0, maxSize?: number): SpiderMemory {
        const memory = new SpiderMemory(this, minSize, maxSize);
        this.memories.push(memory);
        return memory;
    }

    public importMemory(module: string, name: string, minSize: number = 0, maxSize?: number): SpiderImportMemory {
        const imprt: SpiderImportMemory = { importType: WasmImportType.mem, name, module, memoryMinSize: minSize, memoryMaxSize: maxSize };
        this.imports.push(imprt);
        return imprt;
    }

    public exportMemory(name: string, value: SpiderMemory): SpiderExportMemory {
        const exprt: SpiderExportMemory = { type: WasmExportType.mem, name, value };
        this.exports.push(exprt);
        return exprt;
    }
}