import { SpiderNumberType, SpiderOpcodes, SpiderValueType, createModule, writeModule } from "../../src";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        test('local_var_refs', async () => {
            const spiderModule = createModule();

            const callbackFunc = spiderModule.importFunction("test", "callback", { parameters: [SpiderNumberType.f64] });

            const runCallbackFunc = spiderModule.createFunction({
                parameters: [SpiderNumberType.f64]
            });

            runCallbackFunc.body.emit(SpiderOpcodes.local_get, 0);
            runCallbackFunc.body.emit(SpiderOpcodes.f64_const, 1);
            runCallbackFunc.body.emit(SpiderOpcodes.f64_sub);
            runCallbackFunc.body.emit(SpiderOpcodes.call, callbackFunc);

            const addFunction = spiderModule.createFunction({
                parameters: [SpiderNumberType.i32, SpiderNumberType.i32, SpiderNumberType.f64],
                results: [SpiderNumberType.f64]
            });

            const initalParam = addFunction.getParameter(2);
            const initalFirstParam = addFunction.getParameter(0);

            addFunction.body.emit(SpiderOpcodes.local_get, initalParam);
            addFunction.body.emit(SpiderOpcodes.f64_const, 0);
            addFunction.body.emit(SpiderOpcodes.f64_eq);

            const ifelse = addFunction.body.emitIfElse(undefined, undefined, SpiderNumberType.f64);

            ifelse.instrTrue.emit(SpiderOpcodes.f64_const, 7729);
            ifelse.instrTrue.emit(SpiderOpcodes.f64_const, 70);
            ifelse.instrTrue.emit(SpiderOpcodes.call, runCallbackFunc);

            expect(addFunction.type.spliceParameters(0, 2, SpiderNumberType.i64)).toEqual([SpiderNumberType.i32, SpiderNumberType.i32]);
            expect(initalFirstParam.index).toEqual(-1);
            expect(initalParam.index).toEqual(1);
            expect(addFunction.parameters).toEqual([SpiderNumberType.i64, SpiderNumberType.f64]);
            expect(addFunction.type.spliceParameters(0, 1)).toEqual([SpiderNumberType.i64]);
            expect(initalParam.index).toEqual(0);
            const newParam = addFunction.addParameter(SpiderNumberType.f64);
            expect(initalParam.index).toEqual(0);
            expect(newParam.index).toEqual(1);

            ifelse.instrFalse.emit(SpiderOpcodes.local_get, newParam);
            ifelse.instrFalse.emit(SpiderOpcodes.local_get, initalParam);
            ifelse.instrFalse.emit(SpiderOpcodes.f64_add);

            spiderModule.exportFunction("add", addFunction);

            const moduleBuffer = writeModule(spiderModule);
            fs.writeFileSync("tests/bin/local_var_refs.wasm", moduleBuffer);
            const compiledModule = await WebAssembly.compile(moduleBuffer);

            let lastReturn: null | number = null;
            const moduleInstance = await WebAssembly.instantiate(compiledModule, {
                test: {
                    callback: (n: number) => lastReturn = n
                }
            });
            const compiledAdd = moduleInstance.exports.add as Function;

            expect(compiledAdd(1, 2)).toEqual(3);
            expect(lastReturn).toEqual(null);

            expect(compiledAdd(0, 2)).toEqual(7729);
            expect(lastReturn).toEqual(69);
        });
    });
});