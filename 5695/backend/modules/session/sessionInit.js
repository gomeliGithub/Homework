import session from 'express-session';
import MySQLSession from 'express-mysql-session';

import crypto from 'crypto';

const MySQLStore = MySQLSession(session);

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
	port: 3306,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: 'clients_db',
	createDatabaseTable: true,
	schema: {
		tableName: 'clientSessions',
		columnNames: {
			session_id: 'session_id',
            // login: 'login',
			expires: 'expires',
			data: 'data'
		}
	}
});

export default function sessionInit () {
    const secret = crypto.randomBytes(40).toString();

    return session({
        secret: secret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
        store: sessionStore
    });
}