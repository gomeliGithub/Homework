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
    origin: 'http://localhost:4200' // 'http://178.172.195.18:7981'
}));

webserver.use(json());

const port = 7980;
const logFN = join(__dirname, '_server.log');

webserver.get('/getDBList', async (_, res) => { 
    const dbList = [ 'learning_db', 'site_db' ];

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
    
    if (dbName !== ('learning_db' || 'site_db')) {
        res.status(400).end();

        return;
    }

    const connectionConfig = {
        host     : process.env.DB_HOST,
        user     : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        database : dbName
    };

    let connection = null;

    try {
        connection = mysql.createConnection(connectionConfig); // в каждом обработчике express устанавливаем с MySQL новое соединение!

        connection.connect();

        connection.query(`${sqlQuery};`, (error, results, fields) => {
            if (error) {
                // здесь нет смысла делать throw, т.к. это коллбек, он выполняется не внутри try
                reportServerError(error, res, logFN, port);
            }
            else {
                const fieldsTitles = Object.keys(results[0]);
                const itemsValues = results.map(item => Object.values(item));

                // console.log(results);

                // console.log(fieldsTitles);
                // console.log(itemsValues);

                if (sqlQuery.startsWith('SELECT')) res.send({ fieldsTitles, itemsValues }).end();
                else res.send({ rowsNumberAffected: results.affectedRows });
            }

            connection.end();
        });
    }
    catch (error) {
        // этот catch словит ошибки, которые могут возникнуть при createConnection или connect, но не ошибки возникшие при выполнении SQL-запроса
        reportServerError(error, res, logFN, port);

        if (connection) connection.end();
    }
});

webserver.listen(port, () => {
    logLineAsync(logFN, `[${port}] Web server running on port ${port}`);
});
