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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();

webserver.use(cors({
    origin: 'http://localhost:4200' // 'http://178.172.195.18:7981'
}));

webserver.use(json());

const port = 7980;
const port2 = 7981;
const logFN = join(__dirname, '_server.log');

let clients = [];
let timer = 0;

const socketServer = new WebSocketServer({ port: port2 }); 

socketServer.on('connection', (connection, request) => {
    const clientId = parseFloat(request.url.substring(2), 10);

    logLineAsync(logFN, `[${port2}] New connection established. ClientId --- ${clientId}`);

    const activeClient = clients.find(client => client._id === clientId);

    activeClient.connection = connection;
        
    connection.on('message', async (data, isBinary) => {
        if (data.toString() === "KEEP_ME_ALIVE") clients.forEach(client => client._id === clientId ? client.lastkeepalive = Date.now() : null);
        else {
            if (isBinary) {
                const fileData = data;

                if (activeClient.uploadedSize === 0) await logLineAsync(logFN, `[${port2}] Upload file ${activeClient.fileMetaName} is started`);

                activeClient.uploadedSize += fileData.length;

                activeClient.activeWriteStream.write(fileData, async () => {
                    const message = createMessage('uploadFile', 'SUCCESS', { uploadedSize: activeClient.uploadedSize, fileMetaSize: activeClient.fileMetaSize });

                    await logLineAsync(logFN, `[${port2}] Chunk ${activeClient.currentChunkNumber} writed, size --> ${fileData.length}`);

                    activeClient.currentChunkNumber += 1;

                    if (activeClient.uploadedSize === activeClient.fileMetaSize) activeClient.activeWriteStream.end();
                    else activeClient.connection.send(JSON.stringify(message));
                });
            }
        }
    });

    connection.on('error', async () => {
        await fsPromises.unlink(join(__dirname, 'uploadedFiles', activeClient.fileMetaName));

        clients = clients.filter(client => client._id !== activeClient._id);
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
    
            res.status(500).end();
    
            return;
        }
    }, 3000);
});

logLineAsync(logFN, "Socket server running on port " + port2);

webserver.post('/uploadFile', async (req, res) => {
    const clientId = req.body._id;
    const fileMeta = JSON.parse(req.body.uploadFileMeta);
    const comment = req.body.uploadFileComment;

    const requiredImageTypes = [ 'image/jpeg', 'image/png', 'image/gif' ];

    if (typeof clientId !== 'number' || clientId < 0 || clientId > 1 
        || !requiredImageTypes.includes(fileMeta.type) 
        || typeof comment !== 'string' || comment === ''
    ) {
        res.status(400).end();

        return;
    }

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

    res.send('START').end();

    let currentChunkNumber = 0;
    let uploadedSize = 0;

    const writeStream = fs.createWriteStream(join(__dirname, 'uploadedFiles', fileMeta.name));

    writeStream.on('error', async error => {
        await fsPromises.unlink(join(__dirname, 'uploadedFiles', fileMeta.name));

        await logLineAsync(logFN, `[${port2}] Stream error`);

        const activeClient = clients.find(client => client._id === clientId);

        const message = createMessage('uploadFile', 'ERROR', { uploadedSize: activeClient.uploadedSize, fileMetaSize: fileMeta.size });

        connection.send(JSON.stringify(message));
    });

    writeStream.on('finish', async () => {
        const activeClient = clients.find(client => client._id === clientId);

        const message = createMessage('uploadFile', 'FINISH', { uploadedSize: activeClient.uploadedSize, fileMetaSize: fileMeta.size });

        await logLineAsync(logFN, `[${port2}] All chunks writed, overall size --> ${activeClient.uploadedSize}. File ${fileMeta.name} uploaded`);

        activeClient.connection.send(JSON.stringify(message));

        activeClient.connection.terminate();
    
        activeClient.connection = null;

        clients = clients.filter((client => client.connection));
    });

    clients.push({ _id: clientId, activeWriteStream: writeStream, currentChunkNumber, uploadedSize, fileMetaName: fileMeta.name, fileMetaSize: fileMeta.size, lastkeepalive: Date.now() });

    return;
});

webserver.listen(port, () => {
    logLineAsync(logFN, "Web server running on port " + port);
});
