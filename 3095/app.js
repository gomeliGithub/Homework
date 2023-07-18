const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

const webserver = express();

webserver.set("view engine", "hbs");
webserver.set('views', path.join(__dirname, '/views'));

webserver.use(express.static(path.join(__dirname, "/public")));

webserver.use(express.json());
webserver.use(bodyParser.text());

const port = 7980;
const logFN = path.join(__dirname, '_server.log');
const votesFN = path.join(__dirname, 'votes.json');
const variantsFN = path.join(__dirname, 'variants.json');

function logLineSync(logFilePath,logLine) {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
    let fullLogLine = time + " " + logLine;

    console.log(fullLogLine);

    const logFd = fs.openSync(logFilePath, 'a+');
    fs.writeSync(logFd, fullLogLine + os.EOL);
    fs.closeSync(logFd);
}

webserver.get('/votePage', (_, res) => { 
    let votes = readJSONFile(votesFN);

    if (!votes) votes = {};

    logLineSync(logFN, "get votePage completed");

    res.render('index', { 
        layout: false
    });
});

webserver.get('/variants', (_, res) => { 
    logLineSync(logFN, "get variants completed");

    const variants = Object.entries(readJSONFile(variantsFN));

    res.send({ variantsArr: variants });
});

webserver.post('/stat', (_, res) => { 
    const votes = readJSONFile(votesFN);

    logLineSync(logFN, "get stat completed");

    res.send(votes ? votes : {});
});

webserver.post('/vote', (req, res) => {
    let votes = readJSONFile(votesFN);

    if (!votes) votes = {};

    votes[req.body.codeNumber] = votes[req.body.codeNumber] ? votes[req.body.codeNumber] += 1 : 1;
    
    fs.writeFileSync(votesFN, JSON.stringify(votes));
    
    logLineSync(logFN,`${req.body.codeNumber} + 1`);

    res.sendStatus(200);
});

webserver.get('/downloadStat', (req, res) => {
    const votes = readJSONFile(votesFN);

    const clientAccept = req.headers.accept;

    let stat = null;

    if (clientAccept === "application/xml") {
        const xml = createXML(votes);

        res.setHeader("Content-Disposition", 'attachment; filename="votes.xml"');
        res.setHeader("Content-Type", "application/xml");

        stat = xml;
    }

    if (clientAccept === "text/html") {
        let html = createHTML(votes);

        res.setHeader("Content-Disposition", 'attachment; filename="votes.html"');
        res.setHeader("Content-Type", "text/html");

        stat = html;
    }

    if (clientAccept === "application/json") {
        res.setHeader("Content-Disposition", 'attachment; filename="votes.json"');
        res.setHeader("Content-Type", "application/json");

        stat = votes;
    }

    logLineSync(logFN, "get downloadStat completed");

    res.send(stat);
});

webserver.listen(port, () => {
    logLineSync(logFN, "web server running on port " + port);
});

function readJSONFile (path) {
    let file = null;

    try {
        file = JSON.parse(fs.readFileSync(path));
    } catch {}

    return file;
}

function createXML (votes) {
    let xml = "<busket>";

    Object.keys(votes).forEach(codeNumber => {
        xml += `<codeNumber>${codeNumber}</codeNumber><votes>${votes[codeNumber]}</votes>`
    });

    xml += "</busket>";

    return xml;
}

function createHTML (votes) {
    let html = "";

    Object.keys(votes).forEach(codeNumber => {
        html += `<span>${codeNumber} - ${votes[codeNumber]}</span>`
    });

    return html;
}