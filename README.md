# vscode-janus-debug

[![Build Status](https://travis-ci.org/otris/vscode-janus-debug.svg?branch=master)](https://travis-ci.org/otris/vscode-janus-debug)

Visual Studio Code plugin for developing and debugging JavaScript on DOCUMENTS 5 and and other JANUS-based applications.

![Screenshot](https://github.com/otris/vscode-janus-debug/raw/master/img/extension-screenshot-1.png "Screenshot")


## Features

This extension allows you to debug your JavaScript code directly on a JANUS-based server like DOCUMENTS, otris contract, and otris privacy. This includes launching a script from within VS Code and executing it remotely on the server, setting breakpoints, stepping through the code, and evaluating expressions<sup>1</sup>.

This extensions includes lots of additional features that ease the development, especially on DOCUMENTS 5.


### Commands

The following commands are supported.

| **Command** | **Description** |
| --- | --- |
| **Uploading/Downloading Scripts** ||
| Upload Script | Uploads a script to the server |
| Upload Folder | Uploads all scripts of a folder inclusive all subfolders to the server |
| Download Script | Downloads a script from the server |
| Download All | Downloads all scripts from the server to a folder |
| Download Folder (coming soon) | Downloads scripts in a folder from server |
| Compare Script | Compares a script to the corresponding script on server |
| **Executing Scripts** ||
| Run Script | Executes a script |
| Upload and Run | Uploads and executes a script |
| **Developing Scripts** ||
| Install IntelliSense | Installs available TypeScript Defintion files for IntelliSense for PortalScripting |
| View Documentation | Opens a browser with the HTML documentation |
| **DOCUMENTS server information** ||
| Connect Server Console | Show all messages of the DOCUMENTS server in terminal |
| Disonnect Server Console | Stop showing server messages in terminal |
| Show DOCUMENTS Version | Show version of the DOCUMENTS server |
| **Not supported** ||
| Upload set of scripts selected in explorer | Select a set of files in explorer not supported by VS Code |
| Download set of scripts selected in selection list | Select a set of entries in selection list not supported by VS Code |
| Upload all open scripts | List of all open editors not available in VS Code |


### Settings

The following features can be influenced by settings (in `settings.json`)

**Encryption**
* A script is encrypted on upload, if
  * The corresponding script on server is encrypted
  * The script source code contains `// #crypt`
  * `vscode-janus-debug.encryptOnUpload = true`
* The encryption on upload can be ignored (coming soon)

**Script Parameters as JSON**
* Parameters are uploaded and downloaded together with every script, if
  * `vscode-janus-debug.scriptParameters = true`

**Conflict Mode**
* A warning with option to cancel is shown on upload, if
  * The source code of the corresponding script has been changed on server
  * The script is encrypted on server and no decryption permission is available
* The warning can be avoided, if
  * `vscode-janus-debug.forceUpload = true`

**View Documentation in Browser**
* This command will jump directly to a function or member, if
  * In `vscode-janus-debug.browser` a browser is selected.

**Server Console**
* Can be connected and disconnected by settings either.

**Auto-upload script on save**
* Scripts can be automatically uploaded every time the user saves the file.


## Requirements

This extension is only compatible with the JANUS servers listed below. Not every version supports every feature:

| Server version                  	| Up-/downloading / running scripts 	| Remote debugging 	|
|---------------------------------	|-----------------------------------	|------------------	|
| DOCUMENTS 5.0a & DOCUMENTS 5.0b 	| X                                 	|                  	|
| DOCUMENTS 5.0c                  	| X                                 	| X                	|
| privacy 6.1                     	|                                   	| X                	|

If you suspect compatibility issues with your setup, please report them in the issue section.


## Remote Debugging

If you want to use the remote debugging features you need **at least DOCUMENTS 5.0c**!

Add following line to your server's .ini file to enable the debugging engine:

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

## Development
If you want to hack on this VS Code extension start with following recipe:

Fork the repo on our GitHub [project page](https://github.com/otris/vscode-janus-debug) and then

```bash
$ git clone https://github.com/your-user-name/vscode-janus-debug.git  # Clone the forked repo
$ cd vscode-janus-debug/  # Change into the source directory
$ npm i  # Install necessary dependencies
```
Then open the folder in VS Code and you're all set. There are two configurations in the `launch.json` file, one configuration that starts a new instance of VS Code with just our extension installed, the so called Extension Host, the other configuration executes all tests using mocha.

Make sure you read the [contribution guide](https://github.com/otris/vscode-janus-debug/blob/master/CONTRIBUTING.md). Happy hacking!

## Legal Notice
This Visual Studio Code extension is developed by otris software AG and was initially released in March 2017. It is licensed under the MIT License, (see [LICENSE file](LICENSE)).

## About otris software AG
As a software-based data and document management specialist, otris software AG supports company decision-makers in realizing management responsibilities. The solutions from otris software are available for this purpose. They can be used track, control and document all administrative processes completely and with full transparency. otris software is based in Dortmund, Germany.

For more information about otris software AG visit our website [otris.de](https://www.otris.de/) or our Open Source repositories at [github.com/otris](https://github.com/otris).

**Enjoy!**

<sup>1</sup> It uses the [jsrdbg](https://github.com/swojtasiak/jsrdbg) Debug Protocol to attach to a remote server and debug the JavaScript code executed by SpiderMonkey. Check it out if you want to know more.
