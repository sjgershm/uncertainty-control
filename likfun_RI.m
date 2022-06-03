function [lik,latents] = likfun_RI(x,data)
    
    % Likelihood function for the Rational Inattention (RI) model.
    
    tau = x(1);
    alpha_low = x(2);
    alpha_high = x(3);
    
    lambda0 = 12/(30^2);
    
    alpha = zeros(size(data.incentive)) + alpha_high;
    alpha(double(data.incentive)==1) = alpha_low;
    lambda = max(2.*alpha - lambda0,0.0001);
    w = lambda./(lambda+lambda0);
    log_estimate = w.*data.log_stimulus + (1-w).*data.log_avg_stim;
    log_var = ((w.^2)./lambda) + tau;
    lik = sum(lognormpdf(data.log_estimate,log_estimate,sqrt(log_var)));
    
    if nargout > 1
        latents.log_estimate = log_estimate;
        latents.confidence = 1./(lambda+lambda0);
    end
    