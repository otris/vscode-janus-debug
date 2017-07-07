# Test Cases

## Command Palette

1. Download scripts to folder (folder, new folder)
2. Download script (scriptname, folder, new folder)
3. Upload scripts from folder (folder)
4. Upload script (script, folder)
5. Run script (scriptname)
6. Login (launch.json)

* script
    * positive:
        * valid path
        * encrypted, decrypted (check settings.json)
        * with bom, without bom
    * negative: invalid path
* scriptname
    * positive: scriptname existing on server
    * negative: scriptname not existing on server
* folder
    * positive: absolute
    * negative: path not in root, relative path
* new folder
    * positive: absolute with new subfolder
    * negative: absolute with new subfolder/subfolder, incorrect foldername, path not in root, relative path

## Context-Menus

## Events

* Save script
* Delete Script that is listed in settings.json as encrypted or decrypted

## Keys

* Run script

## Debugger
### Launch configuration
1. copy the test/test-folder to any location
2. open the copy of the test-folder as your VS Code project
3. ensure launch.json is generated on F5 or 'Open launch.json' gear
3. ensure your launch config is configured properly
4. start someScript.js with stopOnEntry true

### Stopping, Continuing and Variable Inspection
1. after the debugger halts set some breakpoints (one breakpoint might be
  after an assignment (i.e. line 26), a function-call an somewhere
  else)
2. press continue and check if the Debugger stops at the next breakpoint
3. when the debugger stops at line 26, check if the information about the
  Variable is correct
4. change a, Step Over and check if the output on the server console is
  correct
5. check if Pause, pauses the execution
6. check if Step Over continues to next line of the code
7. check if Step Into stops at the next executed expression
8. check if Step Out executes the remaining lines of a function.
