/**
 * Consent plugin that is compatible with JsPsych v6.3.1.
 *
 * The functionality of this plugin is pretty simple: it formats and
 * displays the consent form enables the user to continue only when the
 * "I agree" checkbox is ticked.
 *
 * As it stands now, the plugin needs a couple of things to display properly:
 * (1) The index.html file to contain a <div id = "templates"> with a nested
 * <div id = "consent" class = "slide">. Please see the index.html file for
 * reference.
 * (2) All the css related formatting in the exp_style.css file
 * (3) All the imported bootstrap files for formatting (at the top of
 * index.html)
 *
 * @author Natalia Valez
 * @author Taylor Burke
 */

jsPsych.plugins["consent"] = (function() {
  var plugin = {};

  plugin.info = {
    name: "consent",
    parameters: {}
  };

  plugin.trial = function(display_element, trial) {
    var content = $("#templates #consent").html();
    $(display_element).html(content);
    $(display_element).addClass("consent");

    var agree_checkbox = $(display_element).find('input[type="checkbox"]');
    var continue_button = $(display_element).find("button");

    agree_checkbox.on("click", function() {
      // Enable the continue button if user checks "I agree".
      if (this.checked) {
        continue_button.prop("disabled", false);

        // End the trial when the user clicks "Continue".
        continue_button.one("click", function() {
          var trial_data = {
            consent: agree_checkbox.prop("checked")
          };

          $(display_element).removeClass("consent");
          jsPsych.finishTrial(trial_data);
        });
      } else {
        // Disable the continue button if user unchecks "I agree".
        continue_button.unbind("click");
        continue_button.prop("disabled", true);
      }
    });
  };

  return plugin;
})();
