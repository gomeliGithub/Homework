import express, { urlencoded, json } from 'express';
import { openSync, writeSync, closeSync } from 'fs';
import { join, dirname } from 'path';
import { EOL } from 'os';
import { fileURLToPath } from 'url';
import cors from 'cors';

import { sendRequest } from './service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();

webserver.use(urlencoded({ extended: false }));
webserver.use(json());

webserver.use(cors({
    origin: 'http://localhost:4200' // 'http://178.172.195.18:7981'
}));

const port = 7980;
const logFN = join(__dirname, '_server.log');

function logLineSync(logFilePath,logLine) {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
    let fullLogLine = time + " " + logLine;

    console.log(fullLogLine);

    const logFd = openSync(logFilePath, 'a+');
    writeSync(logFd, fullLogLine + EOL);
    closeSync(logFd);
}

webserver.post('/sendRequest', async (req, res) => { 
    const response = await sendRequest(req.body, res);

    res.send(response);
});

webserver.listen(port, () => {
    logLineSync(logFN, "web server running on port " + port);
});
