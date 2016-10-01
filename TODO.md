# TODO

- protocol doesn't have any notion of frame IDs. Stack frames need to be identified by a
  unique identifier across all contexts. We could use a combination of context id and depth of
  the frame in the stacktrace of that context. But: id must be a number :/
- write tests for DebugConnection, esp. the response handling code
- write test/fix behavior when no target is available, try use setTimeout from
  'net' to get a reasonable response time
- make sure response handlers in DebugConnection are removed from the map after a certain
  amount of time expires
- do we send an 'exit' packet to the target when the adapter is closed or debugging is stopped?
