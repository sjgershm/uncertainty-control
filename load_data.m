function data = load_data
    
    % Load data in tabular format.
    
    data = readtable('estimation_data.csv');
    data.incentive = categorical(data.incentive);
    S = unique(data.subject);
    
    % clean up data
    ix = data.estimate < min(data.stimulus) | data.estimate > max(data.stimulus);   % invalid range
    ix = ix | abs(data.estimate - data.stimulus)>40;    % very inaccurate responses
    data.estimate(ix) = nan;
    
    % compute log-transforms
    data.log_estimate = log(data.estimate);
    data.log_stimulus = log(data.stimulus);
    data.log_avg_stim = data.avg_stim;
    for s = 1:length(S)
        ix = data.subject==S(s);
        B = unique(data.block(ix));
        for b = 1:length(B)
            ix2 = ix & data.block==B(b);
            data.log_avg_stim(ix2) = nanmean(data.log_stimulus(ix2));
        end
    end
    
    % central tendency
    data.ct = (data.estimate - data.stimulus) .* (data.avg_stim - data.stimulus);
    %data.log_ct = (data.log_estimate - data.log_stimulus) .* (data.log_avg_stim - data.log_stimulus);
    
    % remove subjects who: (1) make too many invalid responses; (2) are too old
    badsub = 0;
    for s = 1:length(S)
        ix = data.subject==S(s);
        if sum(isnan(data.estimate(ix)))>30 || mean(data.age(ix))>70
            data(ix,:) = [];
            badsub = badsub + 1;
        end
    end
    disp(['removed ',num2str(badsub),' subjects'])