const readline = require('readline');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

function logLineAsync (logFilePath, logLine) {
    return new Promise( (resolve,reject) => {
        const logDT=new Date();
        let time=logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
        let fullLogLine=time+" "+logLine;
    
        console.log(fullLogLine);
    
        fs.open(logFilePath, 'a+', (err,logFd) => {
            if ( err ) 
                reject(err);
            else    
                fs.write(logFd, fullLogLine + os.EOL, (err) => {
                    if ( err )
                        reject(err); 
                    else    
                        fs.close(logFd, (err) =>{
                            if ( err )
                                reject(err);
                            else    
                                resolve();
                        });
                });
    
        });
            
    });
}

const logFN = path.join(__dirname, '_app.log');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'DIR_PATH> '
});

let compressPromiseCache = null;

rl.prompt();

rl.on('line', async dirPath => {
    try {
        await fsPromises.access(dirPath, fsPromises.constants.F_OK);
    } catch {
        await logLineAsync(logFN, "Ошибка при проверке начальной папки");
        
        rl.close();
    }

    if (!compressPromiseCache) {
        const files = await readDir(dirPath, []);

        const originalFiles = files.filter(fileInfo => path.extname(fileInfo.name) !== '.gz');
        const compressedFiles = files.filter(fileInfo => path.extname(fileInfo.name) === '.gz');

        try {
            for (const originalFileInfo of originalFiles) {
                const originalFilePath = originalFileInfo.path;

                const compressedFileInfo = compressedFiles.find(fileInfo2 => `${originalFileInfo.name}.gz` === fileInfo2.name); 

                if (compressedFileInfo) {
                    const originalFileModificationDate = (await fsPromises.stat(originalFilePath)).mtime;
                    const compressedFileModificationDate = (await fsPromises.stat(compressedFileInfo.path)).mtime;

                    if (originalFileModificationDate.getTime() > compressedFileModificationDate.getTime()) {
                        await fsPromises.rm(compressedFileInfo.path);

                        await logLineAsync(logFN, `Начата переархивация файла '${path.basename(originalFilePath)}'`);

                        const compressFilePromise = compressFile(originalFilePath);

                        compressPromiseCache = compressFilePromise;

                        await compressFilePromise;

                        compressPromiseCache = null;

                        await logLineAsync(logFN, `Переархивация файла '${path.basename(originalFilePath)}' завершена`);
                    }
                } else {
                    await logLineAsync(logFN, `Начата архивация файла '${path.basename(originalFilePath)}'`);

                    const compressFilePromise = compressFile(originalFilePath);

                    compressPromiseCache = compressFilePromise;

                    await compressFilePromise;

                    compressPromiseCache = null;

                    await logLineAsync(logFN, `Архивация файла '${path.basename(originalFilePath)}' завершена`);
                }
            }
        } catch {
            compressPromiseCache = null;

            await logLineAsync(logFN,`[${port}] произошла ошибка ${err}`);

            rl.close();
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

            await logLineAsync(logFN, `Начато сканирование папки <${path.basename(subFolderPath)}>`);

            await readDir(subFolderPath, fullFilesArr);

            await logLineAsync(logFN, `Сканирование папки <${path.basename(subFolderPath)}> завершено`);
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
