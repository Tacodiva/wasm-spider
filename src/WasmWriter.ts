import { BinaryWriter } from "./BinaryWriter";
import { SpiderFunction } from "./SpiderFunction";
import { ISpiderInstr, OpcodeInstArgMapValues, OpcodeInstArgMap } from "./SpiderInstruction";
import { InstrList } from "./InstrList";
import { SpiderModule } from "./SpiderModule";
import { SpiderType } from "./SpiderType";
import { WasmExportType, WasmOpcode, WasmValueType } from "./enums";

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

const wasmInstructionUint32Param =
    (writer: WasmWriter, _: WasmOpcode, value: number) => writer.writeSLEB128(value);

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

    [WasmOpcode.i32_const]: (writer, _, n) => writer.writeSLEB128(n),
    [WasmOpcode.i64_const]: (writer, _, n) => writer.writeSLEB128(n),
    [WasmOpcode.f32_const]: (writer, _, z) => writer.writeF32(z),
    [WasmOpcode.f64_const]: (writer, _, z) => writer.writeF64(z),

    [WasmOpcode.local_get]: wasmInstructionUint32Param,
    [WasmOpcode.local_set]: wasmInstructionUint32Param,
    [WasmOpcode.local_tee]: wasmInstructionUint32Param
} satisfies {
        [K in keyof OpcodeInstArgMapValues]: WasmInstWriter<K>
    } as {
        [K in WasmOpcode]: K extends keyof OpcodeInstArgMapValues ? WasmInstWriter<K> : undefined
    };

export class WasmWriter extends BinaryWriter {
    private _module: SpiderModule | null = null;
    private _funcIDs: Map<SpiderFunction, number> | null = null;
    private _typeIDs: Map<SpiderType, number> | null = null;

    public constructor(parent: WasmWriter | null = null) {
        super();
        this._module = parent?._module ?? null;
        this._funcIDs = parent?._funcIDs ?? null;
        this._typeIDs = parent?._typeIDs ?? null;
    }

    public writeModule(module: SpiderModule) {
        if (this._module !== null)
            throw new Error("Already writing a module.");

        this._module = module;

        this._typeIDs = new Map();
        for (let i = 0; i < module.types.length; i++)
            this._typeIDs.set(module.types[i], i);

        this._funcIDs = new Map();
        for (let i = 0; i < module.functions.length; i++)
            this._funcIDs.set(module.functions[i], i);

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

        if (module.functions.length !== 0) {
            // Write the function section
            startSection(WasmSectionType.function);
            sectionWriter.writeULEB128(module.functions.length);
            for (const func of module.functions)
                sectionWriter.writeULEB128(this.getTypeID(func.type));
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
                        sectionWriter.writeSLEB128(this.getFunctionID(exprt.value));
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

                codeWriter.writeULEB128(func.locals.length);
                for (let i = 0; i < func.locals.length; i++) {
                    codeWriter.writeULEB128(i);
                    codeWriter.writeUint8(func.locals[i]);
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


    public getFunctionID(func: SpiderFunction): number {
        if (!this._funcIDs) throw new Error("Function IDs not allocated.");
        const id = this._funcIDs.get(func);
        if (id === undefined) throw new Error("Function not a part of the module.");
        return id;
    }

    public getTypeID(type: SpiderType): number {
        if (!this._typeIDs) throw new Error("Type IDs not allocated.");
        const id = this._typeIDs.get(type);
        if (id === undefined) throw new Error("Type not a part of the module.");
        return id;
    }
}