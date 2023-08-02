const readline = require('readline');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

function logLineSync (logFilePath, logLine) {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
    let fullLogLine = time + " " + logLine;

    console.log(fullLogLine);

    const logFd = fs.openSync(logFilePath, 'a+');
    fs.writeSync(logFd, fullLogLine + os.EOL);
    fs.closeSync(logFd);
}

const logFN = path.join(__dirname, '_app.log');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'DIR_PATH> '
});

const compressPromiseCache = null;

rl.prompt();

rl.on('line', async dirPath => {
    try {
        await fsPromises.access(dirPath, fsPromises.constants.F_OK);
    } catch {
        rl.close();
    }

    if (!compressPromiseCache) {
        const files = await readDir(dirPath, []);

        const originalFiles = files.filter(fileInfo => path.extname(fileInfo.name) !== '.gz');
        const compressedFiles = files.filter(fileInfo => path.extname(fileInfo.name) === '.gz');

        for (const originalFileInfo of originalFiles) {
            const originalFilePath = originalFileInfo.path;

            const compressedFileInfo = compressedFiles.find(fileInfo2 => `${originalFileInfo.name}.gz` === fileInfo2.name); 

            if (compressedFileInfo) {
                const originalFileModificationDate = (await fsPromises.stat(originalFilePath)).mtime;
                const compressedFileModificationDate = (await fsPromises.stat(compressedFileInfo.path)).mtime;

                if (originalFileModificationDate.getTime() > compressedFileModificationDate.getTime()) {
                    await fsPromises.rm(compressedFileInfo.path);

                    logLineSync(logFN, `Начата переархивация файла '${path.basename(originalFilePath)}'`);

                    await compressFile(originalFilePath);

                    logLineSync(logFN, `Переархивация файла '${path.basename(originalFilePath)}' завершена`);
                }
            } else {
                logLineSync(logFN, `Начата архивация файла '${path.basename(originalFilePath)}'`);

                await compressFile(originalFilePath);

                logLineSync(logFN, `Архивация файла '${path.basename(originalFilePath)}' завершена`);
            }
        }
    } else {
        const compressPromise = compressPromiseCache;

        await compressPromise;
    }

    rl.prompt(); 
});

rl.on('close', () => {
    process.exit(0);
});

async function readDir (dirPath, fullFilesArr) {
    const files = await fsPromises.readdir(dirPath);

    for (const fileName of files) {
        const fileFullPath = path.resolve(dirPath, fileName);
        const statResult = await fsPromises.stat(fileFullPath);

        if (statResult.isDirectory())  {
            const subFolderPath = fileFullPath;

            logLineSync(logFN, `Начато сканирование папки <${path.basename(subFolderPath)}>`);

            await readDir(subFolderPath, fullFilesArr);

            logLineSync(logFN, `Сканирование папки <${path.basename(subFolderPath)}> завершено`);
        } else {
            const fileInfo = { name: fileName, path: fileFullPath };

            fullFilesArr.push(fileInfo);
        }
    }

    return fullFilesArr;
}

async function compressFile (filePath) {
    const gzip = zlib.createGzip();

    const readOriginalFile = fs.createReadStream(filePath);
    const writeCompressedFile = fs.createWriteStream(`${filePath}.gz`);

    readOriginalFile.pipe(gzip).pipe(writeCompressedFile);
}