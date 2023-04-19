import { BinaryWriter } from "./BinaryWriter";
import { SpiderFunction } from "./SpiderFunction";
import { SpiderInstruction } from "./SpiderInstruction";
import { SpiderExpression } from "./SpiderExpression";
import { SpiderModule } from "./SpiderModule";
import { SpiderType } from "./SpiderType";
import { SpiderCustomSectionPosition, SpiderExportType, SpiderImportType, SpiderReferenceType, SpiderValueType, WasmBlockOpcode, WasmSectionType } from "./enums";
import { SpiderLocal, SpiderLocalReferenceType } from "./SpiderLocalReference";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";
import { SpiderTable } from "./SpiderTable";
import { SpiderElement, SpiderElementContentType, SpiderElementKind, SpiderElementMode } from "./SpiderElement";
import { SpiderData, SpiderDataType } from "./SpiderData";
import { WASM_FUNCTYPE, WASM_MAGIC, WASM_RESULT_TYPE_VOID, WASM_VERSION } from "./consts";

export interface SpiderWriteConfig {
    /**
     * When true, identical {@link SpiderType types} are merged into one type to make the outputted binary smaller.
     * Defaults to true.
     */
    readonly mergeTypes: boolean;
}

export class SpiderModuleWriter extends BinaryWriter {
    public static readonly TEXT_ENCODER = new TextEncoder();

    public readonly config: SpiderWriteConfig;

    private _module: SpiderModule | null = null;
    private _typeIndexes: Map<SpiderType, number> | null = null;
    private _functionIndexes: Map<SpiderFunction, number> | null = null;
    private _globalIndexes: Map<SpiderGlobal, number> | null = null;
    private _memoryIndexes: Map<SpiderMemory, number> | null = null;
    private _tableIndexes: Map<SpiderTable, number> | null = null;

    public constructor(config: Partial<SpiderWriteConfig>, parent: SpiderModuleWriter | null = null) {
        super();
        this.config = {
            mergeTypes: config.mergeTypes ?? true
        };
        this._module = parent?._module ?? null;
        this._typeIndexes = parent?._typeIndexes ?? null;
        this._functionIndexes = parent?._functionIndexes ?? null;
        this._globalIndexes = parent?._globalIndexes ?? null;
        this._memoryIndexes = parent?._memoryIndexes ?? null;
        this._tableIndexes = parent?._tableIndexes ?? null;
    }

