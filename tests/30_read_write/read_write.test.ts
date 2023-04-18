import fs from 'fs';
import path from 'path';
import { spider } from '../../src';

describe('Spider', () => {
    describe('Read / Write', () => {
        for (const file of fs.readdirSync("./tests/bin")) {
            const wasmPath = path.join("./tests/bin", file);
            const wasmName = path.basename(wasmPath, ".wasm");
            test(wasmName, async () => {
                const wasmInput = new Uint8Array(fs.readFileSync(wasmPath));
                const spiderModule = spider.readModule(wasmInput);
                const wasmOutput = spider.writeModule(spiderModule, { mergeTypes: false });

                await WebAssembly.compile(wasmOutput);
                expect(wasmInput.buffer).toStrictEqual(wasmOutput.buffer);
            });
        }
    });
});