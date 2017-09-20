const { exec } = require('child_process');
const fs = require('fs');

function determineCommit() {
    return new Promise((resolve, reject) => {
        exec('"git" log --oneline', function(err, stdout, stderr) {

            if (err) {
                return reject(err);
            } else {
                return resolve(stdout.substr(0, 6));
            }
        })
    });
}

function determineVersion() {
    return new Promise((resolve, reject) => {
        exec('"git" tag --sort version:refname', function(err, stdout, stderr) {
            if (err) {
                return reject(err);
            } else {
                let tags = stdout.split("\n");
                let newestTag = tags[tags.length - 2];
                if (newestTag) {
                    let numbers = newestTag.split(".");
                    return resolve({
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

    determineCommit().then((commit) => {
        determineVersion().then((version) => {

            fs.open('out/src/version.json', 'w', (err, fd) => {
                if (err) {
                    throw err;
                }

                let jsonObj = {
                    commit: commit,
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
    });
}

writeVersionToJson();
