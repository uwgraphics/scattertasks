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
	
	export interface Margin {
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
		
		// uses the Box-Muller method to generate normal noise
		private generateNormalPoints(numPoints: number, mean: number | [number, number], 
			stdDev: number | [number, number], maxMultipleDev: number | [number, number], 
			classLabel: number, r?: number): DataPoint[] 
		{
			var points: DataPoint[] = [];
            
            // linear correlation noise (see Rensink2010)
            var λ = 0;
            if (r !== undefined)
                λ = (r - Math.sqrt(r * r - Math.pow(r, 4))) / (2 * r * r - 1);
			
			var xDev: number, yDev: number;
			if (stdDev instanceof Array) {
				xDev = stdDev[0];
				yDev = stdDev[1];
			} else if (typeof stdDev === 'number') {
				xDev = yDev = stdDev;
			}
			
			var xMean: number, yMean: number;
			if (mean instanceof Array) {
				xMean = mean[0];
				yMean = mean[1];
			} else if (typeof mean === 'number') {
				xMean = yMean = mean;
			}
			
			var xMD: number, yMD: number;
			if (maxMultipleDev instanceof Array) {
				xMD = maxMultipleDev[0];
				yMD = maxMultipleDev[1];
			} else if (typeof maxMultipleDev === 'number') {
				xMD = yMD = maxMultipleDev;
			}
			
			
			for (var i = 0; i < numPoints; i++) {
				var firstRun = true;
				var x: number, y: number;
				while (firstRun || 
					Math.abs(x - xMean) > xDev * xMD || 
					Math.abs(y - yMean) > yDev * yMD) 
				{
					firstRun = false;
					var u1 = Math.random();
					var u2 = Math.random();
					x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * xDev + xMean;
					y = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) * yDev + yMean;
					
					// use λ to create noise (see Rensink2010)
                    y = (λ * x + (1 - λ) * y) / Math.sqrt(λ * λ + Math.pow(1 - λ, 2));
				}
				
				points.push({
					x: x,
					y: y,
					category: classLabel
				});
			}
			
			return points;
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
					for (var i = 0; i < numClasses; i++) {
						var r = 0.7 + (Math.random() * 0.3);  // try to limit this from r = 0.7 to 1
						console.log("r value is %.3f", r);
					
						this.data = this.data.concat(
							this.generateNormalPoints(
								Math.ceil(this.curAttribs.numPoints / numClasses), 
								0.5 * this.xExtent, 0.2 * this.xExtent, 2.5, i, r
							)
						);
					};
					break;
				case DataDistrib.Clusters:
					for (var i = 0; i < numClasses; i++) {
						//var thisNumPoints = Math.ceil(this.curAttribs.numPoints / numClasses);
                        var thisNumPoints = this.curAttribs.numPoints;
						var numClusters = Math.ceil(Math.random() * 6);
						for (var c = 0; c < numClusters; c++) {
							var centroid: [number, number] = [Math.random() * 10, Math.random() * 10];
							var stdDev = Math.random() * 0.7 + 0.5;
							this.data = this.data.concat(
                                this.generateNormalPoints(
                                    Math.ceil(thisNumPoints / numClusters),
                                    centroid, stdDev, 
                                    Math.random() * 2 + 1, i)
                            );
						}
					}
					break;
                    
                case DataDistrib.Manifolds:
                    var chooseDist = () => {
                        var r = Math.ceil(Math.random() * 5);
                        var r1 = Math.random();
                        var r2 = Math.random();
                        var r3 = Math.random();
                        switch (r) {
                            case 1: 
                                return Math.floor;
                            case 2:
                                return (num) => Math.pow(num, 2);
                            case 3:
                                return (num) => (r1 * 2 + 1) * Math.cos(num + r3) + ((r2 * 6) + 3);
                            case 4:
                                return (num) => (r1 * 2 + 1) * Math.sin(num + r3) + ((r2 * 6) + 3);
                            case 5: 
                                return (num) => Math.log(num) + ((r2 * 7) + 2);
                        }
                    }
                
                    for (var i = 0; i < numClasses; i++) {
                        var dist = chooseDist();
                        //var thisNumPoints = Math.ceil(this.curAttribs.numPoints / numClasses);
                        var thisNumPoints = this.curAttribs.numPoints;

                        var thesePoints: DataPoint[] = 
                            this.generateNormalPoints(thisNumPoints, this.xExtent / 2, this.xExtent / 4, 2, i, 0.98);
                            
                        thesePoints.forEach(d => {
                            d.y = dist(d.y);
                        });
                        
                        this.data = this.data.concat(thesePoints);
                        
                           
                        // var xSpacing = this.xExtent / thisNumPoints;
                        // for (var n = 1; n <= thisNumPoints; n++) {
                        //     this.data.push({
                        //         x: n * xSpacing,
                        //         y: dist(n * xSpacing),
                        //         category: i
                        //     });
                        // }
                    }
                    break;
                case DataDistrib.Overlap:
                    var ptsPerClass = this.curAttribs.numPoints / numClasses; 
                    for (var c = 0; c < numClasses; c++) {
                        var thisPts = ptsPerClass + (Math.random() * this.curAttribs.numPoints / 10 - (this.curAttribs.numPoints / 20)); 
                        var numClusters = thisPts/ (Math.floor(Math.random() * 2) + 2);
                        var ptsPerCluster = thisPts / numClusters;
                        
                        for (var i = 0; i < numClusters; i++) {
                            var ptsHere = ptsPerCluster + (Math.random() * thisPts / 10 - (thisPts / 20));
                            
                            this.data = this.data.concat(
                                this.generateNormalPoints(
                                    ptsHere, 
                                    [Math.random() * this.xExtent, Math.random() * this.yExtent],
                                    0.05, 4, c
                                )
                            );   
                        }
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