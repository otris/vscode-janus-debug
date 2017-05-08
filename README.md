# vscode-janus-debug

[![Build Status](https://travis-ci.org/otris/vscode-janus-debug.svg?branch=master)](https://travis-ci.org/otris/vscode-janus-debug)

Visual Studio Code plugin for debugging JANUS-based applications.

## Features

This extension allows you to debug your JavaScript code directly on a JANUS-based server. This includes launching a script from within VS Code and executing it remotely on the server, setting breakpoints, stepping through the code, and evaluate expressions.

It uses the [jsrdbg](https://github.com/swojtasiak/jsrdbg) Debug Protocol to attach to a remote server and debug the JavaScript code executed by SpiderMonkey.

## Requirements

You need a relatively recent DOCUMENTS 5 or privacy 6.1 server up and running. Add following line to your server's .ini file:

```
JSDebugger yes
```

Then restart your server and make sure that your firewall rules allow access to port 8089.

## Release Notes

You'll find a complete list of changes at our project site on [GitHub](https://github.com/otris/vscode-janus-debug).

### 0.0.3

No big changes. Timeouts are configurable via launch.json now.

### 0.0.2

Initial release of the extension. Running and debugging simple scripts directly from within VS Code on a JANUS-based server works! 🎉

## Known Issues

We still see a lot of issues in this early stage.

* Attach configuration is not working reliably.
* Breakpoint appears always unverified if previous is. See [#12](https://github.com/otris/vscode-janus-debug/issues/12).

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
