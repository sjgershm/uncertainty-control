function lme = run_lme(data)
    
    % Fit mixed effects model to estimation data
    
    formula = 'estimate ~ avg_stim + avg_stim:incentive + stimulus + (avg_stim + avg_stim:incentive + stimulus|subject)';
    lme = fitlme(data,formula,'dummyvarcoding','effects');
    stats = anova(lme)