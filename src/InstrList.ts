import { OpcodeInstArgMap, ISpiderInstr } from "./SpiderInstruction";
import { WasmOpcode, WasmValueType } from "./enums";

export class InstrList {

    public readonly instructions: ISpiderInstr[];

    public constructor() {
        this.instructions = [];
    }

    public emit<T extends WasmOpcode>(opcode: T, ...args: OpcodeInstArgMap[T]) {
        this.instructions.push({ opcode, args });
    }

    public emitConstant(type: WasmValueType, value: number) {
        this.emit(WasmOpcode.f64_const - (type & 0x3), [value]);
    }

    public emitBlock(blocktype?: WasmValueType): InstrList {
        const inst = new InstrList();
        this.emit(WasmOpcode.block, inst, blocktype);
        return inst;
    }

    public emitLoop(blocktype?: WasmValueType): InstrList {
        const inst = new InstrList();
        this.emit(WasmOpcode.loop, inst, blocktype);
        return inst;
    }

    public emitIf(blocktype?: WasmValueType): InstrList {
        const inst = new InstrList();
        this.emit(WasmOpcode.if, inst, undefined, blocktype);
        return inst;
    }

    public emitIfElse(blocktype?: WasmValueType): { instrTrue: InstrList, instrFalse: InstrList } {
        const instrTrue = new InstrList();
        const instrFalse = new InstrList();
        this.emit(WasmOpcode.if, instrTrue, instrFalse, blocktype);
        return { instrTrue, instrFalse };
    }

}