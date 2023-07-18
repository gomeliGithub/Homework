const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');
const fetch = require('node-fetch');

const webserver = express();

webserver.use(express.urlencoded({ extended: false }));
webserver.use(express.json());

webserver.use(cors({
    origin: 'http://localhost:4200'
}));

const port = 7980;
const logFN = path.join(__dirname, '_server.log');

function logLineSync(logFilePath,logLine) {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
    let fullLogLine = time + " " + logLine;

    console.log(fullLogLine);

    const logFd = fs.openSync(logFilePath, 'a+');
    fs.writeSync(logFd, fullLogLine + os.EOL);
    fs.closeSync(logFd);
}

webserver.post('/sendRequest', async (req, res) => { 
    const requestData = req.body;

    const headers = {};

    let body = {};

    requestData.requestHeaders.forEach(requestHeader => {
        const data = Object.values(requestHeader);

        headers[data[0]] = data[1];
    })

    const response = await fetch(requestData.requestUrl, {
        method: requestData.requestMethod,
        headers: headers
    });

    try {
        for await (const chunk of response.body) {
            body = JSON.parse(chunk.toString());
        }

        res.send({
            statusCode: response.status,
            headers: response.headers.raw(),
            body: body
        });
    } catch (err) {
        res.send({
            error: err.stack
        })
    }
});

webserver.listen(port, () => {
    logLineSync(logFN, "web server running on port " + port);
});