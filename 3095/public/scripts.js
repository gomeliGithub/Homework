window.onload = async function() {
    createVariantsButtons(await getVariants());

    const codeButtons = document.querySelectorAll('.codeButtons');

    codeButtons.forEach(codeButton => codeButton.addEventListener("click", voteClick));

    const downloadXMLButton = document.getElementById('downloadXMLButton');
    const downloadHTMLButton = document.getElementById('downloadHTMLButton');
    const downloadJSONButton = document.getElementById('downloadJSONButton');

    downloadXMLButton.addEventListener('click', downloadStat);
    downloadHTMLButton.addEventListener('click', downloadStat);
    downloadJSONButton.addEventListener('click', downloadStat);
};

async function voteClick (event) {
    const response = await fetch("/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ codeNumber: event.target.id })
    });

    if (response.ok) {
        createUpdatedStatTable(await getStat());
    }
}

async function getVariants () {
    const response = await fetch("/variants", {
        method: "GET"
    });

    if (response.ok) {
        const variants = await response.json();

        return variants.variantsArr;
    }
}

async function getStat () {
    const response = await fetch("/stat", {
        method: "POST"
    });

    if (response.ok) {
        const updatedStat = await response.json();

        return updatedStat;
    }
}

async function downloadStat (event) {
    const downloadButtonId = event.target.id;

    let accept = "";

    switch (downloadButtonId) {
        case "downloadXMLButton": { accept = "application/xml"; break; }
        case "downloadHTMLButton": { accept = "text/html"; break; }
        case "downloadJSONButton": { accept = "application/json"; break; }
    }

    const response = await fetch("/downloadStat", {
        method: "GET",
        headers: {
            'Accept': accept
        }
    });

    if (response.ok) {
        const fakebtn = document.createElement('a');

        const downloadedStat = await response.blob();

        const header = response.headers.get('Content-Disposition');
        const headerParts = header.split(';');
        
        const filename = headerParts[1].split('=')[1].replace(/['"]/g, '');
            
        fakebtn.href = window.URL.createObjectURL(downloadedStat);
        fakebtn.download = filename;   

        fakebtn.click();
    }
}

function createVariantsButtons (variantsArr) {
    const variantButtonsContainer = document.getElementById("variantButtonsContainer");

    variantsArr.forEach(variantArr => {
        const button = document.createElement("button");

        button.className = "codeButtons";
        button.id = variantArr[0];
        button.textContent = variantArr[1];

        variantButtonsContainer.append(button);
    });
}

function createUpdatedStatTable (updatedStat) {
    const statContainer = document.getElementById("statContainer");
    const table = document.querySelector("table");

    const updatedTable = document.createElement("table");
    const updatedStatThRow = document.createElement("tr");
    const updatedStatTdRow = document.createElement("tr");

    if (table) table.remove();

    if (updatedStat !== {}) {
        updatedTable.style.border = 1;

        const updatedStatArr = (Object.entries(updatedStat)).sort();

        updatedStatArr.forEach(codeNumberData => {
            const variantButton = document.getElementById(codeNumberData[0]);

            const th = document.createElement("th");
            const td = document.createElement("td");

            th.textContent = variantButton.textContent;
            td.textContent = codeNumberData[1];

            updatedStatThRow.append(th);
            updatedStatTdRow.append(td);
        });

        updatedTable.append(updatedStatThRow);
        updatedTable.append(updatedStatTdRow);

        statContainer.append(updatedTable);
    } else {
        const td = document.createElement("td");

        td.textContent = "Список голосов пуст";

        updatedStatThRow.append(td);
    }
}

function parseXml (xml, arrayTags) {
    let dom = null;

    if (window.DOMParser) dom = (new DOMParser()).parseFromString(xml, "text/xml");
    else if (window.ActiveXObject) {
        dom = new ActiveXObject('Microsoft.XMLDOM');

        dom.async = false;
            
        if (!dom.loadXML(xml)) throw dom.parseError.reason + " " + dom.parseError.srcText;
    } else throw "cannot parse xml string!";

    function isArray (o) {
        return Object.prototype.toString.apply(o) === '[object Array]';
    }

    function parseNode(xmlNode, result) {
        if (xmlNode.nodeName == "#text") {
            
            let v = xmlNode.nodeValue;
            
            if (v.trim()) result['#text'] = v;
            
            return;
        }

        let jsonNode = {};
        let existing = result[xmlNode.nodeName];
        
        if (existing) {
            if (!isArray(existing)) result[xmlNode.nodeName] = [existing, jsonNode];
            else result[xmlNode.nodeName].push(jsonNode);
        } else {
            if (arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1) result[xmlNode.nodeName] = [jsonNode];
            else result[xmlNode.nodeName] = jsonNode;
        }

        if (xmlNode.attributes) {
            let length = xmlNode.attributes.length;
            
            for (let i = 0; i < length; i++) {
                let attribute = xmlNode.attributes[i];
                
                jsonNode[attribute.nodeName] = attribute.nodeValue;
            }
        }

        let length = xmlNode.childNodes.length;
        
        for (let i = 0; i < length; i++) parseNode(xmlNode.childNodes[i], jsonNode);
    }

    let result = {};

    for (let i = 0; i < dom.childNodes.length; i++) parseNode(dom.childNodes[i], result);

    return result;
}