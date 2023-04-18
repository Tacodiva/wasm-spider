import { SpiderExport, SpiderExportFunction, SpiderExportGlobal, SpiderExportMemory, SpiderExportTable } from "./SpiderExport";
import { SpiderFunction, SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderTypeDefinition } from "./SpiderType";
import { SpiderCustomSectionPosition, SpiderExportType, SpiderImportType, SpiderNumberType, SpiderReferenceType, SpiderValueType } from "./enums";
import { SpiderImport, SpiderImportFunction, SpiderImportGlobal, SpiderImportMemory, SpiderImportTable } from "./SpiderImport";
import { SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderMemory, SpiderMemoryDefinition } from "./SpiderMemory";
import { SpiderTable, SpiderTableDefinition } from "./SpiderTable";
import { SpiderElement, SpiderElementContentType, SpiderElementExprActive, SpiderElementExprInactive, SpiderElementFuncIdxActive, SpiderElementFuncIdxInactive, SpiderElementKind, SpiderElementMode } from "./SpiderElement";
import { SpiderExpression, SpiderExprConstNumber, SpiderExprConstValue } from "./SpiderExpression";
import { SpiderData, SpiderDataActive, SpiderDataPassive } from "./SpiderData";
import { SpiderCustomSection, SpiderCustomSectionDefinition } from "./SpiderCustomSection";

interface SpiderTypeDesc {
    parameters?: SpiderValueType[];
    results?: SpiderValueType[];
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
    public readonly data: SpiderData[];
    public start: SpiderFunction | null;

    public readonly customSections: (SpiderCustomSection[] | undefined)[];

    public constructor() {
        this.types = [];
        this.functions = [];
        this.exports = [];
        this.imports = [];
        this.globals = [];
        this.memories = [];
        this.tables = [];
        this.elements = [];
        this.data = [];
        this.start = null;
        this.customSections = [];
    }

