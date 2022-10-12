/**
 * Creates a fullscreen promise that prompt a user to enter fullscreen mode
 * before the rest of the experiment is loaded in.
 *
 * While there is a fullscreen jsPsych plug in, there is the following warning
 * with v6.3.1:
 *
 * "For optimal performance, fullscreen mode should be manually triggered by the
 * user (e.g. F11 key in Chrome for Windows). Usage of the default Fullscreen
 * trigger from the jsPsych API library with this plugin might result in the
 * stimuli being displayed incorrectly."
 *
 * To get around that warning, this promise forces users to enter into
 * fullscreen before the experiment loads; thus, the stimulus location is
 * consistent across participants, regardless of screen size.
 */
$(document).ready(function() {
  $("#templates").hide();

  var fullscreen_promise = new Promise(function(resolve) {
    var listener = document.querySelector("#fullscreen-btn").addEventListener(
      "click",
      function() {
        var element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen();
          resolve(true);
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
          resolve(true);
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
          resolve(true);
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
          resolve(true);
        }
      },
      true
    );
  });

  fullscreen_promise.then(function(result) {
    $("#fullscreen-prompt").hide();

    let script = document.createElement("script");
    script.src = "scripts/exp-timeline.js";
    document.body.append(script);
  });
});
