// @ts-check

const fs = require("fs");
const { remove, copy } = require("../dist/lib/utils/fs");
const { join } = require("path");

const toCopy = [
    "test/converter",
    "test/renderer",
    "test/module",
    "test/utils/options/readers/data",
];

Promise.all(
    toCopy.map(async (dir) => {
        const source = join(__dirname, "../src", dir);
        const target = join(__dirname, "../dist", dir);
        await remove(target);
        fs.mkdirSync(target, { recursive: true });
        await copy(source, target);
    })
);
