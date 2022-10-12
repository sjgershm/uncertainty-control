/**
 * For details about the experiment, please refer to "Mental control of
 * uncertainty"(Gershman & Burke, 2022).
 */

/**
 * Create and return a uniform distribution with the specified start and end,
 * inclusive.
 *
 * @param {Integer} start starting number of distribution
 * @param {Integer} end ending number of distribution
 * @return {Array<Integer>} entire uniform_distribution
 */
function uniform_distribution(start, end) {
  let size = end - start;
  return Array.from(Array(size + 1), (_, i) => i + start);
}

/**
 * Create and return a discrete array from zero to size, exclusive.
 *
 * @param {Integer} size The size of the array
 * @return {Array<Integer>} Ordered array that contains integers from 0 to size,
 * exlusive
 */
function range(size) {
  return uniform_distribution(0, size - 1);
}

/**
 * Transform a number into a capatilized letter while ensuring that "A"'s
 * char code is 0 (usually set as 1).
 *
 * @param {Integer} num_letter The charcter number from 0-64 to use.
 * @return {Char} transformed capitalized letter.
 */
function to_letter(num_letter) {
  return String.fromCharCode(num_letter + 64 + 1);
}

/**
 * Create, name, and write data to a ".csv" according to the save_data.php file.
 *
 * @param {String} name name of the folder to create
 * @param {CSV} data all the experiment data in csv format (usually gotten by
 * using jsPsych.data.get().csv())
 */
function save_data_csv(name, data) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "./save_data.php");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ filename: name, filedata: data }));
}

