import { SpiderExpression, SpiderNumberType, SpiderOpcodes, SpiderReferenceType, SpiderValueType, spider } from "../../src";

describe('Spider', () => {
    describe('API', () => {
        describe("Expression", () => {
            test('Emit Constant', async () => {
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

            test('Get/Set Const', () => {
                const module = spider.createModule();

                const expr = new SpiderExpression();
                expr.setToConst(SpiderNumberType.i32, 69);
                expect(expr.getAsConstNumber()).toEqual(69);
                expr.setToConstNumber(SpiderNumberType.i64, 6.9);
                expect(expr.getAsConstNumber()).toEqual(6.9);

                const testGlobalDef = module.createGlobal(SpiderNumberType.i32, false, 0);
                expr.setToConst(SpiderNumberType.i32, testGlobalDef);
                expect(expr.getAsConstGlobal()).toEqual(testGlobalDef);

                const testGlobalImport = module.importGlobal("", "", SpiderNumberType.i32, false);
                expr.setToConst(SpiderNumberType.i32, testGlobalImport);
                expect(expr.getAsConstGlobal()).toEqual(testGlobalImport);

                const testFuncDef = module.createFunction();
                expr.setToConst(SpiderReferenceType.funcref, testFuncDef);
                expect(expr.getAsConstFunction()).toEqual(testFuncDef);

                const testFuncImport = module.importFunction("", "", {});
                expr.setToConst(SpiderReferenceType.funcref, testFuncImport);
                expect(expr.getAsConstFunction()).toEqual(testFuncImport);

                expr.setToConst(SpiderReferenceType.funcref, null);
                expect(expr.getAsConstFunction()).toBeNull();
            });
        });
    });
});