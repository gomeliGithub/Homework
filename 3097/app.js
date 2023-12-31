const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const webserver = express();

webserver.set("view engine", "hbs");
webserver.set('views', path.join(__dirname, '/views'));

webserver.use(express.urlencoded({ extended: false }));

const port = 7980;
const logFN = path.join(__dirname, '_server.log');
const correctDataFN = path.join(__dirname, 'correctData.json');

function logLineSync(logFilePath,logLine) {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
    let fullLogLine = time + " " + logLine;

    console.log(fullLogLine);

    const logFd = fs.openSync(logFilePath, 'a+');
    fs.writeSync(logFd, fullLogLine + os.EOL);
    fs.closeSync(logFd);
}

webserver.get('/', (req, res) => {
    logLineSync(logFN, "get index.hbs completed");

    res.render('index', { layout: false });
});

webserver.get('/data', (req, res) => {
    logLineSync(logFN, "get dataPage completed");

    if (req.query.hasOwnProperty('login') && req.query.hasOwnProperty('login')) res.send(`<p>login: ${req.query.login}<br>password: ${req.query.password}</p>`);
});

webserver.post('/validate', (req, res) => { 
    let correctData = null;

    try {
        correctData = JSON.parse(fs.readFileSync(correctDataFN))
    } catch {
        res.send("null");
    }

    if (correctData.login === req.body.login && correctData.password === req.body.password) {
        logLineSync(logFN, "validate completed");

        // res.send(`<p>login: ${req.body.login}<br>password: ${req.body.password}</p>`);
        const queryParamLogin = encodeURIComponent(req.body.login); 
        const queryParamPassword = encodeURIComponent(req.body.password); 

        res.redirect(302, `/data?login=${queryParamLogin}&password=${queryParamPassword}`);
    } else {
        logLineSync(logFN, "validate completed");

        res.render('index', {
            layout: false,
            oldLogin: req.body.login,
            oldPassword: req.body.password,
            invalid: true
        });
    }

});

webserver.listen(port, () => {
    logLineSync(logFN, "web server running on port " + port);
});