    public writeModule(module: SpiderModule) {
        if (this._module !== null)
            throw new Error("Already writing a module.");

        this._module = module;

        this._typeIndexes = new Map();
        this._functionIndexes = new Map();
        this._globalIndexes = new Map();
        this._memoryIndexes = new Map();
        this._tableIndexes = new Map();

        for (const imprt of module.imports) {
            switch (imprt.importType) {
                case SpiderImportType.func:
                    this._functionIndexes.set(imprt, this._functionIndexes.size);
                    break;
                case SpiderImportType.global:
                    this._globalIndexes.set(imprt, this._globalIndexes.size);
                    break;
                case SpiderImportType.mem:
                    this._memoryIndexes.set(imprt, this._memoryIndexes.size);
                    break;
                case SpiderImportType.table:
                    this._tableIndexes.set(imprt, this._tableIndexes.size);
                    break;
            }
        }

        let mergedTypes: SpiderType[] | null = null;
        if (this.config.mergeTypes) {
            // TODO This could definitly be faster but I can't be bothered
            // TODO Unit test this when we can read WASM modules back in
            mergedTypes = [];
            types: for (let i = 0; i < module.types.length; i++) {
                const type = module.types[i];
                compare: for (let j = 0; j < mergedTypes.length; j++) {
                    const typeCompare = mergedTypes[j];

                    if (type.parameters.length !== typeCompare.parameters.length)
                        continue;
                    if (type.results.length !== typeCompare.results.length)
                        continue;
                    for (let k = 0; k < type.parameters.length; k++) {
                        if (type.parameters[j] !== typeCompare.parameters[j])
                            continue compare;
                    }
                    for (let k = 0; k < type.results.length; k++) {
                        if (type.results[j] !== typeCompare.results[j])
                            continue compare;
                    }

                    this._typeIndexes.set(type, j);
                    continue types;
                }
                this._typeIndexes.set(type, mergedTypes.length);
                mergedTypes.push(type);
            }
        } else {
            for (let i = 0; i < module.types.length; i++)
                this._typeIndexes.set(module.types[i], i);
        }

        for (let j = 0; j < module.functions.length; j++)
            this._functionIndexes.set(module.functions[j], this._functionIndexes.size);

        for (let j = 0; j < module.globals.length; j++)
            this._globalIndexes.set(module.globals[j], this._globalIndexes.size);

        for (let j = 0; j < module.memories.length; j++)
            this._memoryIndexes.set(module.memories[j], this._memoryIndexes.size);

        for (let j = 0; j < module.tables.length; j++)
            this._tableIndexes.set(module.tables[j], this._tableIndexes.size);


        const sectionWriter = new SpiderModuleWriter(this.config, this);
        const beginSection = (type: WasmSectionType) => {
            sectionWriter.reset();
            this.writeUint8(type);
        }

        const endSection = () => {
            this.writeULEB128(sectionWriter.position);
            this.write(sectionWriter.toBuffer());
        }

        this.writeUint32(WASM_MAGIC);
        this.writeUint32(WASM_VERSION);

        const writeCustomSections = (position: SpiderCustomSectionPosition) => {
            const sections = module.customSections[position];
            if (!sections) return;
            for (const section of sections) {
                beginSection(WasmSectionType.custom);
                sectionWriter.writeName(section.name);
                sectionWriter.write(section.buffer);
                endSection();
            }
        };

        writeCustomSections(SpiderCustomSectionPosition.AFTER_HEADER);

        if (module.types.length !== 0) {
            // Write the type section
            beginSection(WasmSectionType.type);
            let types = mergedTypes ?? module.types;
            sectionWriter.writeULEB128(types.length);
            for (let type of types) {
                sectionWriter.writeUint8(WASM_FUNCTYPE);

                sectionWriter.writeULEB128(type.parameters.length);
                for (const param of type.parameters)
                    sectionWriter.writeUint8(param);

                sectionWriter.writeULEB128(type.results.length);
                for (const result of type.results)
                    sectionWriter.writeUint8(result);
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_TYPE);

        if (module.imports.length !== 0) {
            // Write the imports section
            beginSection(WasmSectionType.import);
            sectionWriter.writeULEB128(module.imports.length);
            for (const imprt of module.imports) {
                sectionWriter.writeName(imprt.module);
                sectionWriter.writeName(imprt.name);
                sectionWriter.writeUint8(imprt.importType);
                switch (imprt.importType) {
                    case SpiderImportType.func:
                        sectionWriter.writeTypeIndex(imprt.type);
                        break;
                    case SpiderImportType.global:
                        sectionWriter.writeUint8(imprt.type);
                        sectionWriter.writeBoolean(imprt.mutable);
                        break;
                    case SpiderImportType.mem:
                        sectionWriter.writeLimits(imprt.minSize, imprt.maxSize);
                        break;
                    case SpiderImportType.table:
                        sectionWriter.writeUint8(imprt.type);
                        sectionWriter.writeLimits(imprt.minSize, imprt.maxSize);
                        break;
                }
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_IMPORT);

        if (module.functions.length !== 0) {
            // Write the function section
            beginSection(WasmSectionType.function);
            sectionWriter.writeULEB128(module.functions.length);
            for (const func of module.functions)
                sectionWriter.writeTypeIndex(func.type);
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_FUNCTION);

        if (module.tables.length !== 0) {
            // Write the table section
            beginSection(WasmSectionType.table);
            sectionWriter.writeULEB128(module.tables.length);
            for (const table of module.tables) {
                sectionWriter.writeUint8(table.type);
                sectionWriter.writeLimits(table.minSize, table.maxSize);
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_TABLE);

        if (module.memories.length !== 0) {
            // Write the memory section
            beginSection(WasmSectionType.memory);
            sectionWriter.writeULEB128(module.memories.length);
            for (const memory of module.memories) {
                sectionWriter.writeLimits(memory.minSize, memory.maxSize);
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_MEMORY);

        if (module.globals.length !== 0) {
            // Write the global section
            beginSection(WasmSectionType.global);
            sectionWriter.writeULEB128(module.globals.length);
            for (const global of module.globals) {
                sectionWriter.writeUint8(global.type);
                sectionWriter.writeBoolean(global.mutable);
                sectionWriter.writeExpression(global.value);
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_GLOBAL);

        if (module.exports.length !== 0) {
            // Write the export section
            beginSection(WasmSectionType.export);
            sectionWriter.writeULEB128(module.exports.length);
            for (const exprt of module.exports) {
                sectionWriter.writeName(exprt.name);
                sectionWriter.writeUint8(exprt.type);
                switch (exprt.type) {
                    case SpiderExportType.func:
                        sectionWriter.writeFunctionIndex(exprt.value);
                        break;
                    case SpiderExportType.global:
                        sectionWriter.writeGlobalIndex(exprt.value);
                        break;
                    case SpiderExportType.mem:
                        sectionWriter.writeMemoryIndex(exprt.value);
                        break;
                    case SpiderExportType.table:
                        sectionWriter.writeTableIndex(exprt.value);
                        break;
                }
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_EXPORT);

        if (module.start !== null) {
            // Write the start section
            beginSection(WasmSectionType.start);
            sectionWriter.writeFunctionIndex(module.start);
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_START);

        if (module.elements.length !== 0) {
            // Write the elements section
            beginSection(WasmSectionType.element);
            sectionWriter.writeULEB128(module.elements.length);
            for (const element of module.elements) {
                let flags = 0;
                if (element.contentType === SpiderElementContentType.EXPR) flags |= 1 << 2;
                if (element.mode === SpiderElementMode.ACTIVE) {
                    const tableidx = this.getTableIndex(element.table);

                    // Under this specific circumstance we can encode all the info more
                    //  efficiently because of backward compatibility.
                    const firstFuncrefTable =
                        tableidx === 0 &&
                        element.contentType === SpiderElementContentType.IDX &&
                        element.kind === SpiderElementKind.FUNCTIONS;
                    if (!firstFuncrefTable) flags |= 1 << 1;


                    sectionWriter.writeUint8(flags);

                    if (!firstFuncrefTable) {
                        sectionWriter.writeULEB128(tableidx); // x:tableidx
                        sectionWriter.writeExpression(element.offset); // e:expr
                        if (element.contentType === SpiderElementContentType.EXPR) {
                            sectionWriter.writeUint8(element.expressionType); // et:reftype
                        } else {
                            sectionWriter.writeUint8(element.kind); // et:elemkind
                        }
                    } else {
                        sectionWriter.writeExpression(element.offset); // e:expr
                    }
                } else {
                    flags |= 1;
                    if (element.mode === SpiderElementMode.DECLARATIVE) flags |= 1 << 1;

                    sectionWriter.writeUint8(flags);

                    if (element.contentType === SpiderElementContentType.EXPR) {
                        sectionWriter.writeUint8(element.expressionType); // et:reftype
                    } else {
                        sectionWriter.writeUint8(element.kind); // et:elemtkind
                    }
                }

                sectionWriter.writeULEB128(element.init.length);

                if (element.contentType === SpiderElementContentType.EXPR) {
                    for (const expr of element.init)
                        sectionWriter.writeExpression(expr); // el*:vec(expr)
                } else {
                    switch (element.kind) {
                        case SpiderElementKind.FUNCTIONS:
                            for (const func of element.init)
                                sectionWriter.writeFunctionIndex(func); // y*:vec(funcidx)
                            break;
                    }
                }
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_ELEMENT);

        if (module.data.length !== 0) {
            beginSection(WasmSectionType.dataCount);
            sectionWriter.writeULEB128(module.data.length);
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_DATA_COUNT);

        if (module.functions.length !== 0) {
            // Write the code section
            beginSection(WasmSectionType.code);

            const codeWriter = new SpiderModuleWriter(this.config, this);

            sectionWriter.writeULEB128(module.functions.length);
            for (const func of module.functions) {
                codeWriter.reset();

                if (func.localVariables.length !== 0) {
                    let entryCount = 1;
                    let varType = func.localVariables[0];
                    for (let i = 1; i < func.localVariables.length; i++) {
                        const local = func.localVariables[i];
                        if (local !== varType) {
                            varType = local;
                            ++entryCount;
                        }
                    }
                    codeWriter.writeULEB128(entryCount);

                    let varCount = 1;
                    varType = func.localVariables[0];
                    for (let i = 1; i < func.localVariables.length; i++) {
                        if (func.localVariables[i] !== varType) {
                            codeWriter.writeULEB128(varCount);
                            codeWriter.writeUint8(varType);
                            varType = func.localVariables[i];
                            varCount = 1;
                        } else {
                            ++varCount;
                        }
                    }
                    codeWriter.writeULEB128(varCount);
                    codeWriter.writeUint8(varType);
                } else {
                    codeWriter.writeULEB128(0);
                }

                codeWriter.writeExpression(func.body);

                sectionWriter.writeULEB128(codeWriter.position);
                sectionWriter.write(codeWriter.toBuffer());
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_CODE);

        if (module.data.length !== 0) {
            // Write the data section
            beginSection(WasmSectionType.data);
            sectionWriter.writeULEB128(module.data.length);
            for (const data of module.data) {
                if (data.type === SpiderDataType.ACTIVE) {
                    const memoryIndex = this.getMemoryIndex(data.memory);
                    if (memoryIndex === 0) {
                        sectionWriter.writeUint8(0);
                    } else {
                        sectionWriter.writeUint8(2);
                        sectionWriter.writeULEB128(memoryIndex);
                    }
                    sectionWriter.writeExpression(data.offset);
                } else {
                    sectionWriter.writeUint8(1);
                }

                sectionWriter.writeULEB128(data.buffer.length);
                sectionWriter.write(data.buffer);
            }
            endSection();
        }
        writeCustomSections(SpiderCustomSectionPosition.AFTER_DATA);

        this._module = null;
        this._typeIndexes = null;
        this._functionIndexes = null;
        this._globalIndexes = null;
        this._memoryIndexes = null;
        this._tableIndexes = null;
    }

    public writeExpression(expr: SpiderExpression, type?: SpiderValueType | typeof WASM_RESULT_TYPE_VOID, terminator: WasmBlockOpcode = WasmBlockOpcode.end) {
        if (type !== undefined) this.writeUint8(type);
        for (const inst of expr.instructions)
            this.writeInstruction(inst);
        this.writeUint8(terminator);
    }

    public writeInstruction<T extends any[] | []>(inst: SpiderInstruction<T>) {
        if (this._module == null)
            throw new Error("Not currently writing a module");
        this.writeUint8(inst.opcode.primaryOpcode);
        if (inst.opcode.secondaryOpcode !== undefined)
            this.writeULEB128(inst.opcode.secondaryOpcode)
        if (inst.opcode.binarySerializer) inst.opcode.binarySerializer[0](this, ...inst.args);
    }

    public writeName(value: string) {
        const encoded = SpiderModuleWriter.TEXT_ENCODER.encode(value);
        this.writeULEB128(encoded.byteLength);
        this.write(encoded);
    }

    public writeLimits(min: number, max?: number) {
        this.writeBoolean(max !== undefined);
        this.writeULEB128(min);
        if (max !== undefined) this.writeULEB128(max);
    }

    public writeLocalIndex(local: SpiderLocal) {
        if (typeof local === "number")
            this.writeULEB128(local);
        else if (local.refType === SpiderLocalReferenceType.PARAM)
            this.writeULEB128(local.index);
        else
            this.writeULEB128(local.index + local.func.parameters.length)
    }

    public writeFunctionIndex(func: SpiderFunction) {
        this.writeULEB128(this.getFunctionIndex(func));
    }

    public getFunctionIndex(func: SpiderFunction): number {
        if (!this._functionIndexes) throw new Error("Function indexes not allocated.");
        const id = this._functionIndexes.get(func);
        if (id === undefined) throw new Error("Function not a part of the module.");
        return id;
    }

    public writeTypeIndex(type: SpiderType) {
        this.writeULEB128(this.getTypeIndex(type));
    }

    public getTypeIndex(type: SpiderType): number {
        if (!this._typeIndexes) throw new Error("Type indexes not allocated.");
        const id = this._typeIndexes.get(type);
        if (id === undefined) throw new Error("Type not a part of the module.");
        return id;
    }

    public writeGlobalIndex(global: SpiderGlobal) {
        this.writeULEB128(this.getGlobalIndex(global));
    }

    public getGlobalIndex(global: SpiderGlobal): number {
        if (!this._globalIndexes) throw new Error("Global indexes not allocated.");
        const id = this._globalIndexes.get(global);
        if (id === undefined) throw new Error("Global not a part of the module.");
        return id;
    }

    public writeMemoryIndex(memory?: SpiderMemory) {
        this.writeULEB128(this.getMemoryIndex(memory));
    }

    public getMemoryIndex(memory?: SpiderMemory): number {
        if (!memory) return 0;
        if (!this._memoryIndexes) throw new Error("Memory indexes not allocated.");
        const id = this._memoryIndexes.get(memory);
        if (id === undefined) throw new Error("Memory not a part of the module.");
        return id;
    }

    public writeTableIndex(table: SpiderTable) {
        this.writeULEB128(this.getTableIndex(table));
    }

    public getTableIndex(table: SpiderTable): number {
        if (!this._tableIndexes) throw new Error("Table indexes not allocated.");
        const id = this._tableIndexes.get(table);
        if (id === undefined) throw new Error("Table not a part of the module.");
        return id;
    }

    public writeElementIndex(element: SpiderElement) {
        this.writeULEB128(this.getElementIndex(element));
    }

    public getElementIndex(element: SpiderElement): number {
        if (!this._module) throw new Error("Not currently writing a module");
        const id = this._module.elements.indexOf(element);
        if (id === -1) throw new Error("Element not a part of the module.");
        return id;
    }

    public writeDataIndex(data: SpiderData) {
        this.writeULEB128(this.getDataIndex(data));
    }

    public getDataIndex(data: SpiderData): number {
        if (!this._module) throw new Error("Not currently writing a module");
        const id = this._module.data.indexOf(data);
        if (id === -1) throw new Error("Data not a part of the module.");
        return id;
    }
}