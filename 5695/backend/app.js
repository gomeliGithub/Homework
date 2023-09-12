import express, { json } from 'express';
import { WebSocketServer } from 'ws';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import cors from 'cors';
import 'dotenv/config';

import logLineAsync from './utils/logLineAsync.js';

import sessionInit from './modules/session/sessionInit.js';

import dbConnection from './modules/db/dbConnection.js';
import defineModels from './modules/db/models.js';

import sendEmail from './modules/mail/sendMail.js';

import createMessage from './modules/common/createMessage.js';
import appendFileInfoWithComments from './modules/common/appendFileInfoWithComments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webserver = express();

const origin = process.argv[2] === '--prod' ? 'http://178.172.173.222:7980' : 'http://localhost:4200'; // 'http://test.expapp.online'

const secret = crypto.randomBytes(40).toString('hex');

webserver.use(cors({
    origin,
    credentials: true
}));

webserver.use(json());

webserver.use(sessionInit(secret));

const sequelize = await dbConnection();

const port = 80;
const port2 = 443;
const logFN = join(__dirname, '_server.log');
const filesInfoWithCommentsFolderFN = join(__dirname, 'uploadedFiles');

let webSocketClients = [];

const socketServer = new WebSocketServer({ port: port2 }); 

socketServer.on('connection', (connection, request) => {
    const webSocketClientId = parseFloat(request.url.substring(2));

    if (isNaN(webSocketClientId)) {
        connection.terminate();

        return;
    }

    const currentClient = webSocketClients.find(client => client._id === webSocketClientId);

    if (!currentClient) {
        connection.terminate();

        return;
    }

    currentClient.connection = connection;

    logLineAsync(logFN, `[${port2}] New connection established. WebSocketClientId --- ${webSocketClientId}, login --- ${currentClient.login}`);

    let timer = 0;
        
    connection.on('message', async (data, isBinary) => {
        if (data.toString() === "KEEP_ME_ALIVE") webSocketClients.forEach(client => client._id === webSocketClientId ? client.lastkeepalive = Date.now() : null);
        else {
            if (isBinary) {
                const fileData = data;

                if (currentClient.uploadedSize === 0) await logLineAsync(logFN, `[${port2}] WebSocketClientId --- ${webSocketClientId}, login --- ${currentClient.login}. Upload file ${currentClient.fileMetaName}, size --- ${currentClient.fileMetaSize} is started`);

                currentClient.uploadedSize += fileData.length;

                currentClient.activeWriteStream.write(fileData, async () => {
                    const message = createMessage('uploadFile', 'SUCCESS', { uploadedSize: currentClient.uploadedSize, fileMetaSize: currentClient.fileMetaSize });

                    await logLineAsync(logFN, `[${port2}] WebSocketClientId --- ${webSocketClientId}, login --- ${currentClient.login}. Chunk ${currentClient.currentChunkNumber} writed, size --> ${fileData.length}, allUploadedSize --> ${currentClient.uploadedSize}`);

                    currentClient.currentChunkNumber += 1;

                    if (currentClient.uploadedSize === currentClient.fileMetaSize) currentClient.activeWriteStream.end();
                    else currentClient.connection.send(JSON.stringify(message));
                });
            }
        }
    });

    connection.on('close', async () => {
        if (currentClient.uploadedSize !== currentClient.fileMetaSize) {
            await fsPromises.unlink(join(__dirname, 'uploadedFiles', currentClient.login, currentClient.fileMetaName));

            webSocketClients = webSocketClients.filter(client => client._id !== currentClient._id);
        }
    });

    connection.on('error', async () => {
        await fsPromises.unlink(join(__dirname, 'uploadedFiles', currentClient.login, currentClient.fileMetaName));

        webSocketClients = webSocketClients.filter(client => client._id !== currentClient._id);
    });

    setInterval(() => {
        timer++;
    
        try {
            webSocketClients.forEach(client => {
                if ((Date.now() - client.lastkeepalive) > 12000) {
                    fsPromises.unlink(join(__dirname, 'uploadedFiles', currentClient.login, currentClient.fileMetaName)).then(() => {
                        client.connection.terminate();
    
                        client.connection = null;
        
                        logLineAsync(logFN, `[${port2}] Один из клиентов отключился, закрываем соединение с ним`);
                    });
                } else if (client.connection) {
                    const message = createMessage('timer', 'timer= ' + timer);
    
                    client.connection.send(JSON.stringify(message));
                }
            });
    
            webSocketClients = webSocketClients.filter(client => client.connection);
        } catch (error) {
            logLineAsync(logFN, `[${port2}] WebSocketServer error`);
        }
    }, 3000);
});

logLineAsync(logFN, "Socket server running on port " + port2);

