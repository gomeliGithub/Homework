import fetch from 'node-fetch';

export async function sendRequest (requestBody, res) {
    const requestData = requestBody;

    if (!requestData.requestMethod || !requestData.requestUrl || !requestData.requestHeaders || !requestData.requestParameters) {
        res.status(400).end();
        return;
    }

    const headers = serializeData(requestData.requestHeaders);
    const parameters = serializeData(requestData.requestParameters);

    if (headers === null || parameters === null) {
        res.status(400).end();
        return;
    }

    const fetchOptions = {
        method: requestData.requestMethod,
        headers: headers
    }

    const regexURLAbsoluteIs = new RegExp('^(?:[a-z+]+:)?//', 'i');

    if (fetchOptions.method === "GET") {
        if (parameters) try {
            requestData.requestUrl = createGetUrlWithParams(requestData.requestUrl, parameters);
        } catch {
            res.status(400).end();
            return;
        }
    } else fetchOptions.body = parameters;

    let body = {};
    let response = {};

    if (!regexURLAbsoluteIs.test(requestData.requestUrl) || (fetchOptions.method !== "GET" && fetchOptions.method !== "POST")) {
        res.status(400).end();
        return;
    }

    try {
        response = await fetch(requestData.requestUrl, fetchOptions);
    } catch {
        res.status(400).end();
        return;
    }

    const responseHeaders = response.headers.raw();

    if (responseHeaders['content-type'][0] === 'application/json') body = await response.json();
    if (responseHeaders['content-type'][0] === 'image/jpeg') body = await response.blob();
    if (responseHeaders['content-type'][0] === ('text/plain' || 'text/html' || 'application/xml')) body = await response.text();

    return {
        statusCode: response.status,
        headers: response.headers.raw(),
        body: body
    }
}

function serializeData (data) {
    const serializeDataObj = {};

    try {
        data.forEach(dataValue => {
            const dataValueArr = Object.values(dataValue);

            serializeDataObj[dataValueArr[0]] = dataValueArr[1];
        });

        return serializeDataObj;
    } catch {
        return null;
    }
}

function createGetUrlWithParams (url, parameters) {
    const newGetUrlWithParams = new URL(url);

    Object.keys(parameters).forEach(key => {
        newGetUrlWithParams.searchParams.append(key, parameters[key]);
    });

    return newGetUrlWithParams.href;
}