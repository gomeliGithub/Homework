import { WebSocketServer, createWebSocketStream } from 'ws';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import logLineAsync from './utils/logLineAsync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 7980;
const logFN = join(__dirname, '_server.log');

let clients = [];

let timer = 0;

const server = new WebSocketServer({ port: port });

server.on('connection', async connection => {
    await logLineAsync(logFN, `[${port}] ` + "New connection established");

    const commonMessage = {
        event: '',
        data: 'hello from server to client! timer=' + timer
    }

    connection.send(JSON.stringify(commonMessage));
    
    connection.on('message', (data, isBinary) => {
        if (data.toString() === "KEEP_ME_ALIVE" || data.toString() === "Hello from client to server!") {
            clients.forEach(client => {
                if (client.connection === connection) client.lastkeepalive = Date.now();
            });
        } else {
            if (isBinary) {
                const splitedData = data.toString().split('\r\n\r\n', 2);

                const fileMeta = JSON.parse(splitedData[0].substring(1));
                const fileData = splitedData[1];

                console.log(fileMeta.size);
                console.log(fileData.length)
                

                /*
                const writeStream = fs.createWriteStream(resultFile);
                    writeStream.write(data);

                    writeStream.on('finish', () => {
                        const message = {
                            event: 'uploadFile',
                            data: 'SUCCESS'
                        }

                        connection.send(JSON.stringify(message));
                    });
                */
            }
        }
    });

    clients.push( { connection: connection, lastkeepalive: Date.now() } );
});

setInterval(() => {
    timer++;

    clients.forEach(client => {
        if ((Date.now() - client.lastkeepalive) > 12000 ) {
            client.connection.terminate();

            client.connection = null;

            logLineAsync(logFN, `[${port}] ` + "Один из клиентов отключился, закрываем соединение с ним");
        }
        else {
            const message = {
                event: 'timer',
                data: 'timer= ' + timer
            }

            client.connection.send(JSON.stringify(message));
        }
    });

    clients = clients.filter(client => client.connection);
}, 3000);

logLineAsync(logFN, "socket server running on port " + port);