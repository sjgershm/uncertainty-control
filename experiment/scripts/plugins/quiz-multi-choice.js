/**
 * Comprehension check multi-choice plugin compatible with JsPsych v6.3.1.
 *
 * The functionality of this plugin formats a multiple choice question and only
 * allows a user to continue once a answer has been selected.
 *
 * @author Taylor Burke
 */

jsPsych.plugins["quiz-multi-choice"] = (function() {
  var plugin = {};

  plugin.info = {
    name: "quiz-multi-choice",
    parameters: {
      name: {
        name: jsPsych.plugins.parameterType.STRING,
        default: undefined
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined
      },
      options: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: undefined
      },
      expected: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: undefined
      }
    }
  };

  plugin.trial = function(display_element, trial) {
    // Format the multiple-choice question.
    var header = sprintf(
      '<div class = "quiz-wrapper"><h4><label for = "%s">%s</label></h4>',
      trial.name,
      trial.prompt
    );

    // Format all the possible answers.
    var options = '<div class = "form-group">';
    var q_template =
      '<div class = "form-check"> \
    <input class="form-check-input" type="radio" name="%s" id="%s-%i" value="%s"> \
    <label class="form-check-label" for="%s-%i">%s</label></div>';
    for (i = 0; i < trial.options.length; i++) {
      var opt_txt = sprintf(
        q_template,
        trial.name,
        trial.name,
        i,
        trial.options[i],
        trial.name,
        i,
        trial.options[i]
      );
      options = options + opt_txt;
    }
    options = options + "</div>";

    // Combine all the content (question, answers, next button).
    var button = '<button class = "jspsych-btn" disabled>Next ></button>';
    var content =
      '<form><div class = "quiz_wrapper">' +
      header +
      options +
      button +
      "</div></form></div>";
    $(display_element).html(content);

    // Enable the continue button when an answer is selected.
    $(display_element)
      .find('input[type="radio"]')
      .on("change", function() {
        $(display_element)
          .find("button")
          .removeAttr("disabled");
        $(display_element)
          .find("button")
          .unbind("click");
        $(display_element)
          .find("button")
          .one("click", function(e) {
            e.preventDefault();

            var ans = $(display_element)
              .find('input[type="radio"]:checked')
              .val();
            var trial_data = {
              answer: ans,
              correct: ans == trial.expected
            };

            jsPsych.finishTrial(trial_data);
          });

        $(display_element)
          .find('input[type="radio"]')
          .unbind("click");
      });
  };

  return plugin;
})();
