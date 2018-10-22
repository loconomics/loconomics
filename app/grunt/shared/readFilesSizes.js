/**
 * Get file sizes from folder, get sum and average
 * Based on https://stackoverflow.com/a/7550430/1622346
 */
/* eslint no-console:0*/
const fs = require('fs');
const path = require('path');
const util = require("util");

const lstat = util.promisify(fs.lstat);
const readdir = util.promisify(fs.readdir);

async function readSizes(dirPath, recursive, __internal = false) {
    const stats = await lstat(dirPath);
    if (!stats.isDirectory()) {
        return [stats.size];
    }
    else if (!recursive && __internal) {
        return [];
    }
    const list = await readdir(dirPath);
    const itemSize = (dirItem) => readSizes(path.join(dirPath, dirItem), recursive, true);
    const allSizes = await Promise.all(list.map(itemSize));
    return allSizes.reduce((a, b) => a.concat(b));
}

exports.readSizes = readSizes;

exports.readSize = (dirPath) => readSizes(dirPath).then((all) => all.reduce((a, b) => a + b));

exports.stats = async (dirPath, recursive) => {
    const sizes = await readSizes(dirPath, recursive);
    const size = sizes.reduce((a, b) => a + b);
    const count = sizes.length;
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    return {
        size,
        count,
        average: size / count,
        min,
        max
    };
};

if (require.main === module) {
    const location = process.argv[2] || './';
    const raw = process.argv.includes('--raw');
    const csv = process.argv.includes('--csv');
    const recursive = process.argv.includes('--recursive');
    console.log(path.resolve(location));
    exports.stats(location, recursive).then((stats) => {
        const kb = {
            sizeKB: Math.round(stats.size / 1024),
            averageKB: Math.round(stats.average / 1024),
            minKB: Math.round(stats.min / 1024),
            maxKB: Math.round(stats.max / 1024),
        };
        if (csv) {
            if (raw) {
                console.log('Count,Size,Min.,Avg.,Max.');
                console.log(`${stats.count},${stats.size},${stats.min},${stats.average},${stats.max}`);
            }
            else {
                console.log('Count,Size (KB),Min. (KB),Avg. (KB),Max. (KB)');
                console.log(`${stats.count},${kb.sizeKB},${kb.minKB},${kb.averageKB},${kb.maxKB}`);
            }
        }
        else if (raw) {
            console.log({
                ...stats,
                ...kb
            });
        }
        else {
            const counts = `Count ${stats.count.toString().padStart(4)} files`;
            const sizes = `Size ${kb.sizeKB.toString().padStart(5)}KB`;
            const mins = `Min. ${kb.minKB.toString().padStart(4)}KB`;
            const avgs = `Avg. ${kb.averageKB.toString().padStart(4)}KB`;
            const maxs = `Max. ${kb.maxKB.toString().padStart(4)}KB`;
            console.log(`${counts} | ${sizes} | ${mins} |${avgs} | ${maxs}`);
        }
    }, console.error);
}
