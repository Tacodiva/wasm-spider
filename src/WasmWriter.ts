import { BinaryWriter } from "./BinaryWriter";
import { SpiderFunction } from "./SpiderFunction";
import { ISpiderInstr, OpcodeInstArgMapValues, OpcodeInstArgMap } from "./SpiderInstruction";
import { InstrList } from "./InstrList";
import { SpiderModule } from "./SpiderModule";
import { SpiderType } from "./SpiderType";
import { WasmExportType, WasmImportType, WasmOpcode, WasmValueType } from "./enums";
import { SpiderImportFunction, SpiderImportGlobal, SpiderImportMemory } from "./SpiderImport";
import { LocalReference, LocalReferenceType } from "./LocalReference";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderMemory } from "./SpiderMemory";

const WASM_MAGIC = 0x0061736d;
const WASM_VERSION = 0x01000000;

const WASM_FUNCTYPE = 0x60;
const WASM_RESULT_TYPE_VOID = 0x40;

const enum WasmSectionType {
    custom = 0,
    type = 1,
    import = 2,
    function = 3,
    table = 4,
    memory = 5,
    global = 6,
    export = 7,
    start = 8,
    element = 9,
    code = 10,
    data = 11,
}

const enum WasmBlockOpcode {
    else = 0x05,
    end = 0x0b
}

type WasmInstWriter<T extends WasmOpcode> =
    (writer: WasmWriter, opcode: T, ...args: OpcodeInstArgMap[T]) => void;

const wasmInstructionMemarg =
    (writer: WasmWriter, _: WasmOpcode, align: number, offset: number) => {
        writer.writeULEB128(align);
        writer.writeULEB128(offset);
    }

const WasmInstuctionWriters = {
    [WasmOpcode.block]: (writer, _, instr, blocktype) => writer.writeBlock(instr, blocktype ?? WASM_RESULT_TYPE_VOID),
    [WasmOpcode.loop]: (writer, _, instr, blocktype) => writer.writeBlock(instr, blocktype ?? WASM_RESULT_TYPE_VOID),
    [WasmOpcode.if]: (writer, _, instrTrue, instrFalse, blocktype) => {
        if (instrFalse) {
            writer.writeBlock(instrTrue, blocktype ?? WASM_RESULT_TYPE_VOID, WasmBlockOpcode.else);
            writer.writeBlock(instrFalse);
        } else {
            writer.writeBlock(instrTrue, blocktype ?? WASM_RESULT_TYPE_VOID);
        }
    },
    [WasmOpcode.call]: (writer, _, func) => writer.writeFunctionIndex(func),

    [WasmOpcode.local_get]: (writer, _, localidx) => writer.writeLocalIndex(localidx),
    [WasmOpcode.local_set]: (writer, _, localidx) => writer.writeLocalIndex(localidx),
    [WasmOpcode.local_tee]: (writer, _, localidx) => writer.writeLocalIndex(localidx),
    [WasmOpcode.global_get]: (writer, _, globalidx) => writer.writeGlobalIndex(globalidx),
    [WasmOpcode.global_set]: (writer, _, globalidx) => writer.writeGlobalIndex(globalidx),

    [WasmOpcode.i32_load]: wasmInstructionMemarg,
    [WasmOpcode.i64_load]: wasmInstructionMemarg,
    [WasmOpcode.f32_load]: wasmInstructionMemarg,
    [WasmOpcode.f64_load]: wasmInstructionMemarg,
    [WasmOpcode.i32_load8_s]: wasmInstructionMemarg,
    [WasmOpcode.i32_load8_u]: wasmInstructionMemarg,
    [WasmOpcode.i32_load16_s]: wasmInstructionMemarg,
    [WasmOpcode.i32_load16_u]: wasmInstructionMemarg,
    [WasmOpcode.i64_load8_s]: wasmInstructionMemarg,
    [WasmOpcode.i64_load8_u]: wasmInstructionMemarg,
    [WasmOpcode.i64_load16_s]: wasmInstructionMemarg,
    [WasmOpcode.i64_load16_u]: wasmInstructionMemarg,
    [WasmOpcode.i64_load32_s]: wasmInstructionMemarg,
    [WasmOpcode.i64_load32_u]: wasmInstructionMemarg,
    [WasmOpcode.i32_store]: wasmInstructionMemarg,
    [WasmOpcode.i64_store]: wasmInstructionMemarg,
    [WasmOpcode.f32_store]: wasmInstructionMemarg,
    [WasmOpcode.f64_store]: wasmInstructionMemarg,
    [WasmOpcode.i32_store8]: wasmInstructionMemarg,
    [WasmOpcode.i32_store16]: wasmInstructionMemarg,
    [WasmOpcode.i64_store8]: wasmInstructionMemarg,
    [WasmOpcode.i64_store16]: wasmInstructionMemarg,
    [WasmOpcode.i64_store32]: wasmInstructionMemarg,
    [WasmOpcode.memory_size]: (writer, _, memidx) => writer.writeMemoryIndex(memidx),
    [WasmOpcode.memory_grow]: (writer, _, memidx) => writer.writeMemoryIndex(memidx),

    [WasmOpcode.i32_const]: (writer, _, n) => writer.writeSLEB128(n),
    [WasmOpcode.i64_const]: (writer, _, n) => writer.writeSLEB128(n),
    [WasmOpcode.f32_const]: (writer, _, z) => writer.writeF32(z),
    [WasmOpcode.f64_const]: (writer, _, z) => writer.writeF64(z),
} satisfies {
        [K in keyof OpcodeInstArgMapValues]: WasmInstWriter<K>
    } as {
        [K in WasmOpcode]: K extends keyof OpcodeInstArgMapValues ? WasmInstWriter<K> : undefined
    };

