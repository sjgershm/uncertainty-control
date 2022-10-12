/**
 * Survey plugin compatible with JsPsych v6.3.1 and is experiment-specific. All
 * the trial data needs to be change to match every survey question
 * found in the html file.
 *
 * The functionality of this plugin is simple: it displays the survey content
 * as found in the index.html file and saves the user responses.
 *
 * @author Natalia Valez
 * Modifications @author Taylor Burke
 */

jsPsych.plugins["survey"] = (function() {
  var plugin = {};

  plugin.info = {
    name: "survey",
    parameters: {}
  };

  plugin.trial = function(display_element, trial) {
    // Load survey content.
    var content = $("#survey").html();
    $(display_element).html(content);

    // Save experiment-specific survey responses.
    $(display_element)
      .find(".submit")
      .click(function(e) {
        e.preventDefault();

        var trial_data = {
          gender_cat: $(display_element)
            .find('input[name="survey-gender"]:checked')
            .val(),
          gender_text: $(display_element)
            .find("#gender-other")
            .val(),
          age: $(display_element)
            .find("#survey-age")
            .val(),
          enjoyment: $(display_element)
            .find('input[name="survey-enjoy"]:checked')
            .val(),
          comments: $(display_element)
            .find("#survey-comments")
            .val()
        };

        $(display_element).html("");
        jsPsych.finishTrial(trial_data);
      });
  };

  return plugin;
})();
