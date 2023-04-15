import { WasmOpcode, WasmValueType, spider } from "../src";
import { InstrList } from "../src/InstrList";

describe("Instruction Utils", () => {
    test('emitConstant', async () => {
        const inst = new InstrList();

        inst.emitConstant(WasmValueType.f32, -77.29);
        expect(inst.instructions[0]).toEqual(expect.objectContaining({ opcode: WasmOpcode.f32_const, args: [-77.29] }));

        inst.emitConstant(WasmValueType.f64, -77.29);
        expect(inst.instructions[1]).toEqual(expect.objectContaining({ opcode: WasmOpcode.f64_const, args: [-77.29] }));

        inst.emitConstant(WasmValueType.i32, -7729);
        expect(inst.instructions[2]).toEqual(expect.objectContaining({ opcode: WasmOpcode.i32_const, args: [-7729] }));

        inst.emitConstant(WasmValueType.i64, -7729);
        expect(inst.instructions[3]).toEqual(expect.objectContaining({ opcode: WasmOpcode.i64_const, args: [-7729] }));
    });
});
