var compare = require("node-version-compare");

function myCompare(taggedVersion, latestVersion) {
    let docRegEx = /(?:DOCUMENTS )([0-9]+)\.([0-9]+)([a-z])?(?: HF)?([0-9]+)?/i;
    let taggedRegExp = taggedVersion.match(docRegEx);
    let latestRegExp = latestVersion.match(docRegEx);
    if (taggedRegExp && latestRegExp) {
        let taggedSemver = taggedRegExp[1] + "." + taggedRegExp[2] + (taggedRegExp[3]? ("." + taggedRegExp[3].toLowerCase().charCodeAt(0)) : "") + (taggedRegExp[4]? ("." + taggedRegExp[4]) : "");
        let latestSemver = latestRegExp[1] + "." + latestRegExp[2] + (latestRegExp[3]? ("." + latestRegExp[3].toLowerCase().charCodeAt(0)) : "") + (latestRegExp[4]? ("." + latestRegExp[4]) : "");
        let result = compare(latestSemver, taggedSemver);
        return result >= 0;
    }
    let elcRegEx = /(?:ELC )/i;
    let res = taggedVersion.match(elcRegEx);
    if (res) {
        return true;
    }
    return false;
}

module.exports = myCompare;
