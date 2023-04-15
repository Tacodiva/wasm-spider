import { SpiderExpression } from "./SpiderExpression";
import { SpiderGlobal } from "./SpiderGlobal";
import { SpiderInstruction } from "./SpiderInstruction";
import { WasmOpcode, WasmValueType } from "./enums";

export class SpiderConstExpression extends SpiderExpression {

    public constructor(instructions: SpiderInstruction[] = []) {
        super(instructions);
    }

    public setTo(type: WasmValueType, value: number | SpiderGlobal) {
        if (typeof value === 'number') {
            this.setToNumber(type, value);
        } else {
            this.setToGlobal(value);
        }
    }

    public setToNumber(type: WasmValueType, value: number) {
        this.clear();
        this.emitConstant(type, value);
    }

    public setToGlobal(global: SpiderGlobal) {
        this.clear();
        this.emit(WasmOpcode.global_get, global);
    }

    public getAsNumber() {
        const firstOpcode = this.instructions[0]?.opcode;
        if (!firstOpcode)
            throw new Error("Constant expression has no value.");
        if (firstOpcode < WasmOpcode.i32_const || firstOpcode > WasmOpcode.f64_const)
            throw new Error("Cannot get the neumeric value of this constant expression. Its initalizer's first instruction is not a constant number.");
        return this.instructions[0].args[0] as number;
    }

    public getAsGlobal(): SpiderGlobal {
        const firstOpcode = this.instructions[0]?.opcode;
        if (!firstOpcode)
            throw new Error("Constant expression has no value.");
        if (firstOpcode !== WasmOpcode.global_get)
            throw new Error("Cannot get the global variable value of this constant expression. Its initalizer's first instruction is not a global variable.");
        return this.instructions[0].args[0] as SpiderGlobal;
    }
}