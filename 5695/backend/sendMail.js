import nodemailer from 'nodemailer';

import removeTags from './utils/removeTags.js';

import { mailer_transportConfig, mailer_fromEmail } from './mail_credentials.js';

export default function sendEmail (recipientEmail, subject, body) {
    return new Promise( (resolve, reject) => {
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

        transporter.sendMail(message, (err,info) => {
            if (err) {
                console.error("sendEmail - error", err);

                reject(err);
            }
            else {
                resolve(info);
                /*
                    info.messageId most transports should return the final Message-Id value used with this property
                    info.envelope includes the envelope object for the message
                    info.accepted is an array returned by SMTP transports (includes recipient addresses that were accepted by the server)
                    info.rejected is an array returned by SMTP transports (includes recipient addresses that were rejected by the server)
                    info.pending is an array returned by Direct SMTP transport. Includes recipient addresses that were temporarily rejected together with the server response
                    info.response is a string returned by SMTP transports and includes the last SMTP response from the server                
                */
            }
        });
    });
}