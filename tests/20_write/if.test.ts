import { SpiderExpression, SpiderNumberType, SpiderOpcodes, SpiderValueType, spider } from "../../src";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        test('if', async () => {
            const spiderModule = spider.createModule();

            const addFunction = spiderModule.createFunction({
                parameters: [SpiderNumberType.f64, SpiderNumberType.f64],
                results: [SpiderNumberType.f64]
            });

            const ret7729 = new SpiderExpression();

            addFunction.body.emit(SpiderOpcodes.local_get, 0);
            addFunction.body.emit(SpiderOpcodes.f64_const, 0);
            addFunction.body.emit(SpiderOpcodes.f64_eq);

            addFunction.body.emit(SpiderOpcodes.if, ret7729);
            ret7729.emit(SpiderOpcodes.f64_const, 7729);
            ret7729.emit(SpiderOpcodes.return);

            addFunction.body.emit(SpiderOpcodes.local_get, 0);
            addFunction.body.emit(SpiderOpcodes.local_get, 1);
            addFunction.body.emit(SpiderOpcodes.f64_add);

            spiderModule.exportFunction("add", addFunction);

            const moduleBuffer = spider.writeModule(spiderModule);
            fs.writeFileSync("tests/bin/if.wasm", moduleBuffer);
            const compiledModule = await WebAssembly.compile(moduleBuffer);

            const moduleInstance = await WebAssembly.instantiate(compiledModule);
            const compiledAdd = moduleInstance.exports.add as Function;

            expect(compiledAdd(1, 2)).toEqual(3);
            expect(compiledAdd(0, 2)).toEqual(7729);
        });
    });
});