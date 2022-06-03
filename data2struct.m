function D = data2struct(data)
    
    % Convert tabular data to structure.
    
    S = unique(data.subject);
    for s = 1:length(S)
        ix = data.subject==S(s) & ~isnan(data.log_estimate);
        d = table2struct(data(ix,:),'ToScalar',true);
        d.N = length(d.stimulus);
        D(s) = d;
    end