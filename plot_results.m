function plot_results(data,fig)
    
    % Generate figures
    
    S = unique(data.subject);
    I = unique(data.incentive);
    
    set(0, 'DefaultAxesFontName', 'Palatino');
    set(0, 'DefaultTextFontName', 'Palatino');
    
    switch fig
        
        case 'fig2'
            
            figure;
            subplot(1,3,1);
            plot_results(data,'squared_error')
            mytitle('A','Left','FontSize',25,'FontWeight','Bold');
            subplot(1,3,2);
            plot_results(data,'variance')
            mytitle('B','Left','FontSize',25,'FontWeight','Bold');
            subplot(1,3,3);
            plot_results(data,'confidence')
            mytitle('C','Left','FontSize',25,'FontWeight','Bold');
            set(gcf,'Position',[200 200 1000 500]);
            
        case 'variance'
            
            for s = 1:length(S)
                for i = 1:length(I)
                    ix = data.subject==S(s) & data.incentive==I(i);
                    errvar(s,i) = nanvar(data.estimate(ix) - data.stimulus(ix));
                end
            end
            
            [se,m] = wse(errvar);
            errorbar(m',se','ok','LineWidth',4,'MarkerSize',12,'MarkerFaceColor','k');
            set(gca,'XLim',[0.5 2.5],'XTick',1:2,'XTickLabels',{'Low' 'High'},'FontSize',25);
            xlabel('Incentive','FontSize',25);
            ylabel('Error variance','FontSize',25);
            [~,p,~,stat] = ttest(errvar(:,1),errvar(:,2));
            disp(['variance, low vs. high incentive: t(',num2str(stat.df),') = ',num2str(stat.tstat),', p = ',num2str(p)]);
            
        case 'error'
            
            q = linspace(min(data.avg_stim),max(data.avg_stim),8);
            for s = 1:length(S)
                for i = 1:length(I)
                    ix = data.subject==S(s) & data.incentive==I(i);
                    z(s,:,i) = interval_stats(data.estimate(ix)-data.stimulus(ix),data.avg_stim(ix),q);
                end
            end
            
            [se,m] = wse(z);
            q = q(1:end-1) + 0.5*diff(q);
            errorbar(q',m(:,1),se(:,1),'LineWidth',4,'Color',[0 0 0]);
            hold on;
            errorbar(q',m(:,2),se(:,2),'LineWidth',4,'Color',[0.5 0.5 0.5]);
            xlabel('Average stimulus','FontSize',25);
            ylabel('Error','FontSize',25);
            set(gca,'FontSize',25);
            h = legend({'Low' 'High'},'FontSize',25);
            title(h,'Incentive');
            
        case 'squared_error'
            
            for s = 1:length(S)
                for i = 1:length(I)
                    ix = data.subject==S(s) & data.incentive==I(i);
                    err(s,i) = nanmean((data.estimate(ix) - data.stimulus(ix)).^2);
                end
            end
            
            [se,m] = wse(err);
            errorbar(m',se','ok','LineWidth',4,'MarkerSize',12,'MarkerFaceColor','k');
            set(gca,'XLim',[0.5 2.5],'XTick',1:2,'XTickLabels',{'Low' 'High'},'FontSize',25);
            xlabel('Incentive','FontSize',25);
            ylabel('Squared error','FontSize',25);
            [~,p,~,stat] = ttest(err(:,1),err(:,2));
            disp(['squared error, low vs. high incentive: t(',num2str(stat.df),') = ',num2str(stat.tstat),', p = ',num2str(p)]);
            
        case 'confidence'
            
            for s = 1:length(S)
                for i = 1:length(I)
                    ix = data.subject==S(s) & data.incentive==I(i);
                    conf(s,i) = nanmean(data.confidence(ix));
                end
            end
            
            [se,m] = wse(conf);
            errorbar(m',se','ok','LineWidth',4,'MarkerSize',12,'MarkerFaceColor','k');
            set(gca,'XLim',[0.5 2.5],'XTick',1:2,'XTickLabels',{'Low' 'High'},'FontSize',25);
            xlabel('Incentive','FontSize',25);
            ylabel('Confidence','FontSize',25);
            [~,p,~,stat] = ttest(conf(:,1),conf(:,2));
            disp(['confidence, low vs. high incentive: t(',num2str(stat.df),') = ',num2str(stat.tstat),', p = ',num2str(p)]);
            
        case 'response_time'
            
            for s = 1:length(S)
                for i = 1:length(I)
                    ix = data.subject==S(s) & data.incentive==I(i);
                    rt(s,i) = nanmean(data.estimate_rt(ix));
                end
            end
            
            [se,m] = wse(rt);
            errorbar(m',se','ok','LineWidth',4,'MarkerSize',12,'MarkerFaceColor','k');
            set(gca,'XLim',[0.5 2.5],'XTick',1:2,'XTickLabels',{'Low' 'High'},'FontSize',25);
            xlabel('Incentive','FontSize',25);
            ylabel('Response time (ms)','FontSize',25);
            [~,p,~,stat] = ttest(rt(:,1),rt(:,2));
            disp(['response time, low vs. high incentive: t(',num2str(stat.df),') = ',num2str(stat.tstat),', p = ',num2str(p)]);
            
        case 'model_confidence'
            
            load model_fits
            D = data2struct(data);
            
            for s = 1:length(S)
                ix = double(D(s).incentive)==2;
                D(s).confidence = zscore(D(s).confidence);
                conf_diff(s,1) = nanmean(D(s).confidence(ix)) - nanmean(D(s).confidence(~ix));
                model_diff(s,1) = nanmean(results(1).latents(s).confidence(ix)) - nanmean(results(1).latents(s).confidence(~ix));
                alpha_diff(s,1) = results(1).x(s,3) - results(1).x(s,2);
            end
            
            scatter(alpha_diff,conf_diff); lsline
            [r,p] = corr(model_diff,conf_diff)
            
        case 'fig3'
            
            load model_fits
            
            for i = 1:length(results)
                lme(:,i) = -0.5*results(i).bic;
            end
            
            figure;
            subplot(1,2,1);
            Violin(lme(:,1:2)-lme(:,3));
            set(gca,'FontSize',25,'XTick',1:2,'XTickLabel',{'RI' 'FP'});
            ylabel('Log Bayes factor','FontSize',25);
            xlabel('Model','FontSize',25);
            mytitle('A','Left','FontSize',25,'FontWeight','Bold');
            
            subplot(1,2,2);
            x = results(1).x(:,2:3);
            [se,m] = wse(x);
            errorbar(m',se','ok','LineWidth',4,'MarkerSize',12,'MarkerFaceColor','k');
            set(gca,'XLim',[0.5 2.5],'XTick',1:2,'XTickLabels',{'Low' 'High'},'FontSize',25);
            xlabel('Incentive','FontSize',25);
            ylabel('\alpha','FontSize',25);
            mytitle('B','Left','FontSize',25,'FontWeight','Bold');
            [~,p,~,stat] = ttest(x(:,1),x(:,2));
            disp(['alpha, low vs. high incentive: t(',num2str(stat.df),') = ',num2str(stat.tstat),', p = ',num2str(p)]);
            set(gcf,'Position',[200 200 800 500]);
            
    end
    
end

function h = mytitle(txt,just,varargin)
    
    % Plot titles with left or right justification.
    %
    % USAGE: h = mytitle(txt,[just],[varargin])
    %
    % INPUTS:
    %   txt - title string
    %   just (optional) - justification: 'Left' (default) or 'Right'
    %   varargin (optional) - additional arguments for title
    %
    % OUTPUTS:
    %   h - handle to title object
    %
    % Sam Gershman, Dec 2011
    
    if nargin < 2 || isempty(just)
        just = 'Left';
    end
    
    switch just
        case 'Left'
            h = title(txt,'HorizontalAlignment','left','Units','normalized','Position',[0 1],varargin{:});
        case 'Right'
            h = title(txt,'HorizontalAlignment','right','Units','normalized','Position',[1 1],varargin{:});
    end
    
end

function[h,L,MX,MED,bw] = Violin(Y,varargin)
    
    % This function creates violin plots based on kernel density estimation
    % using ksdensity with default settings. Please be careful when comparing pdfs
    % estimated with different bandwidth!
    %
    % Differently to other boxplot functions, you may specify the x-position.
    % This is usefule when overlaying with other data / plots.
    %__________________________________________________________________________
    %
    % Please cite this function as:
    % Hoffmann H, 2015: violin.m - Simple violin plot using matlab default kernel
    % density estimation. INRES (University of Bonn), Katzenburgweg 5, 53115 Germany.
    % hhoffmann@uni-bonn.de
    %
    %__________________________________________________________________________
    %
    % INPUT
    %
    % Y:     Data to be plotted, being either
    %        a) n x m matrix. A 'violin' is plotted for each column m, OR
    %        b) 1 x m Cellarry with elements being numerical colums of nx1 length.
    %
    % varargin:
    % xlabel:    xlabel. Set either [] or in the form {'txt1','txt2','txt3',...}
    % facecolor: FaceColor. (default [1 0.5 0]); Specify abbrev. or m x 3 matrix (e.g. [1 0 0])
    % edgecolor: LineColor. (default 'k'); Specify abbrev. (e.g. 'k' for black); set either [],'' or 'none' if the mean should not be plotted
    % facealpha: Alpha value (transparency). default: 0.5
    % mc:        Color of the bars indicating the mean. (default 'k'); set either [],'' or 'none' if the mean should not be plotted
    % medc:      Color of the bars indicating the median. (default 'r'); set either [],'' or 'none' if the mean should not be plotted
    % bw:        Kernel bandwidth. (default []); prescribe if wanted as follows:
    %            a) if bw is a single number, bw will be applied to all
    %            columns or cells
    %            b) if bw is an array of 1xm or mx1, bw(i) will be applied to cell or column (i).
    %            c) if bw is empty (default []), the optimal bandwidth for
    %            gaussian kernel is used (see Matlab documentation for
    %            ksdensity()
    %
    % OUTPUT
    %
    % h:     figure handle
    % L:     Legend handle
    % MX:    Means of groups
    % MED:   Medians of groups
    % bw:    bandwidth of kernel
    
    %defaults:
    %_____________________
    xL=[];
    fc=[1 0.5 0];
    lc='k';
    alp=0.5;
    mc='k';
    medc='r';
    b=[]; %bandwidth
    plotlegend=1;
    plotmean=1;
    plotmedian=1;
    x = [];
    %_____________________
    %convert single columns to cells:
    if iscell(Y)==0
        Y = num2cell(Y,1);
    end
    %get additional input parameters (varargin)
    if isempty(find(strcmp(varargin,'xlabel')))==0
        xL = varargin{find(strcmp(varargin,'xlabel'))+1};
    end
    if isempty(find(strcmp(varargin,'facecolor')))==0
        fc = varargin{find(strcmp(varargin,'facecolor'))+1};
    end
    if isempty(find(strcmp(varargin,'edgecolor')))==0
        lc = varargin{find(strcmp(varargin,'edgecolor'))+1};
    end
    if isempty(find(strcmp(varargin,'facealpha')))==0
        alp = varargin{find(strcmp(varargin,'facealpha'))+1};
    end
    if isempty(find(strcmp(varargin,'mc')))==0
        if isempty(varargin{find(strcmp(varargin,'mc'))+1})==0
            mc = varargin{find(strcmp(varargin,'mc'))+1};
            plotmean = 1;
        else
            plotmean = 0;
        end
    end
    if isempty(find(strcmp(varargin,'medc')))==0
        if isempty(varargin{find(strcmp(varargin,'medc'))+1})==0
            medc = varargin{find(strcmp(varargin,'medc'))+1};
            plotmedian = 1;
        else
            plotmedian = 0;
        end
    end
    if isempty(find(strcmp(varargin,'bw')))==0
        b = varargin{find(strcmp(varargin,'bw'))+1}
        if length(b)==1
            disp(['same bandwidth bw = ',num2str(b),' used for all cols'])
            b=repmat(b,size(Y,2),1);
        elseif length(b)~=size(Y,2)
            warning('length(b)~=size(Y,2)')
            error('please provide only one bandwidth or an array of b with same length as columns in the data set')
        end
    end
    if isempty(find(strcmp(varargin,'plotlegend')))==0
        plotlegend = varargin{find(strcmp(varargin,'plotlegend'))+1};
    end
    if isempty(find(strcmp(varargin,'x')))==0
        x = varargin{find(strcmp(varargin,'x'))+1};
    end
    %%
    if size(fc,1)==1
        fc=repmat(fc,size(Y,2),1);
    end
    %% Calculate the kernel density
    i=1;
    for i=1:size(Y,2)
        
        if isempty(b)==0
            [f, u, bb]=ksdensity(Y{i},'bandwidth',b(i));
        elseif isempty(b)
            [f, u, bb]=ksdensity(Y{i});
        end
        
        f=f/max(f)*0.3; %normalize
        F(:,i)=f;
        U(:,i)=u;
        MED(:,i)=nanmedian(Y{i});
        MX(:,i)=nanmean(Y{i});
        bw(:,i)=bb;
        
    end
    %%
    %-------------------------------------------------------------------------
    % Put the figure automatically on a second monitor
    % mp = get(0, 'MonitorPositions');
    % set(gcf,'Color','w','Position',[mp(end,1)+50 mp(end,2)+50 800 600])
    %-------------------------------------------------------------------------
    %Check x-value options
    if isempty(x)
        x = zeros(size(Y,2));
        setX = 0;
    else
        setX = 1;
        if isempty(xL)==0
            disp('_________________________________________________________________')
            warning('Function is not designed for x-axis specification with string label')
            warning('when providing x, xlabel can be set later anyway')
            error('please provide either x or xlabel. not both.')
        end
    end
    %% Plot the violins
    i=1;
    for i=i:size(Y,2)
        if isempty(lc) == 1
            if setX == 0
                h(i)=fill([F(:,i)+i;flipud(i-F(:,i))],[U(:,i);flipud(U(:,i))],fc(i,:),'FaceAlpha',alp,'EdgeColor','none');
            else
                h(i)=fill([F(:,i)+x(i);flipud(x(i)-F(:,i))],[U(:,i);flipud(U(:,i))],fc(i,:),'FaceAlpha',alp,'EdgeColor','none');
            end
        else
            if setX == 0
                h(i)=fill([F(:,i)+i;flipud(i-F(:,i))],[U(:,i);flipud(U(:,i))],fc(i,:),'FaceAlpha',alp,'EdgeColor',lc);
            else
                h(i)=fill([F(:,i)+x(i);flipud(x(i)-F(:,i))],[U(:,i);flipud(U(:,i))],fc(i,:),'FaceAlpha',alp,'EdgeColor',lc);
            end
        end
        hold on
        if setX == 0
            if plotmean == 1
                p(1)=plot([interp1(U(:,i),F(:,i)+i,MX(:,i)), interp1(flipud(U(:,i)),flipud(i-F(:,i)),MX(:,i)) ],[MX(:,i) MX(:,i)],mc,'LineWidth',2);
            end
            if plotmedian == 1
                p(2)=plot([interp1(U(:,i),F(:,i)+i,MED(:,i)), interp1(flipud(U(:,i)),flipud(i-F(:,i)),MED(:,i)) ],[MED(:,i) MED(:,i)],medc,'LineWidth',2);
            end
        elseif setX == 1
            if plotmean == 1
                p(1)=plot([interp1(U(:,i),F(:,i)+i,MX(:,i))+x(i)-i, interp1(flipud(U(:,i)),flipud(i-F(:,i)),MX(:,i))+x(i)-i],[MX(:,i) MX(:,i)],mc,'LineWidth',2);
            end
            if plotmedian == 1
                p(2)=plot([interp1(U(:,i),F(:,i)+i,MED(:,i))+x(i)-i, interp1(flipud(U(:,i)),flipud(i-F(:,i)),MED(:,i))+x(i)-i],[MED(:,i) MED(:,i)],medc,'LineWidth',2);
            end
        end
    end
    %% Add legend if requested
    if plotlegend==1 & plotmean==1 | plotlegend==1 & plotmedian==1
        
        if plotmean==1 & plotmedian==1
            L=legend([p(1) p(2)],'Mean','Median');
        elseif plotmean==0 & plotmedian==1
            L=legend([p(2)],'Median');
        elseif plotmean==1 & plotmedian==0
            L=legend([p(1)],'Mean');
        end
        
        set(L,'box','off','FontSize',14)
    else
        L=[];
    end
    %% Set axis
    if setX == 0
        axis([0.5 size(Y,2)+0.5, min(U(:)) max(U(:))]);
    elseif setX == 1
        axis([min(x)-0.05*range(x) max(x)+0.05*range(x), min(U(:)) max(U(:))]);
    end
    %% Set x-labels
    xL2={''};
    i=1;
    for i=1:size(xL,2)
        xL2=[xL2,xL{i},{''}];
    end
    set(gca,'TickLength',[0 0],'FontSize',12)
    box on
    if isempty(xL)==0
        set(gca,'XtickLabel',xL2)
    end
    %-------------------------------------------------------------------------
end %of function