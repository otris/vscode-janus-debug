# Test Cases

## Upload / Download Scripts
Under construction


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
