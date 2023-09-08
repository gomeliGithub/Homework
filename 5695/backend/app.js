import express, { json } from 'express';
import { WebSocketServer } from 'ws';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt'
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

const origin = process.argv[2] === '--prod' ? 'http://test.expapp.online' : 'http://localhost:4200';

webserver.use(cors({
    origin,
    credentials: true
}));

webserver.use(json());

webserver.use(sessionInit())

const sequelize = await dbConnection();

const port = 80;
const port2 = 443;
const logFN = join(__dirname, '_server.log');
const filesInfoWithCommentsFN = join(__dirname, 'filesInfoWithComments.json');
const filesInfoWithCommentsFolderFN = join(__dirname, 'uploadedFiles');

let webSocketClients = [];

const socketServer = new WebSocketServer({ port: port2 }); 

socketServer.on('connection', (connection, request) => {
    const webSocketClientId = parseFloat(request.url.substring(2));

    if (isNaN(webSocketClientId)) connection.terminate();

    const currentClient = webSocketClients.find(client => client._id === webSocketClientId);

    if (!currentClient) connection.terminate();

    currentClient.connection = connection;

    logLineAsync(logFN, `[${port2}] New connection established. WebSocketClientId --- ${webSocketClientId}`);

    let timer = 0;
        
    connection.on('message', async (data, isBinary) => {
        if (data.toString() === "KEEP_ME_ALIVE") webSocketClients.forEach(client => client._id === webSocketClientId ? client.lastkeepalive = Date.now() : null);
        else {
            if (isBinary) {
                const fileData = data;

                if (currentClient.uploadedSize === 0) await logLineAsync(logFN, `[${port2}] Upload file ${currentClient.fileMetaName} is started`);

                currentClient.uploadedSize += fileData.length;

                currentClient.activeWriteStream.write(fileData, async () => {
                    const message = createMessage('uploadFile', 'SUCCESS', { uploadedSize: currentClient.uploadedSize, fileMetaSize: currentClient.fileMetaSize });

                    await logLineAsync(logFN, `[${port2}] WebSocketClientId --- ${webSocketClientId}. Chunk ${currentClient.currentChunkNumber} writed, size --> ${fileData.length}`);

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
                } else {
                    const message = createMessage('timer', 'timer= ' + timer);
    
                    client.connection.send(JSON.stringify(message));
                }
            });
    
            webSocketClients = webSocketClients.filter(client => client.connection);
        }

        catch (error) { console.error(error);
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

    if (!clientLogin || !clientPassword || (op === 'up' && !clientEmail)) {
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

        await sequelize.models.Client.create({ login: clientLogin, password: passwordHash, email: clientEmail, verified: false });

        await logLineAsync(logFN, `[${port}] Клиент --- ${clientLogin} --- зарегистрирован`);

        try {
            const apiURLOrigin = `${(new URL(req.url, `http://${req.headers.host}`)).origin}:${port.toString()}`; 

            const mailBody = `Спасибо за регистрацию. Для завершения регистрации перейдите по ссылке.
                <a href=${apiURLOrigin}/signUpVerify/:${clientLogin}>Подтвердить аккаунт</a>
            `;

            await sendEmail(clientEmail, 'Подтверждение аккаунта', mailBody);

            await logLineAsync(logFN, `[${port}] Письмо отправлено клиенту --- ${clientLogin} ---`);
        } catch (error) {
            await logLineAsync(logFN, `[${port}] При отправке письма клиенту --- ${clientLogin} --- произошла ошибка - ${error}`);

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

webserver.get('/signUpVerify/:login', async (req, res) => {
    const login = req.params.login.substring(1);

    const client = await sequelize.models.Client.findOne({ where: { login }});

    if (!client) {
        res.status(401).end();

        return;
    }

    await client.update({ verified: true}, { where: { login }});

    await logLineAsync(logFN, `[${port}] Аккаунт клиента --- ${login} --- подтвержден`);

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

    const fileMeta = JSON.parse(req.body.uploadFileMeta);
    const comment = req.body.uploadFileComment;

    const client = await sequelize.models.Client.findOne({ where: { login: clientLogin }});
    const clientLoginPattern = /^[a-zA-Z](.[a-zA-Z0-9_-]*)$/;

    if (typeof webSocketClientId !== 'number' || webSocketClientId < 0 || webSocketClientId > 1
        || !client || typeof clientLogin !== 'string' || clientLogin === '' || !clientLoginPattern.test(clientLogin)
        || typeof comment !== 'string' || comment === ''
    ) {
        res.status(400).end();

        return;
    }

    const newFilePath = join(__dirname, 'uploadedFiles', clientLogin, fileMeta.name);

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
    } catch {
        await fsPromises.mkdir(join(filesInfoWithCommentsFolderFN, clientLogin));
    }

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

        await logLineAsync(logFN, `[${port2}] WebSocketClientId --- ${webSocketClientId}. Stream error`);

        const currentClient = webSocketClients.find(client => client._id === webSocketClientId);

        const message = createMessage('uploadFile', 'ERROR', { uploadedSize: currentClient.uploadedSize, fileMetaSize: fileMeta.size });

        currentClient.connection.send(JSON.stringify(message));
    });

    writeStream.on('finish', async () => {
        const currentClient = webSocketClients.find(client => client._id === webSocketClientId);

        const message = createMessage('uploadFile', 'FINISH', { uploadedSize: currentClient.uploadedSize, fileMetaSize: fileMeta.size });

        const newFileInfo = {
            name: fileMeta.name,
            comment: currentClient.comment
        }

        await appendFileInfoWithComments(fsPromises, filesInfoWithCommentsFN, newFileInfo);

        await logLineAsync(logFN, `[${port2}] WebSocketClientId --- ${webSocketClientId}. All chunks writed, overall size --> ${currentClient.uploadedSize}. File ${fileMeta.name} uploaded`);

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
        fileMetaName: fileMeta.name, 
        fileMetaSize: fileMeta.size,
        comment, 
        lastkeepalive: Date.now()
    });

    return;
});

webserver.get('/getFilesInfo', async (req, res) => {
    const clientLogin = req.session.client.login;

    const client = await sequelize.models.Client.findOne({ where: { login: clientLogin }});

    if (!client) {
        res.status(400).end();

        return;
    }

    try {
        await fsPromises.access(filesInfoWithCommentsFN, fsPromises.constants.F_OK);
    }

    catch {
        await fsPromises.writeFile(filesInfoWithCommentsFN, JSON.stringify([]));

        res.send([]).end();

        return;
    }

    const readStream = fs.createReadStream(filesInfoWithCommentsFN, { encoding: 'utf8' });

    let filesInfoWithComments = '';

    readStream.on('data', chunk => filesInfoWithComments += chunk);

    readStream.on('end', () => res.send(JSON.parse(filesInfoWithComments)).end());
});

webserver.get('/getFile/:fileName', async (req, res) => {
    const fileName = req.params.fileName.substring(1);
    const clientLogin = req.session.client.login;

    const client = await sequelize.models.Client.findOne({ where: { login: clientLogin }});

    if (!client) {
        res.status(400).end();

        return;
    }

    const filePath = join(filesInfoWithCommentsFolderFN, clientLogin, fileName);

    try {
        await fsPromises.access(filePath, fsPromises.constants.F_OK);
    } catch {
        res.status(400).end();

        return;
    }

    res.download(filePath);
});

webserver.listen(port, async () => {
    await defineModels(sequelize);

    await sequelize.sync();

    await logLineAsync(logFN, "Web server running on port " + port);
});
