let dividerRES="[ \n\r]";
let tagNameRES="[a-zA-Z0-9]+";
let attrNameRES="[a-zA-Z]+";
let attrValueRES="(?:\".+?\"|'.+?'|[^ >]+)";
let attrRES="("+attrNameRES+")(?:"+dividerRES+"*="+dividerRES+"*("+attrValueRES+"))?";
let openingTagRES="<("+tagNameRES+")((?:"+dividerRES+"+"+attrRES+")*)"+dividerRES+"*/?>"; // включает и самозакрытый вариант
let closingTagRES="</("+tagNameRES+")"+dividerRES+"*>";

let openingTagRE=new RegExp(openingTagRES,"g");
let closingTagRE=new RegExp(closingTagRES,"g");

export default function removeTags (str, replaceStr = "") {
    if (typeof(str) === "string" && str.indexOf("<") != -1) {
        str = str.replace(openingTagRE, replaceStr);
        str = str.replace(closingTagRE, replaceStr);
    }

    return str;
}