import logLineAsync from './utils/logLineAsync.js';

export default function reportServerError (error, res, logFN, port) {
    res.status(500).end(); // в прод-режиме нельзя отсылать на клиент подробности ошибки!

    logLineAsync(logFN, `[${port}] ` + error);
}