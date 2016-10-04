# TODO

- write tests for DebugConnection, esp. the response handling code
- write test/fix behavior when no target is available, try use setTimeout from
  'net' to get a reasonable response time
- make sure response handlers in DebugConnection are removed from the map after a certain
  amount of time expires
- do we send an 'exit' packet to the target when the adapter is closed or debugging is stopped?
