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
import { SpiderData, SpiderDataActive, SpiderDataPassive, SpiderDataType } from "./SpiderData";
import { SpiderCustomSection, SpiderCustomSectionDefinition } from "./SpiderCustomSection";
import { createModule, readModule, writeModule, compileModule } from ".";

/** A description of a type to be turned into an instance of {@link SpiderType}. */
export interface SpiderTypeDesc {
    /** A list of the parameters of this type. */
    parameters?: SpiderValueType[];
    /** A list of the results of this type. Empty for types which return nothing. */
    results?: SpiderValueType[];
}

/**
 * An abstract representation of a WASM module and all of its contents.
 * 
 * Create using the {@link createModule} or {@link readModule} functions.
 * 
 * Write its contents to a WASM binary using {@link writeModule}.
 * 
 * Compile its contents to a WebAssembly.Module using {@link compileModule}.
 */
export class SpiderModule {
    /** 
     * An ordered list of types in this module.
     * Use {@link createType} to append to this list.
     */
    public readonly types: SpiderTypeDefinition[];
    /** 
     * An ordered list of all the functions in this module.
     * Use {@link createFunction} to append to this list.
     */
    public readonly functions: SpiderFunctionDefinition[];
    /** 
     * An ordered list of all the exports in this module.
     * Use {@link exportFunction}, {@link exportGlobal}, {@link exportTable}
     * or {@link exportMemory} to append to this list.
     */
    public readonly exports: SpiderExport[];
    /** 
     * An ordered list of all the imports in this module.
     * Use {@link importFunction}, {@link importGlobal}, {@link importTable}
     * or {@link importMemory} to append to this list.
     */
    public readonly imports: SpiderImport[];
    /** 
     * An ordered list of all the globals in this module.
     * Use {@link createGlobal} to append to this list.
     */
    public readonly globals: SpiderGlobalDefinition[];
    /** 
     * An ordered list of all the memories in this module.
     * Use {@link createMemory} to append to this list.
     */
    public readonly memories: SpiderMemoryDefinition[];
    /** 
     * An ordered list of all the tables in this module.
     * Use {@link createTable} to append to this list.
     */
    public readonly tables: SpiderTableDefinition[];
    /** 
     * An ordered list of all the elements in this module. 
     * Use {@link createElementFuncIdxActive}, {@link createElementFuncIdxInactive}, {@link createElementExprActive}
     *  or {@link createElementFuncIdxActive} to append to this list.
     */
    public readonly elements: SpiderElement[];
    /** 
     * An ordered list of all the data in this module.
     * Use {@link createDataActive} or {@link createDataPassive} to append to this list.
     */
    public readonly data: SpiderData[];
    /** A function to execute when this module is initialized, or null if no function is to be executed. */
    public start: SpiderFunction | null;

    /**
     * An ordered list of ordered lists of custom sections in this module.
     * The top-level list acts as a map from {@link SpiderCustomSectionPosition} to
     * an ordered list of custom sections stored at that position.
     * Use {@link createCustomSection} to add custom sections to this module and 
     * {@link getCustomSections} or {@link getCustomSectionsAt} to get sections from this list.
     */
    public readonly customSections: (SpiderCustomSection[] | undefined)[];

    /** @hidden */
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

    /**
     * Creates a new function signature type with the given parameter and result types and
     * adds it to this module.
     * @param parameters An ordered list of the parameters of this type.
     * @param results An ordered list of the results of this type.
     * @returns The new type.
     */
    public createType(parameters: SpiderValueType[] = [], ...results: SpiderValueType[]): SpiderTypeDefinition {
        const type = new SpiderTypeDefinition(this, parameters, results);
        this.types.push(type);
        return type;
    }

    /**
     * Creates a new function and adds it to this module.
     * @param type The signature of this function. Either an existing {@link SpiderTypeDefinition} or a
     * {@link SpiderTypeDesc} which describes a signature which will get created alongside the function.
     * @param vars An ordered list of the local variables to create this function we ith, empty by default.
     * @param body An expression for the body of this function, creates a new empty expression by default.
     * @returns The new function.
     */
    public createFunction(
        type?: SpiderTypeDefinition | SpiderTypeDesc,
        vars: SpiderValueType[] = [],
        body: SpiderExpression = new SpiderExpression()) {
        const func = new SpiderFunctionDefinition(this, this._getOrCreateType(type), vars, body);
        this.functions.push(func);
        return func;
    }

