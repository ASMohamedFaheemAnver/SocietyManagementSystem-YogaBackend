(function sleep(ms = 600) {
  var unixtime_ms = new Date().getTime();
  while (new Date().getTime() < unixtime_ms + ms) { }
})();