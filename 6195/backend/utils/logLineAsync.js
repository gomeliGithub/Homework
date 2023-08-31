import * as fs from 'fs';
import { EOL } from 'os';

export default function logLineAsync (logFilePath, logLine) {
    return new Promise( (resolve, reject) => {
        const logDT = new Date();
        let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
        let fullLogLine = time +" " + logLine;
    
        console.log(fullLogLine);
    
        fs.open(logFilePath, 'a+', (err, logFd) => {
            if ( err ) 
                reject(err);
            else    
                fs.write(logFd, fullLogLine + EOL, (err) => {
                    if ( err )
                        reject(err); 
                    else    
                        fs.close(logFd, (err) =>{
                            if (err)
                                reject(err);
                            else    
                                resolve();
                        });
                });
    
        });
            
    });
}