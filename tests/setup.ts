import fs from 'fs';

export default () => {
    fs.rmSync("./tests/bin", { recursive: true })
    fs.mkdirSync("./tests/bin");
};