/**
 * Get file sizes from folder, get sum and average
 * Based on https://stackoverflow.com/a/7550430/1622346
 */
const fs = require('fs');
const path = require('path');
const util = require("util");

const lstat = util.promisify(fs.lstat);
const readdir = util.promisify(fs.readdir);

async function readSizes(dirPath) {
    const stats = await lstat(dirPath);
    if (!stats.isDirectory()) {
        return [stats.size];
    }
    const list = await readdir(dirPath);
    const itemSize = (dirItem) => readSizes(path.join(dirPath, dirItem));
    const allSizes = await Promise.all(list.map(itemSize));
    return allSizes.reduce((a, b) => a.concat(b));
}

exports.readSizes = readSizes;

exports.readSize = (dirPath) => readSizes(dirPath).then((all) => all.reduce((a, b) => a + b));

exports.stats = async (dirPath) => {
    const sizes = await readSizes(dirPath);
    const size = sizes.reduce((a, b) => a + b);
    const count = sizes.length;
    return {
        size,
        count,
        average: size / count,
    };
};
