import { OpcodeInstArgMap, ISpiderInstr } from "./SpiderInstruction";
import { WasmOpcode } from "./enums";

export class SpiderInstructions {

    public readonly instructions: ISpiderInstr[];

    public constructor() {
        this.instructions = [];
    }

    public emit<T extends WasmOpcode>(opcode: T, ...args: OpcodeInstArgMap[T]) {
        this.instructions.push({ opcode, args });
    }
    
}