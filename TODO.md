# TODO

- sendRequest should return a Promise rather than take a callback function
- use Promise.all() for this here
- write tests for DebugConnection, esp. the response handling code
- rename extension to vscode-janus-debug
- write test/fix behavior when no target is available, try use setTimeout from
  'net' to get a reasonable response time
