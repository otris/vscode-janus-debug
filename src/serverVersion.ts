
/**
 * --- changelog_en.txt ---
 *
 * This Change log includes all error corrections and new functionalities
 * of the following DOCUMENTS build versions:
 *
 * 2045 5.0c HF1                                   (11/2017)
 * 2041 (intermediate version, not an offical HF)  (09/2017)
 * 2040 5.0c                                       (08/2017)
 * 2034 5.0b HF2                                   (04/2017)
 * 2032 5.0b HF1                                   (04/2017)
 * 2033 (intermediate version, not an offical HF)  (03/2017)
 * 2032 5.0b HF1                                   (03/2017)
 * 2030 5.0b                                       (12/2016)
 * 2023 5.0a HF1                                   (09/2016)
 * 2022 5.0a                                       (08/2016)
 * 2020 5.0a beta (not an HF)                      (06/2016)
 * 2015 (intermediate version, not an offical HF)  (05/2016)
 * 2014 5.0 HF2                                    (04/2016)
 * 2013 5.0 HF1                                    (11/2015)
 */
export function mapVersion(buildVer: string): string {
    let buildNo = parseInt(buildVer.replace('#', ''), 10);

    if (isNaN(buildNo)) {
        return '';
    }

    if (buildNo > 8000) {
        buildNo -= 6000;
    }

    if (buildNo >= 2045) {
        return '5.0c HF1';

    } else if (buildNo >= 2040) {
        return '5.0c';

    } else if (buildNo >= 2034) {
        return '5.0b HF2';

    } else if (buildNo >= 2032) {
        return '5.0b HF1';

    } else if (buildNo >= 2030) {
        return '5.0b';

    } else if (buildNo >= 2023) {
        return '5.0a HF1';

    } else if (buildNo >= 2022) {
        return '5.0a';

    } else if (buildNo >= 2014) {
        return '5.0 HF2';

    } else if (buildNo >= 2013) {
        return '5.0 HF1';

    }

    return '';
}
