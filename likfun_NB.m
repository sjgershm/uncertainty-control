function [lik,latents] = likfun_NB(x,data)
    
    % Likelihood function for the Non-Bayesian (NB) model.
    
    tau = x(1);
    lambda = x(2);
    a_low = x(3);
    a_high = x(4);
    
    a = zeros(size(data.incentive)) + a_high;
    a(double(data.incentive)==1) = a_low;
    
    log_estimate = a.*data.log_stimulus;
    log_var = ((a.^2)./lambda) + tau;
    lik = sum(lognormpdf(data.log_estimate,log_estimate,sqrt(log_var)));
    
    if nargout > 1
        latents.log_estimate = log_estimate;
    end