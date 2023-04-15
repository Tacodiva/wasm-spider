import { SpiderImportTable, SpiderModule, SpiderTable, WasmOpcode, WasmValueType, spider } from "../src";
import { InstrList } from "../src/InstrList";

describe("Tables", () => {
    function poppulateModule(spiderModule: SpiderModule, table: SpiderTable) {
        const addFunction = spiderModule.createFunction({
            parameters: [WasmValueType.f64, WasmValueType.f64],
            results: [WasmValueType.f64]
        })

        addFunction.body.emit(WasmOpcode.local_get, 0);
        addFunction.body.emit(WasmOpcode.local_get, 1);
        addFunction.body.emit(WasmOpcode.f64_add);

        const subtractFunction = spiderModule.createFunction({
            parameters: [WasmValueType.f64, WasmValueType.f64],
            results: [WasmValueType.f64]
        })

        subtractFunction.body.emit(WasmOpcode.local_get, 0);
        subtractFunction.body.emit(WasmOpcode.local_get, 1);
        subtractFunction.body.emit(WasmOpcode.f64_sub);

        const element = spiderModule.createElement(table, new InstrList(), [addFunction, subtractFunction]);
        element.offsetExpr.emitConstant(WasmValueType.i32, 0);

        const multiFunction = spiderModule.createFunction({
            parameters: [WasmValueType.i32, WasmValueType.f64, WasmValueType.f64],
            results: [WasmValueType.f64]
        });
        spiderModule.exportFunction("multifunc", multiFunction);

        multiFunction.body.emit(WasmOpcode.local_get, 1);
        multiFunction.body.emit(WasmOpcode.local_get, 2);
        multiFunction.body.emit(WasmOpcode.local_get, 0);
        multiFunction.body.emit(WasmOpcode.call_indirect, addFunction.type, table);
    }

    test('Export', async () => {
        const spiderModule = spider.createModule();

        const table = spiderModule.createTable(2);
        spiderModule.exportTable("table", table);

        poppulateModule(spiderModule, table);

        const compiledModule = await spider.compileModule(spiderModule);
        const moduleInstance = await WebAssembly.instantiate(compiledModule, {});
        expect(moduleInstance.exports.table).toBeTruthy();

        const compiledMultifunc = moduleInstance.exports.multifunc as Function;
        expect(compiledMultifunc(0, 1, 2)).toEqual(3);
        expect(compiledMultifunc(1, 1, 2)).toEqual(-1);
    });

    test('Import', async () => {
        const spiderModule = spider.createModule();

        const table = spiderModule.importTable("test", "table", 2);
        poppulateModule(spiderModule, table);

        const compiledModule = await spider.compileModule(spiderModule);
        const moduleInstance = await WebAssembly.instantiate(compiledModule, {
            test: {
                table: new WebAssembly.Table({ element: "anyfunc", initial: 2 })
            }
        });

        const compiledMultifunc = moduleInstance.exports.multifunc as Function;
        expect(compiledMultifunc(0, 1, 2)).toEqual(3);
        expect(compiledMultifunc(1, 1, 2)).toEqual(-1);
    });
});