import express, { json } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import logLineAsync from './utils/logLineAsync.js';

import createMessage from './createMessage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();
const server = http.createServer(webserver)

const socketServer = new WebSocketServer({ server });

webserver.use(cors({
    origin: 'http://localhost:4200' // 'http://178.172.195.18:7981'
}));

webserver.use(json());

const port = 7980;
const logFN = join(__dirname, '_server.log');

let clients = [];

webserver.post('/uploadFile', async (req, res) => {
    let clientId = req.body._id;
    let fileMeta = JSON.parse(req.body.uploadFileMeta);
    let comment = req.body.uploadFileComment;

    const requiredImageTypes = [ 'image/jpeg', 'image/png', 'image/gif' ];

    if (typeof clientId !== 'number' || clientId < 0 || clientId > 1 
        || !requiredImageTypes.includes(fileMeta.type) 
        || typeof comment !== 'string' || comment === ''
    ) {
        res.status(400).end();

        return;
    }

    let timer = 0;

    res.send('START').end();

    socketServer.on('connection', connection => {
        logLineAsync(logFN, `[${port}] New connection established`);

        console.log("-------------------------------------");
        console.log(clientId);
        console.log(fileMeta);
        console.log(comment);
        console.log("-------------------------------------");

        let currentChunkNumber = 0;
        let uploadedSize = 0;

        const writeStream = fs.createWriteStream(join(__dirname, 'uploadedFiles', fileMeta.name));

        writeStream.on('error', error => {
            console.error(`Stream error: ${error}`);

            logLineAsync(logFN, `[${port}] Stream error`);

            const message = createMessage('uploadFile', 'ERROR', { uploadedSize, fileMetaSize: fileMeta.size });

            connection.send(JSON.stringify(message));
        });

        writeStream.on('finish', async () => {
            const message = createMessage('uploadFile', 'FINISH', { uploadedSize, fileMetaSize: fileMeta.size });

            await logLineAsync(logFN, `[${port}] All chunks write, overall size --> ${uploadedSize}`);

            connection.send(JSON.stringify(message));

            uploadedSize = 0;

            clients.forEach(client => {
                if (client._id === clientId) {
                    client.connection.terminate();
    
                    client.connection = null;
                }
            });

            clients = clients.filter((client => client.connection));
        });

        clients.push({ connection: connection, _id: clientId, lastkeepalive: Date.now() });
        
        connection.on('message', (data, isBinary) => {
            if (data.toString() === "KEEP_ME_ALIVE") clients.forEach(client => client._id === clientId ? client.lastkeepalive = Date.now() : null);
            else {
                if (isBinary) {
                    const fileData = data;

                    uploadedSize += fileData.length;

                    writeStream.write(fileData, async () => {
                        const message = createMessage('uploadFile', 'SUCCESS', { uploadedSize, fileMetaSize: fileMeta.size });

                        await logLineAsync(logFN, `[${port}] Chunk ${currentChunkNumber} write, size --> ${fileData.length}`);

                        currentChunkNumber += 1;




                        console.log(clients.find(client => client._id === clientId) ? true : false);




                        if (uploadedSize === fileMeta.size) writeStream.end();

                        connection.send(JSON.stringify(message));
                    });
                }
            }
        });

        return;
    });

    setInterval(() => {
        timer++;
    
        try {
            clients.forEach(client => {
                if ((Date.now() - client.lastkeepalive) > 12000) {
                    client.connection.terminate();
    
                    client.connection = null;
    
                    logLineAsync(logFN, `[${port}] Один из клиентов отключился, закрываем соединение с ним`);
                }
                else {
                    const message = createMessage('timer', 'timer= ' + timer);
    
                    client.connection.send(JSON.stringify(message));
                }
            });
    
            clients = clients.filter(client => client.connection);
        }

        catch {
            logLineAsync(logFN, `[${port}] Server error`);
    
            res.status(500).end();
    
            return;
        }
    }, 3000);

    // res.send('START').end();
    
    logLineAsync(logFN, "Socket server running on port " + port);
});

server.listen(port, () => {
    logLineAsync(logFN, "Web server running on port " + port);
});
