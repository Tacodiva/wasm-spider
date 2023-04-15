import { OpcodeInstArgMap, SpiderInstruction } from "./SpiderInstruction";
import { WasmOpcode, WasmValueType } from "./enums";

export class SpiderExpression {
    public readonly instructions: SpiderInstruction[];

    public constructor(instructions: SpiderInstruction[] = []) {
        this.instructions = instructions;
    }

    public clear() {
        this.instructions.length = 0;
    }

    public emit<T extends WasmOpcode>(opcode: T, ...args: OpcodeInstArgMap[T]) {
        this.instructions.push({ opcode, args });
    }

    public emitConstant(type: WasmValueType, value: number) {
        this.emit(WasmOpcode.f64_const - (type & 0x3), value);
    }

    public emitBlock(blocktype?: WasmValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(WasmOpcode.block, inst, blocktype);
        return inst;
    }

    public emitLoop(blocktype?: WasmValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(WasmOpcode.loop, inst, blocktype);
        return inst;
    }

    public emitIf(blocktype?: WasmValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(WasmOpcode.if, inst, undefined, blocktype);
        return inst;
    }

    public emitIfElse(blocktype?: WasmValueType): { instrTrue: SpiderExpression, instrFalse: SpiderExpression } {
        const instrTrue = new SpiderExpression();
        const instrFalse = new SpiderExpression();
        this.emit(WasmOpcode.if, instrTrue, instrFalse, blocktype);
        return { instrTrue, instrFalse };
    }
}