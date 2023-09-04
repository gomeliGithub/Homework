import express, { json } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import mysql from 'mysql2';
import 'dotenv/config'

import logLineAsync from './utils/logLineAsync.js';
import reportServerError from './reportServerError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();

webserver.use(cors({
    origin: 'http://expappon.vh122.hosterby.com' // 'http://localhost:4200'
}));

webserver.use(json());

const port = 7980;
const logFN = join(__dirname, '_server.log');

let dbList = null;

let connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD
});

connection.connect();

connection.query('SHOW DATABASES', (_, results) => {
    dbList = results.map(dbObj => dbObj['Database']);

    connection.end();
});

webserver.get('/getDBList', async (_, res) => { 
    await logLineAsync(logFN, `[${port}] Get DBList`);

    res.send(dbList).end();
});

webserver.post('/sendSQLQuery', async (req, res) => { 
    const { sqlQuery, dbName } = req.body;

    if (typeof sqlQuery !== 'string' || typeof dbName !== 'string'
        || sqlQuery === '' || dbName === ''
    ) {
        res.status(400).end();

        return;
    }

    const forbiddenReservedWords = [ 'CREATE', 'DATABASE', 'SHOW', 'DATABASES', 'USE', 'TABLE', 'TABLES', 'DROP' ];

    const splittedSqlQuery = sqlQuery.split(' ');

    if (!dbList.includes(dbName) || splittedSqlQuery.some(word => (word.trim() === '' || forbiddenReservedWords.includes(word.toUpperCase())))
    ) {
        res.status(400).end();

        return;
    }

    let connection = null;

    try {
        connection = mysql.createConnection({
            host     : process.env.DB_HOST,
            user     : process.env.DB_USER,
            password : process.env.DB_PASSWORD,
            database : dbName
        });

        connection.connect();

        connection.query(`${sqlQuery};`, (error, results, fields) => {
            if (error) {
                reportServerError(error, res, logFN, port);
            }
            else {
                const fieldsTitles = Object.keys(results[0]);
                const itemsValues = results.map(item => Object.values(item));
                
                if (!results.affectedRows) res.send({ fieldsTitles, itemsValues }).end();
                else res.send({ rowsNumberAffected: results.affectedRows }).end();
            }

            connection.end();
        });
    }
    catch (error) {
        reportServerError(error, res, logFN, port);

        if (connection) connection.end();
    }
});

webserver.listen(port, () => {
    logLineAsync(logFN, `[${port}] Web server running on port ${port}`);
});