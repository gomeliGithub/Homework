import nodemailer from 'nodemailer';

import removeTags from '../../utils/removeTags.js';

import { mailer_transportConfig, mailer_fromEmail } from './mail_credentials.js';

export default function sendEmail (recipientEmail, subject, body) { console.log(mailer_transportConfig);
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport(mailer_transportConfig);

        let text = body;
        let html = undefined;
        let textWOTags = removeTags(text);

        if (textWOTags !== text) { // если теги есть - отправляем две разных версии письма, HTML и текстовую; если тегов нет - только текстовую
            text = textWOTags;
            html = body;
        }

        let message = {
            from: mailer_fromEmail, // с какого ящика идёт отправка (емейл отправителя), может не совпадать с mailer_transportConfig.auth
            to: recipientEmail,
            subject: subject,
            text: text, // текстовая версия письма
            html: html, // HTML-версия письма
        };

        transporter.sendMail(message, (err, info) => {
            if (err) reject(err);
            else resolve(info);
        });
    });
}