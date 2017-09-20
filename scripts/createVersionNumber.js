const { exec } = require('child_process');
const fs = require('fs');


function determineVersion() {
    return new Promise((resolve, reject) => {
        exec('"git" describe --abbrev=6 --dirty --always --tags --long', function(err, stdout, stderr) {
            if (err) {
                return reject(err);
            } else {
                let output = stdout.split("-");
                if (output && output.length >= 3) {
                    let newestTag = output[0];
                    let numbers = newestTag.split(".");
                    let commit = output[2].substr(1);
                    return resolve({
                        commit: commit,
                        major: numbers[0],
                        minor: numbers[1],
                        patch: numbers[2]
                    });
                } else {
                    return reject();
                }
            }
        })
    });
}


function writeVersionToJson() {

    determineVersion().then((version) => {
        fs.open('out/src/version.json', 'w', (err, fd) => {
            if (err) {
                throw err;
            }

            let jsonObj = {
                commit: version.commit,
                major: version.major,
                minor: version.minor,
                patch: version.patch,
            }

            fs.write(fd, JSON.stringify(jsonObj), (err) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            });
        });
    });
}

writeVersionToJson();
