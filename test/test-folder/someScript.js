function sleep(millis) {
  var date = Date.now();
  var curDate = null;
  do {
    curDate = Date.now();
  } while ((curDate - date) < millis);
};

function log(msg) {
  PDClass.outputMessage(msg);
};

log('Hello. ');
debugger;
(function(fn) {
    log('Yes, ');
    fn('this is dog.');
})(function(msg) {
    log(msg);
});
log('Woof, woof.');
for (var i = 0; i < 10; i++) {
  sleep(1000);
}
