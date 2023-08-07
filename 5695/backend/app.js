import { WebSocketServer, createWebSocketStream } from 'ws';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import { Readable } from 'stream'

import logLineAsync from './utils/logLineAsync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 7980;
const logFN = join(__dirname, '_server.log');

let clients = [];

let timer = 0;

const resultFile = join(__dirname, 'download.jpeg');

const server = new WebSocketServer({ port: port });

server.on('connection', async connection => { // connection - это сокет-соединение сервера с клиентом

    await logLineAsync(logFN, `[${port}] ` + "new connection established");

    connection.send('hello from server to client!'); // это сообщение будет отослано сервером каждому присоединившемуся клиенту
    
    connection.on('message', (data, isBinary) => {
        if (data.toString() === "KEEP_ME_ALIVE" || data.toString() === "Hello from client to server!") {
            clients.forEach(client => {
                if (client.connection === connection) client.lastkeepalive = Date.now();
            });
        } else { // это сработает, когда клиент пришлёт какое-либо сообщение
            if (isBinary) {
                console.log('сервером получено сообщение от клиента: '); //  + data




                const buffer = Buffer.from(data, 'base64')
                const readable = new Readable()
                readable._read = () => {} // _read is required but you can noop it
                readable.push(buffer)
                readable.push(null)

                readable.on('data', chunk => {
                    console.log(chunk.length);
                });


                
                
                /*const readStream = fs.createReadStream(data);

                readStream.on('data', chunk => {
                    console.log(chunk.length); console.log("AAAAAA");
                });

                readStream.on('error', error => {
                    // console.log(error.name);
                });*/

                /*const writeStream = fs.createWriteStream(resultFile);
                // если файл уже есть, createWriteStream по умолчанию его перезаписывает (flags:'w'), поэтому удалять файл в начале и не пришлось
        
                data.readInt8.on('data', chunk => {
                    console.log(chunk.length + ' downloaded...');  
                    // с потоками можно не бояться делать много операций подряд, они не "перепутаются"
                    writeStream.write(chunk);
                });
          
                data.readInt8.on('end', () => {
                    console.log("resource has been downloaded");

                    writeStream.end();
                });
            
                writeStream.on('close', ()=>{
                    console.log("file has been written");
                });*/
            }
        }
    });

    clients.push( { connection: connection, lastkeepalive: Date.now() } );
});

setInterval(() => {
    timer++;

    clients.forEach(client => {
        if ((Date.now() - client.lastkeepalive) > 12000 ) {
            client.connection.terminate(); // если клиент уже давно не отчитывался что жив - закрываем соединение

            client.connection = null;

            logLineAsync(logFN, `[${port}] ` + "один из клиентов отключился, закрываем соединение с ним");
        }
        else
            client.connection.send('timer= ' + timer);
    });

    clients = clients.filter(client => client.connection); // оставляем в clients только живые соединения
}, 3000);

logLineAsync(logFN, "socket server running on port " + port);