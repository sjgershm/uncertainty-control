#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Combines and saves all the data collected from the experiment in
"Mental control of uncertainty" (Gershman & Burke, 2022) into tidy data format.

If you are going to use this script when replicating our experiment make sure
you change the folder paths to match your folder structure.

@author: Taylor D Burke
"""

import os
import copy
import numpy as np
import pandas as pd

# To be used on pilot 1
EXPERIMENT_SPECS_V_1 = {
    "low_incentive": 1,
    "high_incentive": 3,
    "reward_threshold": 2,
    "min_avg_stim": 30,
    "max_avg_stim": 50,
    "min_stim": 15,
    "max_stim": 65,
    "num_blocks": 6,
    "num_trials_per_block": 40,
}

# To be used on pilot 2
EXPERIMENT_SPECS_V_2 = copy.deepcopy(EXPERIMENT_SPECS_V_1)
EXPERIMENT_SPECS_V_2["reward_threshold"] = 3

# To be used on pilot 3+
# Note this is copied from the experiment V2 and therefore has the numerosity
# threshold +/- 3 for accurate answers
EXPERIMENT_SPECS_V_3 = copy.deepcopy(EXPERIMENT_SPECS_V_2)
EXPERIMENT_SPECS_V_3["high_incentive"] = 5


def combine_subjects(folder_path, experiment_specs):
    """Combine, for a single pilot, all subject data into tidy data format.

    Args:
        folder_path (String): path to all the raw data files for a pilot.
        experiment_specs (Dictionary<String : Integer>): experiment parameters
            used for pilot

    Returns:
        data (Pandas.DataFrame): combined data from all participants.
        survey_responses (Pandas.DataFrame): combined survey responses from all
            participants.

    """
    data = pd.DataFrame(
        columns=[
            "subject",
            "block",
            "trial",
            "avg_stim",
            "incentive",
            "stimulus",
            "estimate",
            "confidence",
            "estimate_rt",
            "confidence_rt",
            "age",
            "gender",
        ]
    )

    survey_responses = pd.DataFrame(
        columns=["subject", "bonus", "missed", "enjoyment", "comments"]
    )

    participant = 1
    for file in os.listdir(folder_path):
        if file.endswith(".csv") and ("output" in file):

            participant_df = pd.DataFrame()
            participant_df = pd.read_csv(folder_path + file)

            # Collect survey information
            survey_info = participant_df.loc[(participant_df["trial_type"] == "survey")]
            subject = survey_info["subjectId"].values[0]
            enjoyment = survey_info["enjoyment"].values[0]
            comments = survey_info["comments"].values[0]
            age = survey_info["age"].values[0]
            gender = survey_info["gender_cat"].values[0]

            # Calculate the bonus earned
            bonus = 0
            bonusing_trial_info = participant_df.loc[
                (participant_df["exp_stage"] == "bonus")
            ]
            random_bonus_block = bonusing_trial_info["random_block"].values[0]
            # Note: there was a spelling error in the experiment code leading
            # the 'random_trial' column to be labeled as 'randoom_trial'.
            random_bonus_trial = bonusing_trial_info["randoom_trial"].values[0]

            num_missed = 0

            # Collect the trial level information
            for block in range(experiment_specs["num_blocks"]):
                for trial in range(experiment_specs["num_trials_per_block"]):

                    trial_level_info = participant_df.loc[
                        (participant_df["testing"] == True)
                        & (participant_df["block"] == block)
                        & (participant_df["trial"] == trial)
                    ]

                    incentive = trial_level_info.loc[
                        trial_level_info["exp_stage"] == "fixation"
                    ]["incentive"].values[0]
                    avg_stim = trial_level_info.loc[
                        trial_level_info["exp_stage"] == "stimulus"
                    ]["stim_avg_mag"].values[0]
                    stimulus = trial_level_info.loc[
                        trial_level_info["exp_stage"] == "stimulus"
                    ]["true_stim_mag"].values[0]
                    estimate = trial_level_info.loc[
                        trial_level_info["exp_stage"] == "estimate"
                    ]["estimate_stim_mag"].values[0]
                    estimate_rt = trial_level_info.loc[
                        trial_level_info["exp_stage"] == "estimate"
                    ]["rt"].values[0]
                    confidence = trial_level_info.loc[
                        trial_level_info["exp_stage"] == "confidence"
                    ]["confidence"].values[0]
                    confidence_rt = trial_level_info.loc[
                        trial_level_info["exp_stage"] == "confidence"
                    ]["rt"].values[0]

                    # If it is not a missed trial, add it to the data
                    if np.isnan(estimate):
                        num_missed += 1
                    else:
                        data.loc[len(data.index)] = [
                            participant,
                            block + 1,
                            trial + 1,
                            avg_stim,
                            incentive,
                            stimulus,
                            estimate,
                            confidence,
                            estimate_rt,
                            confidence_rt,
                            age,
                            gender,
                        ]

                    if (
                        (trial == random_bonus_trial)
                        and (block == random_bonus_block)
                        and (
                            abs(stimulus - estimate)
                            <= experiment_specs["reward_threshold"]
                        )
                    ):
                        bonus = incentive

            participant += 1

            survey_responses.loc[len(survey_responses.index)] = [
                subject,
                bonus,
                num_missed,
                enjoyment,
                comments,
            ]

    return data, survey_responses


def save_pilot_data(pilots=list(range(1, 7))):
    """Save all subjects' data to pilot-specific data file.

    Returns:
        None.

    """
    for pilot in pilots:
        print(f"On pilot {pilot}")
        folder_path = f"../data/pilot_{pilot}/raw/"

        if pilot == 1:
            experiment_specs = EXPERIMENT_SPECS_V_1
        elif pilot == 2:
            experiment_specs = EXPERIMENT_SPECS_V_2
        else:
            experiment_specs = EXPERIMENT_SPECS_V_3

        data, survey_responses = combine_subjects(folder_path, experiment_specs)
        print(f"Saving pilot {pilot}")
        data.to_csv(f"../data/pilot_{pilot}/pilot_{pilot}_data.csv", index=False)
        survey_responses.to_csv(
            f"../data/pilot_{pilot}/pilot_{pilot}_survey_responses.csv", index=False,
        )


def combine_pilots(pilots):
    """Combine, with id correction, specified pilots' data into one dataframe.

    Args:
        pilots (Array<Integer>): which pilots to combine data.

    Returns:
        (Pandas.DataFrame): all the data from the specified pilots with
            the following columns: [
                "subject",
                "block",
                "trial",
                "avg_stim",
                "incentive",
                "stimulus",
                "estimate",
                "confidence",
                "estimate_rt",
                "confidence_rt",
                "age",
                "gender",
            ]

    """
    all_pilots_data = []
    subject_id_correction = 0
    for pilot in pilots:
        pilot_data = pd.read_csv(f"../data/pilot_{pilot}/pilot_{pilot}_data.csv")

        next_subject_id_correction = pilot_data["subject"].max()
        pilot_data["subject"] += subject_id_correction
        all_pilots_data.append(pilot_data)
        subject_id_correction += next_subject_id_correction

    return pd.concat(all_pilots_data, ignore_index=True)


def list_bonuses(pilots):
    """List out all the subjects under their awarded bonus amount.

    This is used to bonus participants after data collection.

    Args:
        pilots (Array<Integer>): which pilots to print bonuses for.

    Returns:
        None.

    """
    for pilot in pilots:
        print(f"\nFor pilot {pilot}")
        survey_responses = pd.read_csv(
            f"../data/pilot_{pilot}/pilot_{pilot}_survey_responses.csv"
        )

        for bonus in np.unique(survey_responses["bonus"]):
            if bonus > 0:
                print(f"\nSubjects below get a ${bonus} bonus:")
                print(
                    survey_responses.loc[
                        survey_responses["bonus"] == bonus, "subject"
                    ].to_string(index=False)
                )


if __name__ == "__main__":
    pass

    # The following lines are what generated the full estimation_data.csv
    # file. We used pilots 3-6 for two simple reasons. First, the incentive
    # structure (high incentive amount and payoff threshold) were consistent
    # across pilots. Second, the 7th pilot was excluded to avoid timing issues;
    # it was accidentally launched well into the night (passed 11pm) whereas
    # pilots 3-6 were launched in the morning/ early afternoon.

    # pilots = [3, 4, 5, 6]
    # save_pilot_data(pilots)
    # experiment_data = combine_pilots(pilots)
    # experiment_data.to_csv("../data/estimation_data.csv", index=False)
