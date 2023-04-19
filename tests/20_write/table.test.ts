import { SpiderImportTable, SpiderModule, SpiderTable, SpiderOpcodes, SpiderValueType, createModule, writeModule, SpiderNumberType, SpiderReferenceType } from "../../src";
import fs from 'fs';
import { createAdd, createSub } from "./common";

describe('Spider', () => {
    describe('Write', () => {
        describe("Tables", () => {
            function createMultifunc(spiderModule: SpiderModule, table: SpiderTable) {
                const addFunction = createAdd(spiderModule);
                const subtractFunction = createSub(spiderModule);

                spiderModule.createElementFuncIdxActive(table, 0, [addFunction, subtractFunction]);

                const multiFunction = spiderModule.createFunction({
                    parameters: [SpiderNumberType.i32, SpiderNumberType.f64, SpiderNumberType.f64],
                    results: [SpiderNumberType.f64]
                });
                spiderModule.exportFunction("multifunc", multiFunction);

                multiFunction.body.emit(SpiderOpcodes.local_get, 1);
                multiFunction.body.emit(SpiderOpcodes.local_get, 2);
                multiFunction.body.emit(SpiderOpcodes.local_get, 0);
                multiFunction.body.emit(SpiderOpcodes.call_indirect, addFunction.type, table);
            }

            test('table_export_funcref', async () => {
                const spiderModule = createModule();

                const table = spiderModule.createTable(SpiderReferenceType.funcref, 2);
                spiderModule.exportTable("table", table);

                createMultifunc(spiderModule, table);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/table_export_funcref.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);
                const moduleInstance = await WebAssembly.instantiate(compiledModule, {});
                expect(moduleInstance.exports.table).toBeTruthy();

                const compiledMultifunc = moduleInstance.exports.multifunc as Function;
                expect(compiledMultifunc(0, 1, 2)).toEqual(3);
                expect(compiledMultifunc(1, 1, 2)).toEqual(-1);
            });

            test('table_import_funcref', async () => {
                const spiderModule = createModule();

                const table = spiderModule.importTable("test", "table", SpiderReferenceType.funcref, 2);
                createMultifunc(spiderModule, table);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/table_import_funcref.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const moduleInstance = await WebAssembly.instantiate(compiledModule, {
                    test: {
                        table: new WebAssembly.Table({ element: "anyfunc", initial: 2 })
                    }
                });
                expect(moduleInstance.exports.table).toBeUndefined();

                const compiledMultifunc = moduleInstance.exports.multifunc as Function;
                expect(compiledMultifunc(0, 1, 2)).toEqual(3);
                expect(compiledMultifunc(1, 1, 2)).toEqual(-1);
            });

            test('table_export_externref', async () => {
                const spiderModule = createModule();

                spiderModule.importTable("test", "dummy", SpiderReferenceType.funcref, 0);

                const table = spiderModule.importTable("test", "table", SpiderReferenceType.externref, 2);

                const shuffle = spiderModule.createFunction();
                shuffle.body.emitConstant(SpiderNumberType.i32, 0);
                shuffle.body.emitConstant(SpiderNumberType.i32, 1);
                shuffle.body.emit(SpiderOpcodes.table_get, table);
                shuffle.body.emit(SpiderOpcodes.table_set, table);

                shuffle.body.emitConstant(SpiderNumberType.i32, 1);
                shuffle.body.emit(SpiderOpcodes.ref_null, SpiderReferenceType.externref);
                shuffle.body.emit(SpiderOpcodes.table_set, table);
                spiderModule.exportFunction("shuffle", shuffle);

                const moduleBuffer = writeModule(spiderModule);
                fs.writeFileSync("tests/bin/table_export_externref.wasm", moduleBuffer);
                const compiledModule = await WebAssembly.compile(moduleBuffer);

                const objA = { value: "A" };
                const objB = { value: "B" };
                const tableInst = new WebAssembly.Table({ element: "externref", initial: 2 });
                tableInst.set(0, objA);
                tableInst.set(1, objB);

                const moduleInstance = await WebAssembly.instantiate(compiledModule, {
                    test: {
                        dummy: new WebAssembly.Table({ element: "anyfunc", initial: 0 }),
                        table: tableInst
                    }
                });

                const compiledShuffle = moduleInstance.exports.shuffle as Function;

                expect(tableInst.get(0)).toEqual(objA);
                expect(tableInst.get(1)).toEqual(objB);
                compiledShuffle();
                expect(tableInst.get(0)).toEqual(objB);
                expect(tableInst.get(1)).toBeNull();
            });
        });
    });
});