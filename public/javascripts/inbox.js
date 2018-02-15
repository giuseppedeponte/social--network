$(function() {
  // Change font size depending on text length
  var $quote = $(".blockquote p");
  for (var i = 0; $quote[i]; i += 1) {
    var $numWords = $($quote[i]).text().split(" ").length;
    if (($numWords >= 1) && ($numWords < 10)) {
      $($quote[i]).css("font-size", "28px");
    } else if (($numWords >= 10) && ($numWords < 20)) {
      $($quote[i]).css("font-size", "24px");
    } else if (($numWords >= 20) && ($numWords < 30)) {
      $($quote[i]).css("font-size", "20px");
    } else if (($numWords >= 30) && ($numWords < 40)) {
      $($quote[i]).css("font-size", "16px");
    } else {
      $($quote[i]).css("font-size", "14px");
    }
  }
});
