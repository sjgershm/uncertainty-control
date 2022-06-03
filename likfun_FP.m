function [lik,latents] = likfun_FP(x,data)
    
    % Likelihood function for the Fixed Precision (FP) model.
    
    tau = x(1);
    lambda = x(2);
    
    lambda0 = 12/(30^2);
    
    w = lambda./(lambda+lambda0);
    log_estimate = w.*data.log_stimulus + (1-w).*data.log_avg_stim;
    log_var = ((w.^2)./lambda) + tau;
    lik = sum(lognormpdf(data.log_estimate,log_estimate,sqrt(log_var)));
    
    if nargout > 1
        latents.log_estimate = log_estimate;
    end
    