    public createType(parameters: SpiderValueType[] = [], ...results: SpiderValueType[]): SpiderTypeDefinition {
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

    private _createConstexpr(type: SpiderValueType, value: SpiderExprConstValue | SpiderExpression) {
        if (value instanceof SpiderExpression) {
            return value;
        } else {
            return SpiderExpression.createConst(type, value);
        }
    }

    public createFunction(
        type?: SpiderTypeDefinition | SpiderTypeDesc,
        vars: SpiderValueType[] = [],
        body: SpiderExpression = new SpiderExpression()) {
        const func = new SpiderFunctionDefinition(this, this._getOrCreateType(type), vars, body);
        this.functions.push(func);
        return func;
    }

    public exportFunction(name: string, value: SpiderFunctionDefinition): SpiderExportFunction {
        const exprt: SpiderExportFunction = { type: SpiderExportType.func, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public importFunction(module: string, name: string, type: SpiderTypeDefinition | SpiderTypeDesc): SpiderImportFunction {
        const imprt: SpiderImportFunction = { importType: SpiderImportType.func, name, module, type: this._getOrCreateType(type) };
        this.imports.push(imprt);
        return imprt;
    }

    public createGlobal(type: SpiderValueType, mutable: boolean, value: SpiderExprConstValue | SpiderExpression): SpiderGlobalDefinition {
        const global = new SpiderGlobalDefinition(this, type, mutable, this._createConstexpr(type, value));
        this.globals.push(global);
        return global;
    }

    public importGlobal(module: string, name: string, type: SpiderValueType, mutable: boolean): SpiderImportGlobal {
        const imprt: SpiderImportGlobal = { importType: SpiderImportType.global, name, module, type: type, mutable: mutable };
        this.imports.push(imprt);
        return imprt;
    }

    public exportGlobal(name: string, value: SpiderGlobalDefinition): SpiderExportGlobal {
        const exprt: SpiderExportGlobal = { type: SpiderExportType.global, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public createMemory(minSize: number = 0, maxSize?: number): SpiderMemoryDefinition {
        const memory = new SpiderMemoryDefinition(this, minSize, maxSize);
        this.memories.push(memory);
        return memory;
    }

    public importMemory(module: string, name: string, minSize: number = 0, maxSize?: number): SpiderImportMemory {
        const imprt: SpiderImportMemory = { importType: SpiderImportType.mem, name, module, minSize: minSize, maxSize: maxSize };
        this.imports.push(imprt);
        return imprt;
    }

    public exportMemory(name: string, value: SpiderMemoryDefinition): SpiderExportMemory {
        const exprt: SpiderExportMemory = { type: SpiderExportType.mem, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public createTable(type: SpiderReferenceType, minSize: number, maxSize?: number): SpiderTableDefinition {
        const table = new SpiderTableDefinition(this, type, minSize, maxSize);
        this.tables.push(table);
        return table;
    }

    public importTable(module: string, name: string, type: SpiderReferenceType, minSize: number, maxSize?: number): SpiderImportTable {
        const imprt: SpiderImportTable = { importType: SpiderImportType.table, name, module, type, minSize: minSize, maxSize: maxSize };
        this.imports.push(imprt);
        return imprt;
    }

    public exportTable(name: string, value: SpiderTableDefinition): SpiderExportTable {
        const exprt: SpiderExportTable = { type: SpiderExportType.table, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    public createElementFuncIdxActive(
        table: SpiderTable,
        offset: SpiderExprConstNumber | SpiderExpression,
        init: SpiderFunction[]) {
        const element: SpiderElementFuncIdxActive = {
            contentType: SpiderElementContentType.IDX,
            kind: SpiderElementKind.FUNCTIONS,
            mode: SpiderElementMode.ACTIVE,

            table, offset: this._createConstexpr(SpiderNumberType.i32, offset),
            init
        };
        this.elements.push(element);
        return element;
    }

    public createElementFuncIdxInactive(init: SpiderFunction[], declaritive: boolean = false) {
        const element: SpiderElementFuncIdxInactive = {
            contentType: SpiderElementContentType.IDX,
            kind: SpiderElementKind.FUNCTIONS,
            mode: declaritive ? SpiderElementMode.DECLARATIVE : SpiderElementMode.PASSIVE,

            init
        };
        this.elements.push(element);
        return element;
    }

    public createElementExprActive(
        table: SpiderTable,
        offset: SpiderExprConstNumber | SpiderExpression,
        expressionType: SpiderReferenceType,
        init: SpiderExpression[]) {
        const element: SpiderElementExprActive = {
            contentType: SpiderElementContentType.EXPR,
            mode: SpiderElementMode.ACTIVE,

            table, offset: this._createConstexpr(SpiderNumberType.i32, offset),
            init, expressionType
        };
        this.elements.push(element);
        return element;
    }

    public createElementExprInactive(expressionType: SpiderReferenceType, init: SpiderExpression[], declaritive: boolean = false) {
        const element: SpiderElementExprInactive = {
            contentType: SpiderElementContentType.EXPR,
            mode: declaritive ? SpiderElementMode.DECLARATIVE : SpiderElementMode.PASSIVE,

            init, expressionType
        };
        this.elements.push(element);
        return element;
    }

    public createDataActive(memory: SpiderMemory, offset: SpiderExprConstNumber | SpiderExpression, buffer: ArrayLike<number>) {
        const data: SpiderDataActive = { active: true, memory, offset: this._createConstexpr(SpiderNumberType.i32, offset), buffer };
        this.data.push(data);
        return data;
    }

    public createDataPassive(buffer: ArrayLike<number>) {
        const data: SpiderDataPassive = { active: false, buffer };
        this.data.push(data);
        return data;
    }

    public getCustomSections(position: SpiderCustomSectionPosition) {
        const sections = this.customSections[position];
        if (!sections) return this.customSections[position] = [];
        return sections;
    }

    public createCustomSection(name: string, buffer: ArrayLike<number>, position: SpiderCustomSectionPosition = SpiderCustomSectionPosition.AFTER_HEADER) {
        const section = new SpiderCustomSectionDefinition(this, name, buffer);
        this.getCustomSections(position).push(section);
        return section;
    }
}