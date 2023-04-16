import { SpiderConstExpression, SpiderOpcodes, WasmValueType, spider } from "../src";
import { SpiderExpression } from "../src/SpiderExpression";

describe("Expression", () => {
    test('emitConstant', async () => {
        const expr = new SpiderExpression();

        expr.emitConstant(WasmValueType.f32, -77.29);
        expect(expr.instructions[0]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.f32_const, args: [-77.29] }));

        expr.emitConstant(WasmValueType.f64, -77.29);
        expect(expr.instructions[1]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.f64_const, args: [-77.29] }));

        expr.emitConstant(WasmValueType.i32, -7729);
        expect(expr.instructions[2]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.i32_const, args: [-7729] }));

        expr.emitConstant(WasmValueType.i64, -7729);
        expect(expr.instructions[3]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.i64_const, args: [-7729] }));
    });

    test('ConstExpression get/set', () => {
        const module = spider.createModule();

        const expr = new SpiderConstExpression();
        expr.setToNumber(WasmValueType.i32, 69);
        expect(expr.getAsNumber()).toEqual(69);
        expr.setToNumber(WasmValueType.i64, 6.9);
        expect(expr.getAsNumber()).toEqual(6.9);

        const testGlobal = module.createGlobal(WasmValueType.i32, false, 0);
        expr.setToGlobal(testGlobal);
        expect(expr.getAsGlobal()).toEqual(testGlobal);
    });
});
