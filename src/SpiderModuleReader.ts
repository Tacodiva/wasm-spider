import { BinaryReader } from "./BinaryReader";
import { SpiderExpression } from "./SpiderExpression";
import { SpiderCustomSection, SpiderCustomSectionDefinition } from "./SpiderCustomSection";
import { SpiderElement, SpiderElementContentType, SpiderElementKind, SpiderElementMode } from "./SpiderElement";
import { SpiderFunction, SpiderFunctionDefinition } from "./SpiderFunction";
import { SpiderGlobal, SpiderGlobalDefinition } from "./SpiderGlobal";
import { SpiderImportFunction, SpiderImportGlobal, SpiderImportMemory, SpiderImportTable } from "./SpiderImport";
import { SpiderMemory, SpiderMemoryDefinition } from "./SpiderMemory";
import { SpiderModule } from "./SpiderModule";
import { SpiderTable, SpiderTableDefinition } from "./SpiderTable";
import { SpiderTypeDefinition } from "./SpiderType";
import { WASM_FUNCTYPE, WASM_MAGIC, WASM_VERSION } from "./consts";
import { SpiderCustomSectionPosition, SpiderExportType, SpiderImportType, SpiderReferenceType, SpiderValueType, WasmBlockOpcode, WasmSectionType } from "./enums";
import { SpiderData } from "./SpiderData";
import { SpiderInstruction } from "./SpiderInstruction";
import { OPCODE_MAP } from "./SpiderOpcode";

export class SpiderModuleReader extends BinaryReader {
    public static readonly TEXT_DECODER = new TextDecoder();

    public module: SpiderModule | null;

    private _functionImports: SpiderImportFunction[] | null;
    private _globalImports: SpiderImportGlobal[] | null;
    private _memoryImports: SpiderImportMemory[] | null;
    private _tableImports: SpiderImportTable[] | null;
    private _dataRefs: {}[] | null;

    public constructor(buffer: Uint8Array) {
        super(buffer);
        this.module = null;
        this._functionImports = null;
        this._globalImports = null;
        this._memoryImports = null;
        this._tableImports = null;
        this._dataRefs = null;
    }

