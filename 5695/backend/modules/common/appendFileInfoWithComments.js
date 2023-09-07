export default async function appendFileInfoWithComments (fsPromises, filesInfoWithCommentsFN, newFileInfo) {
    let filesInfoWithComments = null;

    try {
        filesInfoWithComments = JSON.parse(await fsPromises.readFile(filesInfoWithCommentsFN, { encoding: 'utf8' }));
    } catch {}

    if (!filesInfoWithComments) filesInfoWithComments = [];

    filesInfoWithComments.push(newFileInfo);
    
    await fsPromises.writeFile(filesInfoWithCommentsFN, JSON.stringify(filesInfoWithComments));
}