import fs from 'fs';
import path from 'path';
import { SpiderReadConfig, createModule, readModule, writeModule } from '../../src';

describe('Spider', () => {

    const CONFIGS: SpiderReadConfig[] = [
        { referenceLocals: true },
        { referenceLocals: false }
    ];

    function addTests(dir: string, exact: boolean) {
        describe(dir, () => {
            for (const file of fs.readdirSync(dir)) {
                if (!file.endsWith(".wasm")) continue;
                const wasmPath = path.join(dir, file);
                const wasmName = path.basename(wasmPath, ".wasm");
                test(wasmName, async () => {
                    for (const config of CONFIGS) {
                        const wasmInput = new Uint8Array(fs.readFileSync(wasmPath));
                        const spiderModule = readModule(wasmInput, config);
                        const wasmOutput = writeModule(spiderModule, { mergeTypes: false });

                        if (exact)
                            expect(wasmInput.buffer).toStrictEqual(wasmOutput.buffer);
                        else {
                            expect(readModule(wasmOutput, config)).toEqual(spiderModule);
                            expect(await WebAssembly.compile(wasmOutput));
                        }
                    }
                });
            }
        });
    }

    addTests("./tests/bin", true);
    addTests("./tests/specs", false);
    addTests("./tests/specs/simd", false);
});