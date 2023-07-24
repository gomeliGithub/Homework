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
    origin: 'http://localhost:4200' // 'http://178.172.195.18:7981'
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

    const headers = serializeData(requestData.requestHeaders);
    const parameters = serializeData(requestData.requestParameters);

    const fetchOptions = {
        method: requestData.requestMethod,
        headers: headers
    }

    if (fetchOptions.method !== "GET") fetchOptions.body = parameters;

    let body = {}; 

    if (!requestData.requestUrl.startsWith('http://') || (fetchOptions.method !== "GET" && fetchOptions.method !== "POST")) res.status(400).end();

    const response = await fetch(requestData.requestUrl, fetchOptions);

    const responseHeaders = response.headers.raw();

    if (responseHeaders['content-type'][0] === 'application/json') body = JSON.parse(await response.json());
    if (responseHeaders['content-type'][0] === 'image/jpeg') body = await response.blob();
    if (responseHeaders['content-type'][0] === ('text/plain' || 'text/html' || 'application/xml')) body = await response.text();

    res.send({
        statusCode: response.status,
        headers: response.headers.raw(),
        body: body
    });
});

function serializeData (data) {
    const serializeDataObj = {};

    data.forEach(dataValue => {
        const dataValueArr = Object.values(dataValue);

        serializeDataObj[dataValueArr[0]] = dataValueArr[1];
    });

    return serializeDataObj;
}

webserver.listen(port, () => {
    logLineSync(logFN, "web server running on port " + port);
});
