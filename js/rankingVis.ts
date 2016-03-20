module Scattertasks {
    interface RankingData {
        task_id: string;
        task_name: string;
        attrib_value_name: string;
        ranking_name: string;
        value: string;
    }
    
    interface Ranking {
        category: string,
        task_id: number;
        task: string;
        ranking: string;
        rank: number;
        value: number;
    }
    
    export class RankingVis {
        
        chart: d3.Selection<any>;
        rankings: Ranking[][];
        
        margins: Margin;
        height: number;
        width: number;
        
        constructor (svgSelection: d3.Selection<SVGElement>) {
            this.margins = {top: 20, right: 30, bottom: 30, left: 80};
			this.width = +svgSelection.attr('width') - this.margins.left - this.margins.right;
			this.height = +svgSelection.attr('height') - this.margins.top - this.margins.bottom;
			  
			this.chart = svgSelection.append('g')
				.attr("transform", "translate(" + this.margins.left + ", " + this.margins.top + ")");
        }
        
        private parseRankings(thisRanking:RankingVis): {(data: RankingData[]): void}
        {
            return function(data) {
                // clear any existing rankings
                thisRanking.rankings = [];
                
                // get unique values of attributes
                var categories = d3.set(data.map(d => d.attrib_value_name)).values();
                var cat_rankings = categories.map(c => {
                    return data.filter(d => d.attrib_value_name == c)
                        .map((d, i) => { 
                            return {
                                'category': c,
                                'task_id': +d.task_id,
                                'task': d.task_name,
                                'rank': i,
                                'ranking': d.ranking_name,
                                'value': +d.value
                            }
                        }
                    );
                });
                
                var task_ids = d3.set(data.map(d => d.task_id)).values().map(d => +d);
                thisRanking.rankings = task_ids.map(t => {
                     return cat_rankings.reduce((p, d) => {
                        return p.concat(d.filter(d => d.task_id == t));
                    }, []);
                });                
                
                // kick off an update of the ranking vis
                thisRanking.updateVis();
            };
        }
        
        getRankings(av1: number, a2: number) {
            $.getJSON('utils/getTaskRanking.php', {
                'av1': av1,
                'a2': a2
            }, this.parseRankings(this));
        }
        
        updateVis() {
            console.log("updating ranking vis");
            
            var xDomain = this.rankings[0].map(e => e.category);
            var yDomain = d3.range(12).map(d => "" + d); 
            
            var x = d3.scale.ordinal()
                .domain(xDomain)
                .rangeRoundBands([0, this.width]);
                
            var y = d3.scale.ordinal()
                .domain(yDomain)
                .rangeRoundBands([0, this.height], 0.2);
                
            var taskColors = d3.scale.category10()
                .domain(d3.range(12).map(d => ""+d));
            
            var line = d3.svg.line<Ranking>()
                .x(d => x(d.category))
                .y(d => y(""+d.rank));   
            
            this.chart.selectAll('g.xaxis')
                .data([xDomain]).enter()
                .append('g')
                    .attr('class', 'xaxis axis')
                    .attr('transform', 'translate(0,' + this.height + ')')
                    .call(d3.svg.axis().orient('bottom').scale(x));
                    
            var taskGroups = this.chart.selectAll('g.tasks')
                .data(this.rankings).enter()
                .append('g')
                    .attr('class', 'tasks');
                    
            taskGroups.append('path')
                .attr('class', 'line')
                .style('stroke', d => taskColors(""+d[0].task_id))
                .attr('d', line);
        }
    }
}