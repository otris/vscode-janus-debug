import {versionMapping} from '../portalscript/versions/versionMapping';

export function mapVersion(buildVer: string): string {
    const buildNo = buildVer.replace('#', '');

    const keys = Object.keys(versionMapping);
    if (keys && keys.indexOf(buildNo) >= 0) {
        return (versionMapping as any)[buildNo];
    }

    return buildNo;
}

export function findLatestVersion(buildVer: string): string {
    const buildNo = buildVer.replace('#', '');

    const keys = Object.keys(versionMapping);
    if (keys && keys.indexOf(buildNo) >= 0) {
        return (versionMapping as any)[buildNo];
    } else if (buildNo > "8013") {
        let idx = keys.findIndex((k, i) => {
            if (buildNo < k) {
                return true;
            }
            return false;
        });
        if (idx === -1) {
            idx = keys.length;
        }
        return (versionMapping as any)[keys[idx - 1]];
    }

    return "";
}