webserver.post('/sign/:op', async (req, res) => {
    const op = req.params.op.substring(1);

    if (!op || (op !== 'in' && op !== 'up')) {
        res.status(400).end();

        return;
    }

    const { clientLogin, clientPassword, clientEmail } = req.body; 

    const clientLoginPattern = /^[a-zA-Z](.[a-zA-Z0-9_-]*)$/;
    const emailPattern = /^[^\s()<>@,;:\/]+@\w[\w\.-]+\.[a-z]{2,}$/i;

    if (!clientLogin || !clientLoginPattern.test(clientLogin) || !clientPassword || (op === 'up' && (!clientEmail || !emailPattern.test(clientEmail)))) {
        res.status(400).end();

        return;
    }

    const client = await sequelize.models.Client.findOne({ where: { login: clientLogin }});

    if (op === 'up') {
        if (client) {
            res.status(401).end();

            return;
        }

        const passwordHash = await bcrypt.hash(clientPassword, 10);

        const confirm_sid = Math.random().toString(20).substring(2, 20);

        const newClient = await sequelize.models.Client.create({ login: clientLogin, password: passwordHash, email: clientEmail, verified: false, confirm_sid });

        await logLineAsync(logFN, `[${port}] Клиент --- ${clientLogin} --- зарегистрирован`);

        try {
            const apiURLOrigin = `${(new URL(req.url, `http://${req.headers.host}`)).origin}:${port.toString()}`;

            const mailBody = `Спасибо за регистрацию. Для завершения регистрации перейдите по ссылке.
                <a href=${apiURLOrigin}/signUpVerify/:${confirm_sid}>Подтвердить аккаунт</a>
            `;

            await sendEmail(clientEmail, 'Подтверждение аккаунта', mailBody);

            await logLineAsync(logFN, `[${port}] Письмо отправлено клиенту --- ${clientLogin} ---`);

            try {
                await fsPromises.access(join(filesInfoWithCommentsFolderFN, clientLogin), fsPromises.constants.F_OK);
            } catch {
                await fsPromises.mkdir(join(filesInfoWithCommentsFolderFN, clientLogin));
            }
        } catch (error) {
            await logLineAsync(logFN, `[${port}] При отправке письма клиенту --- ${clientLogin} --- произошла ошибка - ${error}`);

            await newClient.destroy();

            res.status(500).end();

            return;
        }

        res.status(200).end();
    } else {
        if (!client || !(await bcrypt.compare(clientPassword, client.password)) || !client.verified) {
            res.status(401).end();

            return;
        }

        await logLineAsync(logFN, `[${port}] Клиент --- ${clientLogin} --- вошел в систему`);

        if (!req.session.client) {
            req.session.client = {};

            req.session.client.login = clientLogin;
        } else req.session.client.login = clientLogin;

        res.send({ login: clientLogin }).end();
    }
});

webserver.get('/signUpVerify/:confirm_sid', cors({ origin: '*' }), async (req, res) => {
    const confirm_sid = req.params.confirm_sid.substring(1); 

    const client = await sequelize.models.Client.findOne({ where: { confirm_sid }});

    if (!client || client.verified || client.createdAt < Date.now() - 3600000) {
        res.status(401).end();

        return;
    }

    await client.update({ verified: true, confirm_sid: null }, { where: { confirm_sid }});

    await logLineAsync(logFN, `[${port}] Аккаунт клиента --- ${client.login} --- подтвержден`);

    res.redirect(301, origin);
});

webserver.get('/checkSessionExists', async (req, res) => {
    if (req.session.client && req.session.client.login) {
        const login = req.session.client.login;

        res.send(login).end();
    } else res.send('NONEXISTS').end();
});

