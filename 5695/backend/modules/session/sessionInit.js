import session from 'express-session';
import MySQLSession from 'express-mysql-session';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 часа

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

export default function sessionInit (secret) {
    return session({
        secret: secret,
        resave: false,
        saveUninitialized: false,
        cookie: { 
			httpOnly: true,
			maxAge: TWENTY_FOUR_HOURS,
			secure: false,
			sameSite: 'lax'
		},
        store: sessionStore
    });
}