## Changelog

You'll find a complete list of changes at our project site on [GitHub](https://github.com/otris/vscode-janus-debug).

### 0.0.11 (yyyy-mm-dd)

New Features in this release:

- The conflict mode is now the default state of all scripts, meaning every script will be checked on upload if it has been changed on server.

- Creating categories from folders and folders from categories is supported (but only available with DOCUMENTS #8041 or higher). ([#40](https://github.com/otris/vscode-janus-debug/issues/40)

- Add ``noLib: true`` to ``compilerOptions`` part in ``jsconfig.json`` when command **Install Intellisense Files** is executed.

- The version of the remote debugger is no logged in the log file of the requests. The line begins with "Determined version".

Following bugs have been addressed in this release:


### 0.0.10 (2017-08-22)

New Features in this release:

 - Users can now use keyboard shortcuts for uploading, running, uploading and running, and uploading from ts to js ([#84](https://github.com/otris/vscode-janus-debug/issues/84)).

 - The command `Upload Scripts From Folder` will upload scripts from folder and all subfolders ([#72](https://github.com/otris/vscode-janus-debug/issues/72)).

 - Flag `vscode-janus-debug.uploadOnSaveGlobal` will be saved in **User Settings**.

Following bugs have been addressed in this release:
 - The server console was not reconnecting after the launch.json was changed ([#103](https://github.com/otris/vscode-janus-debug/issues/103)).
 - Answer `Never upload automatcally` in dialog after saving `.js` file didn't work corryctly.

### 0.0.9 (2017-07-19)

New Features:

- Users can connect and disconnect the ServerConsole using the command palette now. Two new commands have been added: _Connect ServerConsole_ and _Disconnect ServerConsole_ ([#48](https://github.com/otris/vscode-janus-debug/issues/48)).

![Screenshot](img/connect-server-console.png "Screenshot")

- And one for the hackers: File logging is now additionally available in the extension process of VS Code and not only in the debug adapter process. To activate this feature you have to add `"vscode-janus-debug.log"` to your settings ([#30](https://github.com/otris/vscode-janus-debug/issues/30)).

- The configuration name for the extension settings in `settings.json` is now `"vscode-janus-debug"` instead of `"vscode-documents-scripting"`. The user has to change the name for any list in `settings.json`.

- Command for installing IntelliSense files.

- The debugger can now "Step Out" (Shift+F11) of a function. Just make sure you have the latest DOCUMENTS/JANUS server running ([#68](https://github.com/otris/vscode-janus-debug/issues/68)). Thanks [@PhilippRo](https://github.com/PhilippRo).

Fixes in this release:

- Fix problems with encrypted scripts again. It's not possible anymore to upload or download encrypted scripts. Scripts can only be encrypted on upload or decrypted on download. ([#64](https://github.com/otris/vscode-janus-debug/issues/64))

- Fix upload script via command palette. Now the extension will ask for the scriptname again, if upload script is called while another script is open in VS Code.

### 0.0.8 (2017-07-07)

New Features:

- Users can now write DOCUMENTS scripts in [TypeScript](https://www.typescriptlang.org/) and then use the command `Upload JS from TS` to compile the TypeScript file and upload the corresponding JavaScript ([#55](https://github.com/otris/vscode-janus-debug/issues/55)).
- Users can now download a script from the server via the context menu when using right-click on a folder.
- Users will be asked before passwords will be written in plain-text to the project's `launch.json` file.
- The extension comes with a lovely icon now 👊 ([#31](https://github.com/otris/vscode-janus-debug/issues/31)).

Following issues have been fixed in this release:

  - The debugger stops now immediately when a breakpoint is hit or the script halts ([#57](https://github.com/otris/vscode-janus-debug/issues/57)).
  - The version and commit number are now printed out on the console when the extension is activated ([#39](https://github.com/otris/vscode-janus-debug/issues/39)).
  - Users can now change all network related timeouts from within `launch.json` file ([#51](https://github.com/otris/vscode-janus-debug/issues/51)). Previously, not all timeouts where configurable.
  - Some minor errors have been fixed when a new `launch.json` is created when the user uploads a script the first time. ([5c45fa0](https://github.com/otris/vscode-janus-debug/commit/5c45fa0ee06c19ca2b1f1641cdce89e200175c16)).

### 0.0.7 (2017-07-07)

Accidentally released.

### 0.0.6 (2017-06-21)

Besides the usual minor fixes and corrections, this release adds the new Server Console output. This allows you to see the server's log lines directly in VS Code! (For more info, see this PR: [#47](https://github.com/otris/vscode-janus-debug/pull/47)).

### 0.0.5 (2017-06-02)

Most notable in this release: We have merged _vscode-documents-scripting_ and _vscode-janus-debug_ extensions into one single extension. Users do not need to install multiple extensions anymore to get the full experience. We hope that this makes development much easier and faster.

Lots of bugs have been fixed in this release:

  - Setting breakpoints is more reliable now ([#12](https://github.com/otris/vscode-janus-debug/issues/12)). Thanks to [ChDxterWard](https://github.com/ChDxterWard).
  - Fixed problems with encrypted and decrypted scripts. The encryption states are now read from DOCUMENTS server prior to every upload. The `// #crypt` entry in a script should work now as expected.
  - Fixed an issue that prevented connecting the debugger to a DOCUMENTS 5 server ([#23](https://github.com/otris/vscode-janus-debug/issues/23)). Sorry!

### 0.0.4 (2017-05-17)

This release includes two important bug fixes that make creating a launch.json file and connecting to a remote server much more reliable.

### 0.0.3 (2017-05-08)

No big changes. Timeouts are configurable via launch.json now.

### 0.0.2 (2017-03-22)

Initial release of the extension. Running and debugging simple scripts directly from within VS Code on a JANUS-based server works! 🎉