webserver.post('/uploadFile', async (req, res) => {
    const webSocketClientId = req.body._id;
    const clientLogin = req.body.clientLogin;

    let fileMeta = '';

    try {
        fileMeta = JSON.parse(req.body.uploadFileMeta);
    } catch {
        res.status(400).end();

        return;
    }

    const comment = req.body.uploadFileComment;

    const client = await sequelize.models.Client.findOne({ where: { login: clientLogin }});

    if (typeof webSocketClientId !== 'number' || webSocketClientId < 0 || webSocketClientId > 1 || !client
        || typeof comment !== 'string' || comment === ''
    ) {
        res.status(400).end();

        return;
    }

    const newFileId = crypto.randomBytes(15).toString('hex');

    const newFilePath = join(__dirname, 'uploadedFiles', clientLogin, newFileId);

    const activeUploadClient = webSocketClients.some(client => client._id === webSocketClientId);

    let activeUploadsClientNumber = 0;

    webSocketClients.forEach(client => client.activeWriteStream ? activeUploadsClientNumber += 1 : null);

    if (activeUploadClient) {
        res.status(400).end();

        return;
    }

    if (activeUploadsClientNumber > 3) {
        res.send('PENDING').end();

        return;
    }

    try {
        await fsPromises.access(newFilePath, fsPromises.constants.F_OK);

        res.send('FILEEXISTS').end();

        return;
    } catch { }

    const uploadedFilesNumber = (await fsPromises.readdir(join(filesInfoWithCommentsFolderFN, clientLogin))).length;

    if (uploadedFilesNumber === 10) {
        res.send('MAXCOUNT').end();

        return;
    }

    if (fileMeta.size > 104857600) {
        res.send('MAXSIZE').end();

        return;
    }

    if (fileMeta.name.length < 4) {
        res.send('MAXNAMELENGTH').end();

        return;
    }

    res.send('START').end();

    let currentChunkNumber = 0;
    let uploadedSize = 0;

    const writeStream = fs.createWriteStream(newFilePath);

    writeStream.on('error', async () => {
        await fsPromises.unlink(newFilePath);

        const currentClient = webSocketClients.find(client => client._id === webSocketClientId);

        await logLineAsync(logFN, `[${port2}] WebSocketClientId --- ${webSocketClientId}, login --- ${currentClient.login}. Stream error`);

        const message = createMessage('uploadFile', 'ERROR', { uploadedSize: currentClient.uploadedSize, fileMetaSize: fileMeta.size });

        currentClient.connection.send(JSON.stringify(message));
    });

    writeStream.on('finish', async () => {
        const currentClient = webSocketClients.find(client => client._id === webSocketClientId);

        const message = createMessage('uploadFile', 'FINISH', { uploadedSize: currentClient.uploadedSize, fileMetaSize: fileMeta.size });

        const newFileInfo = {
            id: currentClient.fileId,
            name: fileMeta.name,
            comment: currentClient.comment
        }

        const filesInfoWithCommentsFN = join(filesInfoWithCommentsFolderFN, currentClient.login, 'filesInfoWithComments.json');

        await appendFileInfoWithComments(fsPromises, filesInfoWithCommentsFN, newFileInfo);

        await logLineAsync(logFN, `[${port2}] WebSocketClientId --- ${webSocketClientId}, login --- ${currentClient.login}. All chunks writed, overall size --> ${currentClient.uploadedSize}. File ${fileMeta.name} uploaded`);

        currentClient.connection.send(JSON.stringify(message));
        currentClient.connection.terminate();
        currentClient.connection = null;

        webSocketClients = webSocketClients.filter((client => client.connection));
    });

    webSocketClients.push({ 
        _id: webSocketClientId, 
        login: clientLogin,
        activeWriteStream: writeStream, 
        currentChunkNumber, 
        uploadedSize, 
        fileId: newFileId,
        fileMetaName: fileMeta.name, 
        fileMetaSize: fileMeta.size,
        comment, 
        lastkeepalive: Date.now()
    });

    return;
});

webserver.get('/getFilesInfo', async (req, res) => {
    const clientLogin = req.session.client ? req.session.client.login : undefined;

    const client = await sequelize.models.Client.findOne({ where: { login: clientLogin }});

    if (!client) {
        res.status(400).end();

        return;
    }

    const filesInfoWithCommentsFN = join(filesInfoWithCommentsFolderFN, clientLogin, 'filesInfoWithComments.json');

    try {
        await fsPromises.access(filesInfoWithCommentsFN, fsPromises.constants.F_OK);
    } catch {
        await fsPromises.writeFile(filesInfoWithCommentsFN, JSON.stringify([]));

        res.send([]).end();

        return;
    }

    const readStream = fs.createReadStream(filesInfoWithCommentsFN, { encoding: 'utf8' });

    let filesInfoWithComments = '';

    readStream.on('data', chunk => filesInfoWithComments += chunk);

    readStream.on('end', () => res.send(JSON.parse(filesInfoWithComments)).end());
});

webserver.get('/getFile/:fileId', async (req, res) => {
    const fileId = req.params.fileId.substring(1);
    const clientLogin = req.session.client ? req.session.client.login : undefined;

    const client = await sequelize.models.Client.findOne({ where: { login: clientLogin }});

    if (!client) {
        res.status(401).end();

        return;
    }

    const filePath = join(filesInfoWithCommentsFolderFN, clientLogin, fileId);

    try {
        await fsPromises.access(filePath, fsPromises.constants.F_OK);
    } catch {
        res.status(400).end();

        return;
    }

    const filesInfoWithCommentsFN = join(filesInfoWithCommentsFolderFN, clientLogin, 'filesInfoWithComments.json');

    const filesInfoWithComments = JSON.parse(await fsPromises.readFile(filesInfoWithCommentsFN, { encoding: 'utf8' }));

    const originalFileName = filesInfoWithComments.find(fileInfo => fileInfo.id === fileId).name;

    res.download(filePath, originalFileName);
});

webserver.listen(port, async () => {
    await defineModels(sequelize);

    await sequelize.sync();

    await logLineAsync(logFN, "Web server running on port " + port);
});
