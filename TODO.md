# TODO

- write tests for DebugConnection, esp. the response handling code. Maybe make a
  DebugConnection.handleResponse = (response: Response) => { /* ... */ }
- write test/fix behavior when no target is available, try use setTimeout from
  'net' to get a reasonable response time
- make this all Apache 2.0 licensed if possible, otherwise MIT, remember vscode-firefox-debug