$(document).ready(function() {
  $("#templates").hide();

  const turkInfo = jsPsych.turk.turkInfo();
  const local_testing = turkInfo.workerId == "" ? true : false;
  const subjectId = local_testing
    ? jsPsych.randomization.randomID(12)
    : turkInfo.workerId;
  jsPsych.data.addProperties({ subjectId: subjectId });

  const stim_info = {
    img_path: "./images/black_dot_stimulus.png",
    min: 15,
    max: 65,
    variance: 15,
    trial_count: 0, //Incremented during trial feedback and reset at block onset.
    train: {
      num_blocks: 1,
      num_trials_per_block: 4,
      mag_dists: Array() // Updated when the training timeline is created.
    },
    test: {
      num_blocks: 6,
      num_trials_per_block: 40,
      mag_dists: Array() // Updated when the testing timeline is created.
    }
  };

  // Array contains all the block-specific average stimulus magnitudes.
  const all_avg_stim_mags = jsPsych.randomization.sampleWithoutReplacement(
    uniform_distribution(
      stim_info.min + stim_info.variance,
      stim_info.max - stim_info.variance
    ),
    stim_info.train.num_blocks + stim_info.test.num_blocks
  );

  const incentive_info = {
    high: {
      value: 5,
      color: "green"
    },
    low: {
      value: 1,
      color: "grey"
    },
    threshold: 3
  };

  // Conditions are used as the timeline variable.
  const conditions = [
    { incentive: incentive_info.high.value },
    { incentive: incentive_info.low.value }
  ];

  const instruction_pages = {
    task: [
      $("#task-instructions-1").html(),
      sprintf(
        $("#task-instructions-2").html(),
        stim_info.test.num_blocks,
        stim_info.test.num_trials_per_block,
        stim_info.img_path
      ),
      sprintf(
        $("#task-instructions-3").html(),
        `color: ${incentive_info.high.color}`,
        incentive_info.high.value,
        `color: ${incentive_info.low.color}`,
        incentive_info.low.value,
        incentive_info.threshold
      ),
      sprintf(
        $("#task-instructions-4").html(),
        incentive_info.high.value,
        incentive_info.high.value,
        incentive_info.high.value,
        incentive_info.threshold
      ),
      $("#task-instructions-5").html()
    ],
    train: [
      sprintf(
        $("#train-instructions").html(),
        stim_info.train.num_blocks,
        stim_info.train.num_trials_per_block
      )
    ],
    test: [
      sprintf(
        $("#test-instructions-1").html(),
        stim_info.test.num_blocks,
        stim_info.test.num_trials_per_block
      ),
      $("#test-instructions-2").html()
    ]
  };

  const comprehension_check_info = {
    num_correct: 0, // Updated during the comprehension check.
    num_loops: 0, // Incremented in the task introduction.
    questions: [
      {
        prompt:
          "Which of the following statements about reporting your estimate \
          is correct?",
        options: [
          "I have unlimited time to report my estimate.",
          "I need to wait for at least 10 seconds before reporting my estimate.",
          "There is a time limit. I only have 10 seconds to report my estimate."
        ],
        expected_indx: 2,
        name: "time"
      },
      {
        prompt:
          "Which of the following statements about the possible monetary \
          reward is correct?",
        options: [
          `$${incentive_info.high.value} indicate high reward trials.`,
          `$${incentive_info.low.value} indicate low reward trials.`,
          "A & B"
        ],
        expected_indx: 2,
        name: "incentive"
      },
      {
        prompt:
          "Which of the following statements about receiving a bonus is \
          correct?",
        options: [
          `The bonus is an accuracy bonus. On every trial, dot estimates 
          within ${incentive_info.threshold} of the true number of dots \
          receive a reward. My bonus is the reward I gained on a randomly \
          selected trial.`,
          `The bonus is a speed bonus. If, on every trial, my dot estimates \
          are faster than ${incentive_info.threshold} seconds, I will be \
          awarded $${incentive_info.high.value}.`,
          "However I do in this task, I cannot earn a bonus."
        ],
        expected_indx: 0,
        name: "bonus"
      }
    ]
  };

  // Prior to experiment onset, randomly select the block and trial used to
  // determine the user's bonus.
  const bonus_info = {
    random_block: jsPsych.randomization.sampleWithoutReplacement(
      range(stim_info.test.num_blocks),
      1
    )[0],
    random_trial: jsPsych.randomization.sampleWithoutReplacement(
      range(stim_info.test.num_trials_per_block),
      1
    )[0]
  };

  const preload = {
    type: "preload",
    auto_preload: true,
    message:
      "Please wait while the experiment loads. This may take a few \
    minutes.",
    error_message:
      "The experiment failed to load. Please contact the \
    researcher.",
    images: [stim_info.img_path],
    on_success: function(file) {
      console.log("File loaded: ", file);
    },
    on_error: function(file) {
      console.log("Error loading file: ", file);
    }
  };

  const consent = {
    type: "consent"
  };

  /**
   * Format and return the provided instruction pages.
   *
   * @param {Array<html>} pages An array of html pages to display.
   * @returns {Object<instructions>} A JsPsych instructions object containing
   * the given pages
   * @static
   */
  function format_instructions(pages) {
    return {
      type: "instructions",
      pages: pages,
      show_clickable_nav: true,
      allow_backward: true,
      show_page_number: true,
      css_classes: ["absolute-center"]
    };
  }

  /**
   * Create and return the complete comprehension check timeline.
   *
   * Using the provided questions, randomize the question ordering,
   * format each multiple choice question, and include answer feedback.
   *
   * @param {Array<Map>} questions An array of questions where each question is
   * formatted as such: {
   * prompt: {String},
   * options: {Array<String>},
   * expected_indx: {Integer},
   * name: {String}
   * }
   * @returns {Array<Object<quiz-multi-choice, instructions>>}
   * comprension_check_timeline the full array with all the formatted questions
   * (JsPsych quiz-multi-choice plugin) and feedback screen (JsPsych
   * instructions plugin)
   */
  function comprehension_check(questions) {
    let comprehension_check_timeline = [];

    // Randomize question ordering.
    const shuffled_question_indxs = jsPsych.randomization.shuffle(
      range(questions.length)
    );

    // Format each multiple choice question.
    for (
      let num_question = 0;
      num_question < shuffled_question_indxs.length;
      ++num_question
    ) {
      let question = questions[shuffled_question_indxs[num_question]];

      comprehension_check_timeline.push({
        type: "quiz-multi-choice",
        prompt: `<h4>${num_question + 1}. ${question.prompt}</h4>`,
        options: function() {
          // Formatting every option to mimic a multiple choice question
          return question.options.map(function(option, num_option) {
            return `(${to_letter(num_option)}) ${option}`;
          });
        },
        expected: function() {
          let expected_indx = question.expected_indx;
          return `(${to_letter(expected_indx)}) ${
            question.options[expected_indx]
          }`;
        },
        name: question.name,
        on_finish: function(data) {
          if (data.correct) {
            ++comprehension_check_info.num_correct;
          }
        },
        css_classes: ["absolute-center"]
      });
    }

    // Include answer feedback.
    comprehension_check_timeline.push({
      type: "instructions",
      pages: [
        function() {
          let prompt =
            comprehension_check_info.num_correct ==
            comprehension_check_info.questions.length
              ? "Great job, you passed! Press the button below to continue."
              : "Oh no! Please press the button below to repeat the instructions.";

          return sprintf(
            $("#comprehension-feedback").html(),
            comprehension_check_info.num_correct,
            prompt
          );
        }
      ],
      show_clickable_nav: true,
      allow_backward: false,
      button_label_next: "Next",
      css_classes: ["absolute-center"]
    });

    return comprehension_check_timeline;
  }

  const task_introduction = {
    timeline: [format_instructions(instruction_pages.task)].concat(
      comprehension_check(comprehension_check_info.questions)
    ),
    on_timeline_start: function() {
      ++comprehension_check_info.num_loops;
      comprehension_check_info.num_correct = 0;
    },
    // Repeat the timeline (instructions and comprehension check) until the
    // user correctly answers all the comprehension check questions.
    loop_function: function() {
      return (
        comprehension_check_info.num_correct !=
        comprehension_check_info.questions.length
      );
    },
    on_finish: function(data) {
      jsPsych.data.write({
        num_comprehension_loops: comprehension_check_info.num_loops
      });
    },
    css_classes: ["absolute-center"]
  };

  // The fixation indicates the trial-specific incentive.
  const fixation = {
    type: "html-keyboard-response",
    stimulus: function() {
      const incentive = jsPsych.timelineVariable("incentive");
      let color =
        incentive == incentive_info.low.value
          ? incentive_info.low.color
          : incentive_info.high.color;
      return `<div style="color:${color};" class ='reward'>$${incentive}<div>`;
    },
    choices: jsPsych.NO_KEYS,
    trial_duration: 1000,
    css_classes: ["absolute-center"],
    on_finish: function(data) {
      jsPsych.data.addDataToLastTrial({
        exp_stage: "fixation",
        trial: stim_info.trial_count,
        incentive: jsPsych.timelineVariable("incentive")
      });
    }
  };

  /**
   * Create the rdk stimulus with an incentive-specific color-coded aperture.
   *
   * @param {String} phase specifies if "test" or "train"
   * @param {Integer} num_block specifies what block number user is on
   * @return {Object<rdk>} the stimulus display
   */
  function stimulus(phase, num_block) {
    return {
      type: "rdk",
      // The number of dots to display is randomly sampled with replacement from
      // the phase- and block-specific discrete uniform distribution.
      number_of_dots: function() {
        // Note: JsPsych's sampleWith(out)Replacement functions don't actually
        // alter the arrays passed to them and the difference between these
        // methods only matter when you are sampling > 1. So, really, it doesn't
        // matter what sampling method is used here.
        return jsPsych.randomization.sampleWithReplacement(
          stim_info[phase].mag_dists[num_block],
          1
        )[0];
      },
      border: true,
      border_thickness: 3,
      border_color: function() {
        const incentive = jsPsych.timelineVariable("incentive");
        let color =
          incentive == incentive_info.low.value
            ? incentive_info.low.color
            : incentive_info.high.color;
        return color;
      },
      trial_duration: 1000,
      dot_radius: 4,
      move_distance: 0,
      choices: jsPsych.NO_KEYS,
      correct_choice: jsPsych.NO_KEYS,
      dot_color: "black",
      background_color: "white",
      aperture_type: 1,
      reinsert_type: 1,
      aperture_width: 400,
      aperture_center_x: window.innerWidth / 2,
      aperture_center_y: window.innerHeight / 2,
      on_finish: function(data) {
        jsPsych.data.addDataToLastTrial({
          exp_stage: "stimulus",
          trial: stim_info.trial_count,
          true_stim_mag: jsPsych.data.getLastTrialData().values()[0]
            .number_of_dots
        });
      }
    };
  }

  const estimate = {
    type: "modified-survey-html-form",
    preamble:
      "<p> What is your estimate of the number of dots in the array? </p>" +
      "<p>Please enter your response in the box below (numbers only). </p>",
    html: '<input name="estimate" type="number" required="true"></p>',
    button_label: "Submit",
    trial_duration: 10000,
    on_finish: function(data) {
      jsPsych.data.addDataToLastTrial({
        exp_stage: "estimate",
        trial: stim_info.trial_count,
        // The estimate_stim_mag will be a number NaN if the trial times out.
        estimate_stim_mag: parseInt(
          jsPsych.data.getLastTrialData().values()[0].response["estimate"]
        )
      });
    },
    css_classes: ["absolute-center"]
  };

  const confidence_rating = {
    type: "survey-likert",
    questions: [
      {
        prompt:
          "<p> How confident are you that your estimate captured the actual \
          number of dots in the array? </p>",
        name: "confidence",
        labels: [
          "0: Guessed randomly",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10: Very confident"
        ],
        required: true
      }
    ],
    on_finish: function(data) {
      jsPsych.data.addDataToLastTrial({
        exp_stage: "confidence",
        trial: stim_info.trial_count,
        confidence: jsPsych.data.getLastTrialData().values()[0].response
          .confidence
      });
    },
    css_classes: ["absolute-center"]
  };

  /**
   * Format the phase-specific trial feedback.
   *
   * During the training phase, users see the actual number of dots,
   * their estimate, and the points awarded for a total duration of 3 seconds.
   *
   * During the testing phase, users see the points awarded for a total duration
   * of 1 second.
   *
   * Global variable changes:
   * (1) the stim.info.trial_count is incremented to reflect the ending of a
   * trial
   *
   * @param {String} phase specifies if "test" or "train"
   * @returns {Object<html-keyboard-response>} The feedback to display
   */
  function trial_feedback(phase) {
    return {
      type: "html-keyboard-response",
      stimulus: function() {
        const trial_data = jsPsych.data
          .get()
          .last(4)
          .values();
        let reward = trial_data[0].incentive;
        const true_stim_mag = trial_data[1].true_stim_mag;
        const estimate_stim_mag = trial_data[2].estimate_stim_mag;

        // If a user timed out or their guess was greater than the
        // threshold, their reward is zero.
        if (
          Number.isNaN(estimate_stim_mag) ||
          Math.abs(estimate_stim_mag - true_stim_mag) > incentive_info.threshold
        ) {
          reward = 0;
        }

        if (phase == "train") {
          return sprintf(
            $("#train-feedback").html(),
            reward,
            true_stim_mag,
            estimate_stim_mag
          );
        }

        return sprintf($("#test-feedback").html(), reward);
      },
      trial_duration: function() {
        return phase == "train" ? 3000 : 1000;
      },
      choices: jsPsych.NO_KEYS,
      css_classes: ["absolute-center"],
      on_finish: function(data) {
        jsPsych.data.addDataToLastTrial({
          exp_stage: "feedback",
          trial: stim_info.trial_count,
          reward: jsPsych.data
            .getLastTrialData()
            .values()[0]
            .stimulus.trim()
            .split("$")[1][0]
        });
        ++stim_info.trial_count;
      }
    };
  }

  /**
   * Create and add all the phase-specific experiment blocks to the
   * experiment_timeline.
   *
   * At block onset, users are prompted with their progress and the
   * block-specific average stimulus magnitude.
   *
   * Global variable changes:
   * (1) the stim.info.trial_count is reset to reflect the beginning of a
   * block
   * (2) stim_info.phase.mag_dists is appended with the new block stimulus
   * magnitude distribution
   * (2) experiment_timeline is appended with all the new block prompts and
   * block procedure as they are created
   *
   * @param {String} phase specifies if "test" or "train"
   */
  function add_blocks_to_experiment_timeline(phase) {
    // Account for the fact that all_avg_stim_mags contains both the training
    // and testing average stimulus magnitudes.
    let block_start_indx = phase == "test" ? stim_info.train.num_blocks : 0;

    for (
      let num_block = 0;
      num_block < stim_info[phase].num_blocks;
      ++num_block
    ) {
      let block_avg_stim_mag = all_avg_stim_mags[block_start_indx + num_block];

      stim_info[phase].mag_dists.push(
        uniform_distribution(
          block_avg_stim_mag - stim_info.variance,
          block_avg_stim_mag + stim_info.variance
        )
      );

      let block_prompt = {
        type: "instructions",
        pages: [
          sprintf(
            $("#block-prompt").html(),
            num_block + 1,
            stim_info[phase].num_blocks,
            block_avg_stim_mag
          )
        ],
        show_clickable_nav: true,
        allow_backward: false,
        button_label_next: "Next",
        css_classes: ["absolute-center"]
      };

      let block_procedure = {
        timeline: [
          fixation,
          stimulus(phase, num_block),
          estimate,
          confidence_rating,
          trial_feedback(phase)
        ],
        randomize_order: true,
        data: {
          block: num_block,
          stim_avg_mag: block_avg_stim_mag,
          testing: function() {
            return phase == "test" ? true : false;
          }
        },
        on_timeline_start: function() {
          stim_info.trial_count = 0;
        },
        timeline_variables: conditions,
        sample: {
          type: "fixed-repetitions",
          // Ensure that the number of trials is evenly distributed across all
          // experimental conditions.
          size: stim_info[phase].num_trials_per_block / conditions.length
        }
      };
      experiment_timeline.push(block_prompt, block_procedure);
    }
  }

  const bonus_feedback = {
    type: "html-button-response",
    stimulus: function() {
      const block_data = jsPsych.data.get().filter({
        testing: true,
        block: bonus_info.random_block,
        trial: bonus_info.random_trial
      });
      const incentive = block_data.select("incentive").values[0];
      const true_stim_mag = block_data.select("true_stim_mag").values[0];
      const estimate_stim_mag = block_data.select("estimate_stim_mag")
        .values[0];
      const reward = block_data.select("reward").values[0];

      return sprintf(
        $("#bonus-feedback").html(),
        bonus_info.random_trial + 1,
        bonus_info.random_block + 1,
        incentive == incentive_info.high.value ? "high" : "low",
        estimate_stim_mag,
        true_stim_mag,
        reward == 0 ? "not" : "",
        incentive_info.threshold,
        reward == 0 ? "did not earn a bonus." : `earned a $${reward} bonus.`
      );
    },
    choices: ["Start Survey"],
    response_ends_trial: true,
    css_classes: ["absolute-center"],
    data: {
      exp_stage: "bonus",
      random_block: bonus_info.random_block,
      randoom_trial: bonus_info.random_trial
    }
  };

  const survey = {
    type: "survey"
  };

  const save_data = {
    type: "call-function",
    func: function() {
      save_data_csv(subjectId + "_output", jsPsych.data.get().csv());
    },
    timing_post_trial: 0
  };

  // Create the entire experiment timeline.
  let experiment_timeline = [
    preload,
    consent,
    task_introduction,
    format_instructions(instruction_pages.train)
  ];
  add_blocks_to_experiment_timeline("train");
  experiment_timeline.push(format_instructions(instruction_pages.test));
  add_blocks_to_experiment_timeline("test");
  experiment_timeline.push(bonus_feedback, survey);

  if (!local_testing) {
    experiment_timeline.push(save_data);
  }

  jsPsych.init({
    timeline: experiment_timeline,
    display_element: "jspsych-display",
    show_progress_bar: true,
    on_finish: function() {
      if (local_testing) {
        jsPsych.data.get().localSave("csv", "testdata.csv");
      }

      var debrief_txt = $("#debrief").html();
      $("#jspsych-display").html(debrief_txt);
    }
  });
});
