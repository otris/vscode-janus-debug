# TODO

- write tests for ContextCoordinator, esp. the response handling code
- do we need to remove all previously set breakpoints in disconnectRequest?
- why on earth is VS Code asking for threadId 0 sometimes when there is no such context? 
- write test/fix behavior when no target is available, try use setTimeout from
  'net' to get a reasonable response time
- make sure response handlers in DebugConnection are removed from the map after a certain
  amount of time expires