    public readModule(): SpiderModule {
        const spiderModule = this.module = new SpiderModule();

        const magic = this.readUint32();
        const version = this.readUint32();
        if (magic !== WASM_MAGIC)
            throw new Error("Not a WASM module.");
        if (version !== WASM_VERSION)
            throw new Error(`Unknown WASM version 0x${version.toString(16)}`)

        let nextSection = this.readUint8();

        const readCustomSections = (position: SpiderCustomSectionPosition) => {
            if (nextSection !== WasmSectionType.custom)
                return;
            const sections: SpiderCustomSection[] = [];
            spiderModule.customSections[position] = sections;
            while (nextSection === WasmSectionType.custom) {
                const length = this.readULEB128();
                const dataStart = this.position;
                const name = this.readName();
                sections.push(new SpiderCustomSectionDefinition(spiderModule, name, this.buffer.slice(this.position, dataStart + length)));
                this.position = dataStart + length;
                nextSection = this.readUint8();
            }
        }

        readCustomSections(SpiderCustomSectionPosition.AFTER_HEADER);

        if (nextSection === WasmSectionType.type) {
            // Read the type section

            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++) {
                if (this.readUint8() !== WASM_FUNCTYPE)
                    throw new Error("Expected functype 96.");

                const paramCount = this.readULEB128();
                const params = [];
                for (let j = 0; j < paramCount; j++)
                    params.push(this.readUint8());

                const resultCount = this.readULEB128();
                const results = [];
                for (let j = 0; j < resultCount; j++)
                    results.push(this.readUint8());

                spiderModule.types.push(new SpiderTypeDefinition(spiderModule, params, results));
            }
            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_TYPE);
        }

        this._functionImports = [];
        this._globalImports = [];
        this._memoryImports = [];
        this._tableImports = [];
        this._dataRefs = [];

        if (nextSection === WasmSectionType.import) {
            // Read the imports section
            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++) {
                const module = this.readName();
                const name = this.readName();
                const importType: SpiderImportType = this.readUint8();
                let imprt;
                switch (importType) {
                    case SpiderImportType.func:
                        imprt = {
                            importType, name, module,
                            type: this.readTypeIndex()
                        };
                        this._functionImports.push(imprt);
                        break;
                    case SpiderImportType.global:
                        imprt = {
                            importType, name, module,
                            type: this.readUint8(),
                            mutable: this.readBoolean()
                        };
                        this._globalImports.push(imprt);
                        break;
                    case SpiderImportType.mem: {
                        let limits = this.readLimits();
                        imprt = {
                            importType, name, module,
                            minSize: limits.min,
                            maxSize: limits.max
                        };
                        this._memoryImports.push(imprt);
                        break;
                    } case SpiderImportType.table: {
                        const type = this.readUint8();
                        const limits = this.readLimits();
                        imprt = {
                            importType, name, module, type,
                            minSize: limits.min,
                            maxSize: limits.max
                        };
                        this._tableImports.push(imprt);
                        break;
                    }
                }
                spiderModule.imports.push(imprt);
            }
            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_IMPORT);
        }

        if (nextSection === WasmSectionType.function) {
            // Read the functions section

            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++)
                spiderModule.functions.push(new SpiderFunctionDefinition(spiderModule, this.readTypeIndex()));
            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_FUNCTION);
        }

        if (nextSection === WasmSectionType.table) {
            // Read the table section

            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++) {
                const type = this.readUint8();
                const limits = this.readLimits();
                spiderModule.tables.push(new SpiderTableDefinition(spiderModule, type, limits.min, limits.max));
            }

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_TABLE);
        }

        if (nextSection === WasmSectionType.memory) {
            // Read the memory section

            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++) {
                const limits = this.readLimits();
                spiderModule.memories.push(new SpiderMemoryDefinition(spiderModule, limits.min, limits.max));
            }

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_MEMORY);
        }

        if (nextSection == WasmSectionType.global) {
            // Read the global section

            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++) {
                const type = this.readUint8();
                const mutable = this.readBoolean();
                const value = this.readExpression().expr;
                spiderModule.globals.push(new SpiderGlobalDefinition(spiderModule, type, mutable, value));
            }

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_GLOBAL);
        }

        if (nextSection === WasmSectionType.export) {
            // Read the export section

            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++) {
                const name = this.readName();
                const type = this.readUint8();
                switch (type) {
                    case SpiderExportType.func:
                        spiderModule.exports.push({
                            name, type,
                            value: this.readFunctionIndex(true)
                        });
                        break;
                    case SpiderExportType.global:
                        spiderModule.exports.push({
                            name, type,
                            value: this.readGlobalIndex(true)
                        });
                        break;
                    case SpiderExportType.mem:
                        spiderModule.exports.push({
                            name, type,
                            value: this.readMemoryIndex(true)
                        });
                        break;
                    case SpiderExportType.table:
                        spiderModule.exports.push({
                            name, type,
                            value: this.readTableIndex(true)
                        });
                        break;
                }
            }

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_EXPORT);
        }

        if (nextSection === WasmSectionType.start) {
            // Read the start section

            this.readULEB128();
            spiderModule.start = this.readFunctionIndex();

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_START);
        }

        if (nextSection === WasmSectionType.element) {
            // Read the elements section

            this.readULEB128();
            const count = this.readULEB128();
            for (let i = 0; i < count; i++) {
                const flags = this.readUint8();
                // Sometimes I just can't be fucked anymore.
                const element: Record<string, any> = {};
                const isExpr = flags & (1 << 2);

                if (isExpr) element.contentType = SpiderElementContentType.EXPR;
                else element.contentType = SpiderElementContentType.IDX;

                if (!(flags & (1 << 0))) {
                    element.mode = SpiderElementMode.ACTIVE;

                    const firstFuncref = !(flags & (1 << 1));

                    if (!firstFuncref) {
                        element.table = this.readTableIndex();
                        element.offset = this.readExpression().expr;
                        if (isExpr) element.expressionType = this.readUint8();
                        else element.kind = this.readUint8();
                    } else {
                        element.table = this._tableImports.length === 0 ? spiderModule.tables[0] : this._tableImports[0];
                        if (!element.table) throw new Error("No table at index 0.");
                        element.offset = this.readExpression().expr;
                        if (isExpr) element.expressionType = SpiderReferenceType.funcref;
                        else element.kind = SpiderElementKind.FUNCTIONS;
                    }
                } else {
                    if (flags & (1 << 1)) element.mode = SpiderElementMode.DECLARATIVE;
                    else element.mode = SpiderElementMode.PASSIVE;
                    if (isExpr) element.expressionType = this.readUint8();
                    else element.kind = this.readUint8();
                }
                const elementCount = this.readULEB128();
                element.init = [];
                if (isExpr) {
                    for (let j = 0; j < elementCount; j++)
                        element.init.push(this.readExpression().expr);
                } else {
                    for (let j = 0; j < elementCount; j++) {
                        switch (element.kind as SpiderElementKind) {
                            case SpiderElementKind.FUNCTIONS:
                                element.init.push(this.readFunctionIndex());
                                break;
                        }
                    }
                }
                spiderModule.elements.push(element as SpiderElement);
            }

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_ELEMENT);
        }

        let dataCount = -1;
        if (nextSection === WasmSectionType.dataCount) {
            // Read the data count section

            this.readULEB128();
            dataCount = this.readULEB128();
            for (let i = 0; i < dataCount; i++)
                this._dataRefs.push({});

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_DATA_COUNT);
        }

        if (nextSection === WasmSectionType.code) {
            // Read the code section

            this.readULEB128();
            if (this.readULEB128() !== spiderModule.functions.length)
                throw new Error("Code section must have the same number of parts as the functions section.");
            for (const func of spiderModule.functions) {
                this.readULEB128();

                const localCount = this.readULEB128();
                const locals = [];
                for (let j = 0; j < localCount; j++) {
                    const repetitionCount = this.readULEB128();
                    const type = this.readUint8();
                    for (let k = 0; k < repetitionCount; k++)
                        locals.push(type);
                }
                const expr = this.readExpression();
                func.spliceLocalVariables(0, 0, ...locals);
                func.body = expr.expr;
            }

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_CODE);
        }

        if (nextSection === WasmSectionType.data) {
            // Read data section

            this.readULEB128();
            const count = this.readULEB128();
            if (dataCount === -1) {
                for (let i = 0; i < count; i++)
                    this._dataRefs.push({});
            } else if (dataCount !== count)
                throw new Error(`dataCount section count ${dataCount} different to data section count ${count}.`);

            for (const data of this._dataRefs as any[]) {
                const flags = this.readUint8();
                data.active = !(flags & (1 << 0));

                if (data.active) {
                    if (flags & (1 << 1)) {
                        data.memory = this.readMemoryIndex();
                    } else {
                        data.memory = this._memoryImports.length === 0 ? spiderModule.memories[0] : this._memoryImports[0];
                        if (!data.memory) throw new Error("No memory at index 0.");
                    }
                    data.offset = this.readExpression().expr;
                }
                const dataLength = this.readULEB128();
                data.buffer = this.read(dataLength);

                spiderModule.data.push(data as SpiderData);
            }

            nextSection = this.readUint8();
            readCustomSections(SpiderCustomSectionPosition.AFTER_DATA);
        }

        this._functionImports = null;
        this._globalImports = null;
        this._memoryImports = null;
        this._tableImports = null;
        this._dataRefs = null;
        this.module = null;

        return spiderModule;
    }

    public readName() {
        const length = this.readULEB128();
        return SpiderModuleReader.TEXT_DECODER.decode(this.read(length));
    }

    public readLimits(): { min: number, max?: number } {
        const hasMax = this.readBoolean();
        const ret: { min: number, max?: number } = { min: this.readULEB128() };
        if (hasMax) ret.max = this.readULEB128();
        return ret;
    }

    public readExpression<T extends boolean>(readType?: T): { expr: SpiderExpression, end: WasmBlockOpcode, type: T extends true ? SpiderValueType : undefined } {
        let type = undefined;
        if (readType) type = this.readUint8();
        const instructions: SpiderInstruction[] = [];

        let primaryOpcode: number = this.readUint8();
        while (primaryOpcode !== WasmBlockOpcode.end && primaryOpcode !== WasmBlockOpcode.else) {
            const entry = OPCODE_MAP[primaryOpcode];
            if (!entry) throw new Error(`No such primary opcode 0x${primaryOpcode.toString(16)}`);
            let opcode;
            if (Array.isArray(entry)) {
                const secondaryOpcode = this.readULEB128();
                opcode = entry[secondaryOpcode];
                if (!opcode) throw new Error(`No such secondary opcode 0x${primaryOpcode.toString(16)} -> ${secondaryOpcode}`);
            } else opcode = entry;

            if (opcode.binarySerializer) instructions.push({ opcode, args: opcode.binarySerializer[1](this) })
            else instructions.push({ opcode, args: [] })

            primaryOpcode = this.readUint8();
        }

        return { expr: new SpiderExpression(instructions), end: primaryOpcode, type: type as T extends true ? SpiderValueType : undefined };
    }

    public readTypeIndex(): SpiderTypeDefinition {
        if (!this.module) throw new Error("Not currently reading a module.");
        const idx = this.readULEB128();
        const val = this.module.types[idx];
        if (!val) throw new Error(`Invalid type index ${idx}`);
        return val;
    }

    public readElementIndex(): SpiderElement {
        if (!this.module) throw new Error("Not currently reading a module.");
        const idx = this.readULEB128();
        const val = this.module.elements[idx];
        if (!val) throw new Error(`Invalid element index ${idx}`);
        return val;
    }

    public readDataIndex(): SpiderData {
        if (!this._dataRefs) throw new Error("Data refs have not been assigned. Module possibly missing dataCount section.");
        const idx = this.readULEB128();
        const val = this._dataRefs[idx];
        if (!val) throw new Error(`Invalid element index ${idx}`);
        return val as SpiderData;
    }

    public readFunctionIndex<T extends boolean | undefined>(rejectImports?: T): T extends true ? SpiderFunctionDefinition : SpiderFunction {
        if (!this._functionImports) throw new Error("Function imports have not been read.");
        const idx = this.readULEB128();
        let val;
        if (idx < this._functionImports.length) {
            if (rejectImports) throw new Error(`Function index ${idx} illegally refers to an import.`);
            val = this._functionImports[idx];
        } else val = this.module!.functions[idx - this._functionImports.length];
        if (!val) throw new Error(`Invalid function index ${idx}`);
        return val as T extends true ? SpiderFunctionDefinition : SpiderFunction;
    }

    public readGlobalIndex<T extends boolean | undefined>(rejectImports?: T): T extends true ? SpiderGlobalDefinition : SpiderGlobal {
        if (!this._globalImports) throw new Error("Global imports have not been read.");
        const idx = this.readULEB128();
        let val;
        if (idx < this._globalImports.length) {
            if (rejectImports) throw new Error(`Global index ${idx} illegally refers to an import.`);
            val = this._globalImports[idx];
        } else val = this.module!.globals[idx - this._globalImports.length];
        if (!val) throw new Error(`Invalid global index ${idx}`);
        return val as T extends true ? SpiderGlobalDefinition : SpiderGlobal;
    }

    public readMemoryIndex<T extends boolean | undefined>(rejectImports?: T): T extends true ? SpiderMemoryDefinition : SpiderMemory {
        if (!this._memoryImports) throw new Error("Memory imports have not been read.");
        const idx = this.readULEB128();
        let val;
        if (idx < this._memoryImports.length) {
            if (rejectImports) throw new Error(`Memory index ${idx} illegally refers to an import.`);
            val = this._memoryImports[idx];
        } else val = this.module!.memories[idx - this._memoryImports.length];
        if (!val) throw new Error(`Invalid memory index ${idx}`);
        return val as T extends true ? SpiderMemoryDefinition : SpiderMemory;
    }

    public readTableIndex<T extends boolean | undefined>(rejectImports?: T): T extends true ? SpiderTableDefinition : SpiderTable {
        if (!this._tableImports) throw new Error("Table imports have not been read.");
        const idx = this.readULEB128();
        let val;
        if (idx < this._tableImports.length) {
            if (rejectImports) throw new Error(`Table index ${idx} illegally refers to an import.`);
            val = this._tableImports[idx];
        } else val = this.module!.tables[idx - this._tableImports.length];
        if (!val) throw new Error(`Invalid table index ${idx}`);
        return val as T extends true ? SpiderTableDefinition : SpiderTable;
    }
}