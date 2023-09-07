export default function createMessage (eventType, eventText, percentUploadedOptions) {
    const message = {
        event: eventType,
        text: eventText
    }

    if (percentUploadedOptions) message.percentUploaded = Math.round((percentUploadedOptions.uploadedSize / percentUploadedOptions.fileMetaSize) * 100);

    return message;
}