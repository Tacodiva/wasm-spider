import fs from 'fs';
import path from 'path';
import { spider } from '../../src';

describe('Spider', () => {

    function addTests(dir: string, exact: boolean) {
        describe(dir, () => {
            for (const file of fs.readdirSync(dir)) {
                if (!file.endsWith(".wasm")) continue;
                const wasmPath = path.join(dir, file);
                const wasmName = path.basename(wasmPath, ".wasm");
                test(wasmName, async () => {
                    const wasmInput = new Uint8Array(fs.readFileSync(wasmPath));
                    const spiderModule = spider.readModule(wasmInput);
                    const wasmOutput = spider.writeModule(spiderModule, { mergeTypes: false });

                    if (exact)
                        expect(wasmInput.buffer).toStrictEqual(wasmOutput.buffer);
                    else
                        expect(await WebAssembly.compile(wasmOutput));
                });
            }
        });
    }

    addTests("./tests/bin", true);
    addTests("./tests/specs", false);
    addTests("./tests/specs/simd", false);
});