export class WasmWriter extends BinaryWriter {
    private _module: SpiderModule | null = null;
    private _functionIndexes: Map<SpiderFunction | SpiderImportFunction, number> | null = null;
    private _typeIndexes: Map<SpiderType, number> | null = null;
    private _globalIndexes: Map<SpiderGlobal | SpiderImportGlobal, number> | null = null;
    private _memoryIndexes: Map<SpiderMemory | SpiderImportMemory, number> | null = null;

    public constructor(parent: WasmWriter | null = null) {
        super();
        this._module = parent?._module ?? null;
        this._functionIndexes = parent?._functionIndexes ?? null;
        this._typeIndexes = parent?._typeIndexes ?? null;
        this._globalIndexes = parent?._globalIndexes ?? null;
        this._memoryIndexes = parent?._memoryIndexes ?? null;
    }

    public writeModule(module: SpiderModule) {
        if (this._module !== null)
            throw new Error("Already writing a module.");

        this._module = module;

        this._typeIndexes = new Map();
        this._functionIndexes = new Map();
        this._globalIndexes = new Map();
        this._memoryIndexes = new Map();

        for (const imprt of module.imports) {
            switch (imprt.importType) {
                case WasmImportType.func:
                    this._functionIndexes.set(imprt, this._functionIndexes.size);
                    break;
                case WasmImportType.global:
                    this._globalIndexes.set(imprt, this._globalIndexes.size);
                    break;
                case WasmImportType.mem:
                    this._memoryIndexes.set(imprt, this._memoryIndexes.size);
                    break;
            }
        }

        for (let i = 0; i < module.types.length; i++)
            this._typeIndexes.set(module.types[i], i);

        for (let j = 0; j < module.functions.length; j++)
            this._functionIndexes.set(module.functions[j], this._functionIndexes.size);

        for (let j = 0; j < module.globals.length; j++)
            this._globalIndexes.set(module.globals[j], this._globalIndexes.size);

        for (let j = 0; j < module.memories.length; j++)
            this._memoryIndexes.set(module.memories[j], this._memoryIndexes.size);


        const sectionWriter = new WasmWriter(this);
        const startSection = (type: WasmSectionType) => {
            sectionWriter.reset();
            this.writeUint8(type);
        }

        const endSection = () => {
            this.writeULEB128(sectionWriter.position);
            this.write(sectionWriter.toBuffer());
        }

        this.writeUint32(WASM_MAGIC);
        this.writeUint32(WASM_VERSION);

        if (module.types.length !== 0) {
            // Write the type section
            startSection(WasmSectionType.type);
            sectionWriter.writeULEB128(module.types.length);
            for (const type of module.types) {
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

        if (module.imports.length !== 0) {
            // Write the imports section
            startSection(WasmSectionType.import);
            sectionWriter.writeULEB128(module.imports.length);
            for (const imprt of module.imports) {
                sectionWriter.writeName(imprt.module);
                sectionWriter.writeName(imprt.name);
                sectionWriter.writeUint8(imprt.importType);
                switch (imprt.importType) {
                    case WasmImportType.func:
                        sectionWriter.writeTypeIndex(imprt.functionType);
                        break;
                    case WasmImportType.global:
                        sectionWriter.writeUint8(imprt.globalType);
                        sectionWriter.writeBoolean(imprt.globalMutable);
                        break;
                    case WasmImportType.mem:
                        sectionWriter.writeBoolean(imprt.memoryMaxSize !== undefined);
                        sectionWriter.writeULEB128(imprt.memoryMinSize);
                        if (imprt.memoryMaxSize !== undefined)
                            sectionWriter.writeULEB128(imprt.memoryMaxSize);
                        break;
                }
            }
            endSection();
        }

        if (module.functions.length !== 0) {
            // Write the function section
            startSection(WasmSectionType.function);
            sectionWriter.writeULEB128(module.functions.length);
            for (const func of module.functions)
                sectionWriter.writeTypeIndex(func.type);
            endSection();
        }

        if (module.memories.length !== 0) {
            // Write the memories section
            startSection(WasmSectionType.memory);
            sectionWriter.writeULEB128(module.memories.length);
            for (const memory of module.memories) {
                sectionWriter.writeBoolean(memory.maxSize !== undefined);
                sectionWriter.writeULEB128(memory.minSize);
                if (memory.maxSize !== undefined)
                    sectionWriter.writeULEB128(memory.maxSize);
            }
            endSection();
        }

        if (module.globals.length !== 0) {
            // Write the global section
            startSection(WasmSectionType.global);
            sectionWriter.writeULEB128(module.globals.length);
            for (const global of module.globals) {
                sectionWriter.writeUint8(global.type);
                sectionWriter.writeBoolean(global.mutable);
                sectionWriter.writeBlock(global.initalizer);
            }
            endSection();
        }

        if (module.exports.length !== 0) {
            // Write the export section
            startSection(WasmSectionType.export);
            sectionWriter.writeULEB128(module.exports.length);
            for (const exprt of module.exports) {
                sectionWriter.writeName(exprt.name);
                sectionWriter.writeUint8(exprt.type);
                switch (exprt.type) {
                    case WasmExportType.func:
                        sectionWriter.writeFunctionIndex(exprt.value);
                        break;
                    case WasmExportType.global:
                        sectionWriter.writeGlobalIndex(exprt.value);
                        break;
                    case WasmExportType.mem:
                        sectionWriter.writeMemoryIndex(exprt.value);
                        break;
                }
            }
            endSection();
        }

        if (module.functions.length !== 0) {
            // Write the code section
            startSection(WasmSectionType.code);

            const codeWriter = new WasmWriter(this);

            sectionWriter.writeULEB128(module.functions.length);
            for (const func of module.functions) {
                codeWriter.reset();

                codeWriter.writeULEB128(func.localVariables.length);
                for (let i = 0; i < func.localVariables.length; i++) {
                    codeWriter.writeULEB128(i);
                    codeWriter.writeUint8(func.localVariables[i]);
                }

                codeWriter.writeBlock(func.body);

                sectionWriter.writeULEB128(codeWriter.position);
                sectionWriter.write(codeWriter.toBuffer());
            }
            endSection();
        }
    }

    public writeBlock(expr: InstrList, type?: WasmValueType | typeof WASM_RESULT_TYPE_VOID, terminator: WasmBlockOpcode = WasmBlockOpcode.end) {
        if (type !== undefined) this.writeUint8(type);
        this.writeInstructions(expr);
        this.writeUint8(terminator);
    }

    public writeInstructions(expr: InstrList) {
        for (const inst of expr.instructions)
            this.writeInstruction(inst);
    }

    public writeInstruction<T extends WasmOpcode>(inst: ISpiderInstr<T>) {
        if (this._module == null)
            throw new Error("Not currently writing a module");
        this.writeUint8(inst.opcode);
        const writer = WasmInstuctionWriters[inst.opcode] as WasmInstWriter<T> | undefined;
        if (writer) writer(this, inst.opcode, ...inst.args);
    }

    public writeName(value: string) {
        const encoded = BinaryWriter.TEXT_ENCODER.encode(value);
        this.writeULEB128(encoded.byteLength);
        this.write(encoded);
    }

    public writeLocalIndex(local: LocalReference) {
        if (typeof local === "number")
            this.writeULEB128(local);
        else if (local.refType === LocalReferenceType.PARAM)
            this.writeULEB128(local.index);
        else
            this.writeULEB128(local.index + local.func.parameters.length)
    }

    public writeFunctionIndex(func: SpiderFunction | SpiderImportFunction) {
        this.writeULEB128(this.getFunctionIndex(func));
    }

    public getFunctionIndex(func: SpiderFunction | SpiderImportFunction): number {
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

    public writeGlobalIndex(global: SpiderGlobal | SpiderImportGlobal) {
        this.writeULEB128(this.getGlobalIndex(global));
    }

    public getGlobalIndex(global: SpiderGlobal | SpiderImportGlobal): number {
        if (!this._globalIndexes) throw new Error("Global indexes not allocated.");
        const id = this._globalIndexes.get(global);
        if (id === undefined) throw new Error("Global not a part of the module.");
        return id;
    }

    public writeMemoryIndex(memory?: SpiderMemory | SpiderImportMemory) {
        this.writeULEB128(this.getMemoryIndex(memory));
    }

    public getMemoryIndex(memory?: SpiderMemory | SpiderImportMemory): number {
        if (!memory) return 0;
        if (!this._memoryIndexes) throw new Error("Memory indexes not allocated.");
        const id = this._memoryIndexes.get(memory);
        if (id === undefined) throw new Error("Memory not a part of the module.");
        return id;
    }
}