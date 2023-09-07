import session from 'express-session';
import MySQLStore from 'express-mysql-session';

import crypto from 'crypto';

export default function sessionInit () {
    const secret = crypto.randomBytes(40);

    return session({
        secret: secret, // 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
        store: MySQLStore(session)
    });
}