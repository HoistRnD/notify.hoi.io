var pattern = '/app/';

require('blanket')({
  // Only files that match the pattern will be instrumented
  pattern: pattern
});