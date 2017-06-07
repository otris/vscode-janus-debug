# vscode-janus-debug

[![Build Status](https://travis-ci.org/otris/vscode-janus-debug.svg?branch=master)](https://travis-ci.org/otris/vscode-janus-debug)

Visual Studio Code plugin for debugging JANUS-based applications.
Additional, in order to create, edit and execute JavaScript files on a Documents-Server with Visual Studio Code this extension provides the following features:
* Up- and downloading JavaScript files to and from a DOCUMENTS-Server.
* Running JavaScript files on a DOCUMENTS-Server.

Please note: This extension is still a prototype. Additional features like comparison of local scripts with scripts on the server or IntelliSense will soon be integrated. Please refer to https://github.com/otris/vscode-documents-scripting/issues for submitting suggestions, wishes or bugs. 

![Screenshot](https://github.com/otris/vscode-janus-debug/raw/master/img/extension-screenshot-1.png "Screenshot")

## Features

This extension allows you to debug your JavaScript code directly on a JANUS-based server. This includes launching a script from within VS Code and executing it remotely on the server, setting breakpoints, stepping through the code, and evaluate expressions.

It uses the [jsrdbg](https://github.com/swojtasiak/jsrdbg) Debug Protocol to attach to a remote server and debug the JavaScript code executed by SpiderMonkey.

Additional features

* Download single script.
* Upload single script.
    * Optionally set script to conflict mode, meaning the script will not be uploaded if it has been changed on server.
    * Optionally upload script automatically every time it is saved.
* Upload all scripts from a folder.
* Download all scripts from server to a folder.
    * Optionally define a download list containing the scripts to download at download all.
* Run single script.
* Compare local script with server script.
* Script settings can be set in .vscode/settings.json.


## Requirements

You need a relatively recent DOCUMENTS 5 (starting with 5.0c) or privacy 6.1 server up and running. Add following line to your server's .ini file:

```
JSDebugger yes
```

Then restart your server and make sure that your firewall rules allow access to port 8089.

## Known Issues

We still see a lot of issues at this early stage.

* Attach configuration is not working reliably ([#18](https://github.com/otris/vscode-janus-debug/issues/18)).
* `#import` and `#importFile` are not working ([#27](https://github.com/otris/vscode-janus-debug/issues/27)).

Please have a look at our [issue tracker](https://github.com/otris/vscode-janus-debug/issues) for a complete list of issues.

## Troubleshooting

If something doesn't work, please try to reproduce the issue and file a bug [here](https://github.com/otris/vscode-janus-debug/issues) if it is not already known. Please remember to

- Include the version you are using in the report.
- Tell us which server application you are debugging against and on what OS that server is running.
- Include any logs, if possible.

You'll find the log files in your `${workspaceRoot}` which is usually the folder you opened in VS Code. The log files are plain-text files so that you can inspect them yourself. We do not log password hashes but the log files might contain source code or other data that you may consider sensitive. Please make sure that you are fine with the data contained in the log file before submitting.

You can alter log behavior in the `.vscode/launch.json` file.

```json
"log": {
    "fileName": "${workspaceRoot}/vscode-janus-debug-launch.log",
    "logLevel": {
        "default": "Debug",
    }
}
```

The default log level can be any of `Debug`, `Info`, `Warn`, or `Error`.

## Legal Notice
This Visual Studio Code extension is developed by otris software AG and was initially released in March 2017. It is licensed under the MIT License, (see [LICENSE file](LICENSE)).

## About otris software AG
As a software-based data and document management specialist, otris software AG supports company decision-makers in realizing management responsibilities. The solutions from otris software are available for this purpose. They can be used track, control and document all administrative processes completely and with full transparency. otris software is based in Dortmund, Germany.

For more information about otris software AG visit our website [otris.de](https://www.otris.de/) or our Open Source repositories at [github.com/otris](https://github.com/otris).

**Enjoy!**
