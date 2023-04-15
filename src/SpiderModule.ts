import { SpiderExport, SpiderExportFunction, SpiderExportGlobal, SpiderExportMemory, SpiderExportTable } from "./SpiderExport";
import { SpiderFunction, SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderExpression } from "./SpiderExpression";
import { SpiderTypeDefinition } from "./SpiderType";
import { WasmExportType, WasmImportType, WasmValueType } from "./enums";
import { SpiderImport, SpiderImportFunction, SpiderImportGlobal, SpiderImportMemory, SpiderImportTable } from "./SpiderImport";
import { SpiderGlobal, SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderMemoryDefinition } from "./SpiderMemory";
import { SpiderTable, SpiderTableDefinition } from "./SpiderTable";
import { SpiderElement, SpiderElementDefinition } from "./SpiderElement";
import { SpiderConstExpression } from "./SpiderConstExpression";

interface SpiderTypeDesc {
    parameters?: WasmValueType[];
    results?: WasmValueType[];
}

export class SpiderModule {
    public readonly types: SpiderTypeDefinition[];
    public readonly functions: SpiderFunctionDefinition[];
    public readonly exports: SpiderExport[];
    public readonly imports: SpiderImport[];
    public readonly globals: SpiderGlobalDefinition[];
    public readonly memories: SpiderMemoryDefinition[];
    public readonly tables: SpiderTableDefinition[];
    public readonly elements: SpiderElement[];
    public start: SpiderFunctionDefinition | null;

    public constructor() {
        this.types = [];
        this.functions = [];
        this.exports = [];
        this.imports = [];
        this.globals = [];
        this.memories = [];
        this.tables = [];
        this.elements = [];
        this.start = null;
    }

    public createType(parameters: WasmValueType[] = [], ...results: WasmValueType[]): SpiderTypeDefinition {
        const type = new SpiderTypeDefinition(this, parameters, results);
        this.types.push(type);
        return type;
    }

    private _getOrCreateType(type: SpiderTypeDefinition | SpiderTypeDesc | undefined) {
        if (type instanceof SpiderTypeDefinition)
            return type;
        else if (type)
            return this.createType(type.parameters, ...(type.results ?? []));
        else
            return this.createType();
    }

    public createFunction(
        type?: SpiderTypeDefinition | SpiderTypeDesc,
        vars: WasmValueType[] = [],
        body: SpiderExpression = new SpiderExpression()) {
        const func = new SpiderFunctionDefinition(this, this._getOrCreateType(type), vars, body);
        this.functions.push(func);
        return func;
    }

    public exportFunction(name: string, value: SpiderFunctionDefinition): SpiderExportFunction {
        const exprt: SpiderExportFunction = { type: WasmExportType.func, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public importFunction(module: string, name: string, type: SpiderTypeDefinition | SpiderTypeDesc): SpiderImportFunction {
        const imprt: SpiderImportFunction = { importType: WasmImportType.func, name, module, type: this._getOrCreateType(type) };
        this.imports.push(imprt);
        return imprt;
    }

    public createGlobal(type: WasmValueType, mutable: boolean, value: number | SpiderConstExpression | SpiderGlobal): SpiderGlobalDefinition {
        const global = new SpiderGlobalDefinition(this, type, mutable, value);
        this.globals.push(global);
        return global;
    }

    public importGlobal(module: string, name: string, type: WasmValueType, mutable: boolean): SpiderImportGlobal {
        const imprt: SpiderImportGlobal = { importType: WasmImportType.global, name, module, type: type, mutable: mutable };
        this.imports.push(imprt);
        return imprt;
    }

    public exportGlobal(name: string, value: SpiderGlobalDefinition): SpiderExportGlobal {
        const exprt: SpiderExportGlobal = { type: WasmExportType.global, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public createMemory(minSize: number = 0, maxSize?: number): SpiderMemoryDefinition {
        const memory = new SpiderMemoryDefinition(this, minSize, maxSize);
        this.memories.push(memory);
        return memory;
    }

    public importMemory(module: string, name: string, minSize: number = 0, maxSize?: number): SpiderImportMemory {
        const imprt: SpiderImportMemory = { importType: WasmImportType.mem, name, module, minSize: minSize, maxSize: maxSize };
        this.imports.push(imprt);
        return imprt;
    }

    public exportMemory(name: string, value: SpiderMemoryDefinition): SpiderExportMemory {
        const exprt: SpiderExportMemory = { type: WasmExportType.mem, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public createTable(minSize: number, maxSize?: number): SpiderTableDefinition {
        const table = new SpiderTableDefinition(this, minSize, maxSize);
        this.tables.push(table);
        return table;
    }

    public importTable(module: string, name: string, minSize: number, maxSize?: number): SpiderImportTable {
        const imprt: SpiderImportTable = { importType: WasmImportType.table, name, module, minSize: minSize, maxSize: maxSize };
        this.imports.push(imprt);
        return imprt;
    }

    public exportTable(name: string, value: SpiderTableDefinition): SpiderExportTable {
        const exprt: SpiderExportTable = { type: WasmExportType.table, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public createElement(
        table: SpiderTable,
        offset: number | SpiderConstExpression | SpiderGlobal,
        functions: SpiderFunction[] = []) {
        const element = new SpiderElementDefinition(this, table, offset, functions);
        this.elements.push(element);
        return element;
    }
}