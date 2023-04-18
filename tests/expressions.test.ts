import { SpiderConstExpression, SpiderOpcodes, SpiderValueType, spider } from "../src";
import { SpiderExpression } from "../src/SpiderExpression";
import { SpiderNumberType, SpiderReferenceType } from "../src/enums";

describe("Expression", () => {
    test('emitConstant', async () => {
        const expr = new SpiderExpression();

        expr.emitConstant(SpiderNumberType.f32, -77.29);
        expect(expr.instructions[0]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.f32_const, args: [-77.29] }));

        expr.emitConstant(SpiderNumberType.f64, -77.29);
        expect(expr.instructions[1]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.f64_const, args: [-77.29] }));

        expr.emitConstant(SpiderNumberType.i32, -7729);
        expect(expr.instructions[2]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.i32_const, args: [-7729] }));

        expr.emitConstant(SpiderNumberType.i64, -7729);
        expect(expr.instructions[3]).toEqual(expect.objectContaining({ opcode: SpiderOpcodes.i64_const, args: [-7729] }));
    });

    test('ConstExpression get/set', () => {
        const module = spider.createModule();

        const expr = new SpiderConstExpression();
        expr.setTo(SpiderNumberType.i32, 69);
        expect(expr.getAsNumber()).toEqual(69);
        expr.setToNumber(SpiderNumberType.i64, 6.9);
        expect(expr.getAsNumber()).toEqual(6.9);

        const testGlobalDef = module.createGlobal(SpiderNumberType.i32, false, 0);
        expr.setTo(SpiderNumberType.i32, testGlobalDef);
        expect(expr.getAsGlobal()).toEqual(testGlobalDef);

        const testGlobalImport = module.importGlobal("", "", SpiderNumberType.i32, false);
        expr.setTo(SpiderNumberType.i32, testGlobalImport);
        expect(expr.getAsGlobal()).toEqual(testGlobalImport);

        const testFuncDef = module.createFunction();
        expr.setTo(SpiderReferenceType.funcref, testFuncDef);
        expect(expr.getAsFunction()).toEqual(testFuncDef);

        const testFuncImport = module.importFunction("", "", {});
        expr.setTo(SpiderReferenceType.funcref, testFuncImport);
        expect(expr.getAsFunction()).toEqual(testFuncImport);

        expr.setTo(SpiderReferenceType.funcref, null);
        expect(expr.getAsFunction()).toBeNull();
    });
});
