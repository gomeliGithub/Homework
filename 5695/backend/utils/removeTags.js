export default function removeTags (str, replaceStr = "") {
    if (typeof(str) === "string" && str.indexOf("<") != -1) {
        str = str.replace(openingTagRE, replaceStr);
        str = str.replace(closingTagRE, replaceStr);
    }

    return str;
}