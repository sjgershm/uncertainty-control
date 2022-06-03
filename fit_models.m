function [results,bms_results] = fit_models(D,M,results)
    
    % Fit models to data using maximum likelihood estimation.
    % Requires the mfit package.
    %
    % USAGE: [results,bms_results] = fit_models(D,M,results)
    %
    % INPUTS:
    %   D - data in struct format (see data2struct.m)
    %   M (optional) - vector of models to fit
    %   results (optional) - existing results structure to modify
    %
    % OUTPUTS:
    %   results - structure containing fitted model (see mfit_optimize.m)
    %   bms_results - random-effects model comparison structure (see mfit_bms.m)
    
    models = {'RI' 'FP' 'NB'};
    if nargin < 2; M = 1:length(models); end
    
    for m = M
        
        switch models{m}
            
            case 'RI'
                
                likfun = @likfun_RI;
                param(1) = struct('name','tau','lb',0.0001,'ub',2);
                param(2) = struct('name','alpha_low','lb',12/(30^2)*0.5,'ub',50);
                param(3) = struct('name','alpha_high','lb',12/(30^2)*0.5,'ub',50);
                
            case 'FP'
                
                likfun = @likfun_FP;
                param(1) = struct('name','tau','lb',0.0001,'ub',2);
                param(2) = struct('name','lambda','lb',12/(30^2)*0.5,'ub',1);
                
            case 'NB'
                
                likfun = @likfun_NB;
                param(1) = struct('name','tau','lb',0.0001,'ub',2);
                param(2) = struct('name','lambda','lb',12/(30^2)*0.5,'ub',1);
                param(3) = struct('name','a_low','lb',0,'ub',10);
                param(4) = struct('name','a_high','lb',0,'ub',10);
                
        end
        
        results(m) = mfit_optimize(likfun,param,D);
        
    end
    
    if nargout > 1
        bms_results = mfit_bms(results,1);
    end