# TODO

- we should send a 'delete_all_breakpoints' before we set new ones
- protocol doesn't have any notion of frame IDs. Stack frames need to be identified by a
  unique identifier accross all contexts
- write tests for DebugConnection, esp. the response handling code
- write test/fix behavior when no target is available, try use setTimeout from
  'net' to get a reasonable response time
- make this all Apache 2.0 licensed if possible, otherwise MIT, remember vscode-firefox-debug
- make sure response handlers in DebugConnection are removed from the map after a certain
  amount of time expires
