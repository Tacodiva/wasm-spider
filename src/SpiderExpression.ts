import { SpiderInstruction } from "./SpiderInstruction";
import { SpiderNumberType, SpiderValueType } from "./enums";
import { SpiderOpcodes, SpiderOpcode } from "./SpiderOpcode";

export class SpiderExpression {
    public readonly instructions: SpiderInstruction[];

    public constructor(instructions: SpiderInstruction[] = []) {
        this.instructions = instructions;
    }

    public clear() {
        this.instructions.length = 0;
    }

    public emit<T extends any[]>(opcode: SpiderOpcode<T>, ...args: T) {
        this.instructions.push({ opcode, args });
    }

    public emitConstant(type: SpiderNumberType, value: number) {
        switch (type) {
            case SpiderNumberType.i32:
                this.emit(SpiderOpcodes.i32_const, value);
                break;
            case SpiderNumberType.i64:
                this.emit(SpiderOpcodes.i64_const, value);
                break;
            case SpiderNumberType.f32:
                this.emit(SpiderOpcodes.f32_const, value);
                break;
            case SpiderNumberType.f64:
                this.emit(SpiderOpcodes.f64_const, value);
                break;
            default: throw new TypeError();
        }
    }

    public emitBlock(blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.block, inst, blocktype);
        return inst;
    }

    public emitLoop(blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.loop, inst, blocktype);
        return inst;
    }

    public emitIf(blocktype?: SpiderValueType): SpiderExpression {
        const inst = new SpiderExpression();
        this.emit(SpiderOpcodes.if, inst, undefined, blocktype);
        return inst;
    }

    public emitIfElse(blocktype?: SpiderValueType): { instrTrue: SpiderExpression, instrFalse: SpiderExpression } {
        const instrTrue = new SpiderExpression();
        const instrFalse = new SpiderExpression();
        this.emit(SpiderOpcodes.if, instrTrue, instrFalse, blocktype);
        return { instrTrue, instrFalse };
    }
}