    /**
     * Import a function from an external module.
     * @param module The name of the module to import the function from.
     * @param name The name of the function within the module to import.
     * @param type The signature of the imported function. Either an existing {@link SpiderTypeDefinition} or a
     * {@link SpiderTypeDesc} which describes a signature which will get created alongside the import.
     * @returns The created import entry.
     */
    public importFunction(module: string, name: string, type: SpiderTypeDefinition | SpiderTypeDesc): SpiderImportFunction {
        const imprt: SpiderImportFunction = { importType: SpiderImportType.func, name, module, type: this._getOrCreateType(type) };
        this.imports.push(imprt);
        return imprt;
    }

    /**
     * @param name The name for this export, exposed to the outside world.
     * @param value The function to export.
     * @returns The created export entry.
     */
    public exportFunction(name: string, value: SpiderFunctionDefinition): SpiderExportFunction {
        const exprt: SpiderExportFunction = { type: SpiderExportType.func, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    /**
     * Creates a new global and adds it to this module.
     * @param type The type of the value held by the new global.
     * @param mutable True if the new global should be mutable.
     * @param value The default value of the global or an expression which returns the default value of the global.
     * @returns The created global
     */
    public createGlobal(type: SpiderValueType, mutable: boolean, value: SpiderExprConstValue | SpiderExpression): SpiderGlobalDefinition {
        const global = new SpiderGlobalDefinition(this, type, mutable, this._createConstexpr(type, value));
        this.globals.push(global);
        return global;
    }

    /**
     * Import a global from an external module.
     * @param module The name of the module to import the global from.
     * @param name The name of the global within the module to import.
     * @param type The type of the value held by the imported global.
     * @param mutable True if the imported global is mutable.
     * @returns The created import entry.
     */
    public importGlobal(module: string, name: string, type: SpiderValueType, mutable: boolean): SpiderImportGlobal {
        const imprt: SpiderImportGlobal = { importType: SpiderImportType.global, name, module, type: type, mutable: mutable };
        this.imports.push(imprt);
        return imprt;
    }

    /**
     * @param name The name for this export, exposed to the outside world.
     * @param value The global to export.
     * @returns The created export entry.
     */
    public exportGlobal(name: string, value: SpiderGlobalDefinition): SpiderExportGlobal {
        const exprt: SpiderExportGlobal = { type: SpiderExportType.global, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    /**
     * Creates a new memory and adds it to this module.
     * @param minSize The minimum number of pages the new memory can have. 0 by default 
     * @param maxSize The optional maximum number of pages the new memory can be grown to.
     * @returns The created memory.
     */
    public createMemory(minSize: number = 0, maxSize?: number): SpiderMemoryDefinition {
        const memory = new SpiderMemoryDefinition(this, minSize, maxSize);
        this.memories.push(memory);
        return memory;
    }

    /**
     * Import a memory from an external module.
     * @param module The name of the module to import the memory from.
     * @param name The name of the memoery within the module to import.
     * @param minSize The minimum number of pages the imported memory can have. 0 by default.
     * @param maxSize The optional maximum number of pages the imported memory can be grown to.
     * @returns The created import entry.
     */
    public importMemory(module: string, name: string, minSize: number = 0, maxSize?: number): SpiderImportMemory {
        const imprt: SpiderImportMemory = { importType: SpiderImportType.mem, name, module, minSize: minSize, maxSize: maxSize };
        this.imports.push(imprt);
        return imprt;
    }

    /**
     * @param name The name for this export, exposed to the outside world.
     * @param value The memory to export.
     * @returns The created export entry.
     */
    public exportMemory(name: string, value: SpiderMemoryDefinition): SpiderExportMemory {
        const exprt: SpiderExportMemory = { type: SpiderExportType.mem, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    /**
     * Creates a new table and adds it to this module.
     * @param type The type of reference contained in the new table.
     * @param minSize The minimum number of entries in the imported table.
     * @param maxSize The optional maximum number of entries the new table can be grown to.
     * @returns The created table.
     */
    public createTable(type: SpiderReferenceType, minSize: number, maxSize?: number): SpiderTableDefinition {
        const table = new SpiderTableDefinition(this, type, minSize, maxSize);
        this.tables.push(table);
        return table;
    }

    /**
     * Import a table from an external module.
     * @param module The name of the module to import the table from.
     * @param name The name of the table within the module to import.
     * @param type The type of reference contained in the imported table.
     * @param minSize The minimum number of entries in the imported table.
     * @param maxSize The optional maximum number of entries the imported table can be grown to.
     * @returns The created import entry.
     */
    public importTable(module: string, name: string, type: SpiderReferenceType, minSize: number, maxSize?: number): SpiderImportTable {
        const imprt: SpiderImportTable = { importType: SpiderImportType.table, name, module, type, minSize: minSize, maxSize: maxSize };
        this.imports.push(imprt);
        return imprt;
    }

    /**
     * @param name The name for this export, exposed to the outside world.
     * @param value The table to export.
     * @returns The created export entry.
     */
    public exportTable(name: string, value: SpiderTableDefinition): SpiderExportTable {
        const exprt: SpiderExportTable = { type: SpiderExportType.table, name, value };
        this.exports.push(exprt);
        return exprt;
    }

    /**
     * Creates a new {@link SpiderElementMode active} funcref element containing function indices and adds it to this module.
     * @param table The table to copy the contents of the new element into.
     * @param offset An offset within the table to copy the contents of the new element into. Either the value itself or an
     * expression which returns the value.
     * @param init The list of functions contained in the new element.
     * @returns The created element.
     */
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

    /**
     * Creates a new {@link SpiderElementMode passive} or {@link SpiderElementMode declaritive} funcref element containing
     * function indices and adds it to this module.
     * @param init The list of functions contained in the new element.
     * @param declaritive True if the new element is declaritive, otherwise the new element is passive.
     * @returns The created element.
     */
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

    /**
     * Creates a new {@link SpiderElementMode active} element of the given reference type containing expressions and adds it
     * to this module.
     * @param table The table to copy the contents of the new element into.
     * @param offset An offset within the table to copy the contents of the new element into. Either the value itself or an
     * expression which returns the value.
     * @param expressionType The type of reference contained in the new element.
     * @param init The list of expressions contained in the new element.
     * @returns The created element.
     */
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

    /**
     * Creates a new {@link SpiderElementMode passive} or {@link SpiderElementMode declaritive} elementof the given reference type
     * containing expressions and adds it to this module.
     * @param expressionType The type of reference contained in the new element.
     * @param init The list of expressions contained in the new element.
     * @param declaritive True if the new element is declaritive, otherwise the new element is passive.
     * @returns The created element.
     */
    public createElementExprInactive(expressionType: SpiderReferenceType, init: SpiderExpression[], declaritive: boolean = false) {
        const element: SpiderElementExprInactive = {
            contentType: SpiderElementContentType.EXPR,
            mode: declaritive ? SpiderElementMode.DECLARATIVE : SpiderElementMode.PASSIVE,

            init, expressionType
        };
        this.elements.push(element);
        return element;
    }

    /**
     * Creates a new {@link SpiderDataType active} data element and adds it to this module.
     * @param memory The memory to copy the contents of the new data into.
     * @param offset  An offset within the memory to copy the contents of the new data into. Either the value itself or an
     * expression which returns the value.
     * @param buffer The buffer of bytes contained in the new data.
     * @returns The created data.
     */
    public createDataActive(memory: SpiderMemory, offset: SpiderExprConstNumber | SpiderExpression, buffer: ArrayLike<number>): SpiderDataActive {
        const data: SpiderDataActive = { type: SpiderDataType.ACTIVE, memory, offset: this._createConstexpr(SpiderNumberType.i32, offset), buffer };
        this.data.push(data);
        return data;
    }

    /**
     * Creates a new {@link SpiderDataType passive} data element and adds it to this module.
     * @param buffer The buffer of bytes contained in the new data.
     * @returns The created data.
     */
    public createDataPassive(buffer: ArrayLike<number>): SpiderDataPassive {
        const data: SpiderDataPassive = { type: SpiderDataType.PASSIVE, buffer };
        this.data.push(data);
        return data;
    }

    /** A generator function which yields all the custom sections in this module. */
    public *getCustomSections(): Generator<SpiderCustomSection, void, undefined> {
        for (let i = 0; i < this.customSections.length; i++) {
            const sections = this.customSections[i];
            if (!sections) continue;
            yield* sections;
        }
    }

    /** Gets a list of the custom sections at located at position. */
    public getCustomSectionsAt(position: SpiderCustomSectionPosition): SpiderCustomSection[] {
        const sections = this.customSections[position];
        if (!sections) return this.customSections[position] = [];
        return sections;
    }

    /**
     * Creates a new custom section and adds it to this module.
     * @param name The name of the new custom section.
     * @param buffer The buffer of bytes contained in the new section.
     * @param position The location within the module to store the custom data. Defaults to the beginning.
     * @returns The created custom data.
     */
    public createCustomSection(name: string, buffer: ArrayLike<number>, position: SpiderCustomSectionPosition = SpiderCustomSectionPosition.AFTER_HEADER): SpiderCustomSectionDefinition {
        const section = new SpiderCustomSectionDefinition(this, name, buffer);
        this.getCustomSectionsAt(position).push(section);
        return section;
    }
}