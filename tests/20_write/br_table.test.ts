import { SpiderNumberType, SpiderOpcodes, SpiderValueType, spider } from "../../src";
import fs from 'fs';

describe('Spider', () => {
    describe('Write', () => {
        test('br_table', async () => {
            const spiderModule = spider.createModule();

            const testFunction = spiderModule.createFunction({
                parameters: [SpiderNumberType.i32],
                results: [SpiderNumberType.i32]
            });

            let defaultCase = testFunction.body.emitBlock(SpiderNumberType.i32);
            let case1 = defaultCase.emitBlock();
            let case0 = case1.emitBlock();
            let outerBlock = case0.emitBlock();

            outerBlock.emit(SpiderOpcodes.local_get, 0);
            outerBlock.emit(SpiderOpcodes.br_table, [0, 1], 2);

            case0.emit(SpiderOpcodes.i32_const, 69);
            case0.emit(SpiderOpcodes.br, 2);

            case1.emit(SpiderOpcodes.i32_const, 420);
            case1.emit(SpiderOpcodes.br, 1);

            defaultCase.emit(SpiderOpcodes.i32_const, -1);

            spiderModule.exportFunction("test", testFunction);

            const moduleBuffer = spider.writeModule(spiderModule);
            fs.writeFileSync("tests/bin/br_table.wasm", moduleBuffer);
            const compiledModule = await WebAssembly.compile(moduleBuffer);

            const moduleInstance = await WebAssembly.instantiate(compiledModule);
            const compiledAdd = moduleInstance.exports.test as Function;

            expect(compiledAdd(0)).toEqual(69);
            expect(compiledAdd(1)).toEqual(420);
            expect(compiledAdd(2)).toEqual(-1);
        });
    });
});
