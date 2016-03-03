module Scattertasks {
	enum NumDims {
		TwoPicked,
		TwoDerived,
		MultiDim
	}
	
	enum NumClasses {
		OneClass,
		TwoToFourClasses,
		FivePlusClasses
	}
	
	enum DataDistrib {
		Random,
		Clusters,
		Manifolds,
		Linear,
		Overlap
	}
	
	enum Spatial {
		TwoNonSpatial,
		TwoSpatial,
		OneEach
	}
	
	interface DataParameters {
		numPoints: number;
		dims: NumDims;
		numClasses: NumClasses;
		dataDist: DataDistrib;
		spatialNature: Spatial;
	}
	
	interface DataPoint {
		x: number;
		y: number;
		category?: number;
	}
	
	interface Margin {
		left: number;
		right: number;
		top: number;
		bottom: number;
	}
	
	export class ExampleVis {
		defaultAttribs: DataParameters;
		chart: d3.Selection<any>;
		
		xExtent = 10;
		yExtent = 10;
		
		margins: Margin;
		width: number;
		height: number;
		
		curAttribs: DataParameters;
		data: DataPoint[] = [];
		
		constructor (svgSelection: d3.Selection<SVGElement>, defaultAttribs: DataAttribute[]) {
			this.margins = {top: 20, right: 30, bottom: 30, left: 80};
			this.width = +svgSelection.attr('width') - this.margins.left - this.margins.right;
			this.height = +svgSelection.attr('height') - this.margins.top - this.margins.bottom;
			  
			this.chart = svgSelection.append('g')
				.attr("transform", "translate(" + this.margins.left + ", " + this.margins.top + ")");			
			
			this.updateDataAttribs(defaultAttribs.map(d => +d.attrib_value_id), true);	
		}
		
		// given a complete set of data attributes, generate a sample scatterplot
		private generateData() {
			this.data = [];
			var numClasses: number;
			
			switch(this.curAttribs.numClasses) {
				case NumClasses.OneClass:
					numClasses = 1;
					break;
				case NumClasses.TwoToFourClasses:
					numClasses = Math.floor(Math.random() * 3) + 2;
					break;
				case NumClasses.FivePlusClasses:
					numClasses = Math.floor(Math.random() * 5) + 5;
					break;
			}
			
			switch (this.curAttribs.dataDist) {
				case DataDistrib.Random:
					for (var i = 0; i < this.curAttribs.numPoints; i++) {
						var pt: DataPoint = {
							x: Math.random() * this.xExtent,
							y: Math.random() * this.yExtent,
							category: Math.ceil(Math.random() * numClasses)
						}
						this.data.push(pt);
					}
					break;
				case DataDistrib.Linear:
					//var r = 0.7 + (Math.random() * 0.3);  // try to limit this from r = 0.7 to 1
					var r = Math.random();
					console.log("r value is %.3f", r);
					var λ = (r - Math.sqrt(r * r - Math.pow(r, 4))) / (2 * r * r - 1);
					for (var i = 0; i < this.curAttribs.numPoints; i++) {
						// see Rensink2010 (equation 1) for generating points
						// use Box-Muller transform to generate uniform points (std dev 20% of extent)
						var u1 = Math.random(); var u2 = Math.random();
						var x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 
							(0.2 * this.xExtent) + (0.5 * this.xExtent);
						var y0 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) * 
							(0.2 * this.xExtent) + (0.5 * this.xExtent);
						var y1 = (λ * x + (1 - λ) * y0) / Math.sqrt(λ * λ + Math.pow(1 - λ, 2));
						this.data.push({
							x: x, 
							y: y1, 
							category: Math.ceil(Math.random() * numClasses)
						});
					}
					break;
				default:
					throw "Data distribution not implemented";
			}
		}
		
		updateVis(dataAttribs?: number[]) {
			if (dataAttribs) this.updateDataAttribs(dataAttribs);
			this.generateData();
			
			var xd = [0, this.xExtent];
			var yd = [0, this.yExtent];
			
			var x1 = d3.scale.linear()
				.domain(xd)
				.range([0, this.width]);
		    
			var y1 = d3.scale.linear()
				.domain(yd)
				.range([this.height, 0]);
				
			var categories = d3.set(this.data.map(d => d.category.toString())).values()
			var colors = d3.scale.category10().domain(categories)
				
			this.chart.selectAll('g.xaxis')
				.data([xd]).enter()
				.append('g')
					.attr('class', 'xaxis axis')
					.attr('transform', 'translate(0,' + this.height + ")")
					.call(d3.svg.axis().orient("bottom").scale(x1));
					
			this.chart.selectAll('g.yaxis')
				.data([yd]).enter()
				.append('g')
					.attr('class', 'yaxis axis')
					.call(d3.svg.axis().orient("left").scale(y1));
					
			this.chart.selectAll("circle.point").remove();
			this.chart.selectAll("circle.point")
				.data(this.data).enter()
			  .append('circle')
				.attr('class', 'point')
				.attr('r', 3)
				.attr('cx', d => x1(d.x))
				.attr('cy', d => y1(d.y))
				.style('fill', d => colors(d.category.toString()));
		}
		
		// construct a mapping from data attribute value to scatterplot value
		updateDataAttribs(dataAttrib: number[], doDefault?: boolean) {
			var baseAttribs: any = {};
			dataAttrib.forEach(da => {
				switch (da) {
					case 1:
						baseAttribs.numClasses = NumClasses.OneClass;
						break;
					case 2:
						baseAttribs.numClasses = NumClasses.TwoToFourClasses;
						break;
					case 3:
						baseAttribs.numClasses = NumClasses.FivePlusClasses;
						break;
					case 4:
						baseAttribs.numPoints = Math.ceil(Math.random() * 10);
						break;
					case 5:
						baseAttribs.numPoints = Math.ceil(Math.random() * 90) + 10;
						break;
					case 6:
						baseAttribs.numPoints = Math.ceil(Math.random() * 900) + 100;
						break;
					case 7:
						baseAttribs.numPoints = Math.ceil(Math.random() * 5000) + 1000;
						break;
					case 8:
						baseAttribs.dims = NumDims.TwoPicked;
						break;
					case 9:
						baseAttribs.dims = NumDims.TwoDerived;
						break;
					case 10:
						baseAttribs.dims = NumDims.MultiDim;
						break;
					case 11:
						baseAttribs.spatialNature = Spatial.TwoNonSpatial;
						break;
					case 12:
						baseAttribs.spatialNature = Spatial.TwoSpatial;
						break;
					case 13:
						baseAttribs.spatialNature = Spatial.OneEach;
						break;
					case 14:
						baseAttribs.dataDist = DataDistrib.Random;
						break;
					case 15:
						baseAttribs.dataDist = DataDistrib.Clusters;
						break;
					case 16:
						baseAttribs.dataDist = DataDistrib.Manifolds;
						break;
					case 17:
						baseAttribs.dataDist = DataDistrib.Linear;
						break;
					case 18:
						baseAttribs.dataDist = DataDistrib.Overlap;
						break;
					default:
						throw "Mapping for given attribute_id/attrib_value_id not implemented";
						break;
				}
			});
			
			if (doDefault) this.defaultAttribs = baseAttribs;
			
			// handy jQuery method -- merge found attributes with the defaults and save as current
			this.curAttribs = $.extend({}, this.defaultAttribs, baseAttribs);
		}
	}
}