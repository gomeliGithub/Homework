import express, { json } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import logLineAsync from './utils/logLineAsync.js';

import createMessage from './createMessage.js';
import appendFileInfoWithComments from './appendFileInfoWithComments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();

webserver.use(cors({
    origin: 'http://test.expapp.online' // 'http://localhost:4200'
}));

webserver.use(json());

const port = 80;
const port2 = 443;
const logFN = join(__dirname, '_server.log');
const filesInfoWithCommentsFN = join(__dirname, 'filesInfoWithComments.json');
const filesInfoWithCommentsFolderFN = join(__dirname, 'uploadedFiles');

let clients = [];
let timer = 0;

const socketServer = new WebSocketServer({ port: port2 }); 

socketServer.on('connection', (connection, request) => {
    const clientId = parseFloat(request.url.substring(2));

    if (isNaN(clientId)) connection.terminate();

    const currentClient = clients.find(client => client._id === clientId);

    if (!currentClient) connection.terminate();

    currentClient.connection = connection;

    logLineAsync(logFN, `[${port2}] New connection established. ClientId --- ${clientId}`);

    let timer = 0;
        
    connection.on('message', async (data, isBinary) => {
        if (data.toString() === "KEEP_ME_ALIVE") clients.forEach(client => client._id === clientId ? client.lastkeepalive = Date.now() : null);
        else {
            if (isBinary) {
                const fileData = data;

                if (currentClient.uploadedSize === 0) await logLineAsync(logFN, `[${port2}] Upload file ${currentClient.fileMetaName} is started`);

                currentClient.uploadedSize += fileData.length;

                currentClient.activeWriteStream.write(fileData, async () => {
                    const message = createMessage('uploadFile', 'SUCCESS', { uploadedSize: currentClient.uploadedSize, fileMetaSize: currentClient.fileMetaSize });

                    await logLineAsync(logFN, `[${port2}] ClientId --- ${clientId}. Chunk ${currentClient.currentChunkNumber} writed, size --> ${fileData.length}`);

                    currentClient.currentChunkNumber += 1;

                    if (currentClient.uploadedSize === currentClient.fileMetaSize) currentClient.activeWriteStream.end();
                    else currentClient.connection.send(JSON.stringify(message));
                });
            }
        }
    });

    connection.on('error', async () => {
        await fsPromises.unlink(join(__dirname, 'uploadedFiles', currentClient.fileMetaName));

        clients = clients.filter(client => client._id !== currentClient._id);
    });

    setInterval(() => {
        timer++;
    
        try {
            clients.forEach(client => {
                if ((Date.now() - client.lastkeepalive) > 12000) {
                    client.connection.terminate();
    
                    client.connection = null;
    
                    logLineAsync(logFN, `[${port2}] Один из клиентов отключился, закрываем соединение с ним`);
                }
                else {
                    const message = createMessage('timer', 'timer= ' + timer);
    
                    client.connection.send(JSON.stringify(message));
                }
            });
    
            clients = clients.filter(client => client.connection);
        }

        catch {
            logLineAsync(logFN, `[${port2}] Server error`);
        }
    }, 3000);
});

logLineAsync(logFN, "Socket server running on port " + port2);

webserver.post('/uploadFile', async (req, res) => {
    const clientId = req.body._id;
    const fileMeta = JSON.parse(req.body.uploadFileMeta);
    const comment = req.body.uploadFileComment;

    if (typeof clientId !== 'number' || clientId < 0 || clientId > 1 
        || typeof comment !== 'string' || comment === ''
        || fileMeta.name.length < 4
        || fileMeta.size > 104857600
    ) {
        res.status(400).end();

        return;
    }

    const newFilePath = join(__dirname, 'uploadedFiles', fileMeta.name);

    const activeUploadClient = clients.some(client => client._id === clientId);

    let activeUploadsClientNumber = 0;

    clients.forEach(client => client.activeWriteStream ? activeUploadsClientNumber += 1 : null);

    if (activeUploadClient) {
        res.status(400).end();

        return;
    }

    if (activeUploadsClientNumber > 3) {
        res.send('PENDING').end();

        return;
    }

    try {
        await fsPromises.access(newFilePath, fsPromises.constants.F_OK);

        res.send('FILEEXISTS').end();

        return;
    } catch {}

    const uploadedFilesNumber = (await fsPromises.readdir(filesInfoWithCommentsFolderFN)).length;

    if (uploadedFilesNumber === 15) {
        res.send('MAXCOUNT').end();

        return;
    }

    res.send('START').end();

    let currentChunkNumber = 0;
    let uploadedSize = 0;

    const writeStream = fs.createWriteStream(newFilePath);

    writeStream.on('error', async () => {
        await fsPromises.unlink(newFilePath);

        await logLineAsync(logFN, `[${port2}] ClientId --- ${clientId}. Stream error`);

        const currentClient = clients.find(client => client._id === clientId);

        const message = createMessage('uploadFile', 'ERROR', { uploadedSize: currentClient.uploadedSize, fileMetaSize: fileMeta.size });

        connection.send(JSON.stringify(message));
    });

    writeStream.on('finish', async () => {
        const currentClient = clients.find(client => client._id === clientId);

        const message = createMessage('uploadFile', 'FINISH', { uploadedSize: currentClient.uploadedSize, fileMetaSize: fileMeta.size });

        const newFileInfo = {
            name: fileMeta.name,
            comment: currentClient.comment
        }

        await appendFileInfoWithComments(fsPromises, filesInfoWithCommentsFN, newFileInfo);

        await logLineAsync(logFN, `[${port2}] ClientId --- ${clientId}. All chunks writed, overall size --> ${currentClient.uploadedSize}. File ${fileMeta.name} uploaded`);

        currentClient.connection.send(JSON.stringify(message));

        currentClient.connection.terminate();
    
        currentClient.connection = null;

        clients = clients.filter((client => client.connection));
    });

    clients.push({ _id: clientId, activeWriteStream: writeStream, currentChunkNumber, uploadedSize, fileMetaName: fileMeta.name, fileMetaSize: fileMeta.size, comment, lastkeepalive: Date.now() });

    return;
});

webserver.get('/getFilesInfo', async (_, res) => {
    try {
        await fsPromises.access(filesInfoWithCommentsFN, fsPromises.constants.F_OK);
    }

    catch {
        fsPromises.writeFile(filesInfoWithCommentsFN, JSON.stringify([]));

        res.send([]).end();

        return;
    }

    const readStream = fs.createReadStream(filesInfoWithCommentsFN, { encoding: 'utf8' });

    let filesInfoWithComments = '';

    readStream.on('data', chunk => filesInfoWithComments += chunk);

    readStream.on('end', () => res.send(JSON.parse(filesInfoWithComments)).end());
});

webserver.get('/getFile/:fileName', async (req, res) => {
    const fileName = req.params.fileName.substring(1);

    const filePath = join(filesInfoWithCommentsFolderFN, fileName);

    try {
        await fsPromises.access(filePath, fsPromises.constants.F_OK);
    } catch {
        res.status(400).end();

        return;
    }

    res.download(filePath);
});

webserver.listen(port, () => {
    logLineAsync(logFN, "Web server running on port " + port);
});
