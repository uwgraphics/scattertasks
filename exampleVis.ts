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
		class?: string;
	}
	
	export class ExampleVis {
		defaultAttribs: DataParameters;
		
		xExtent = 10;
		yExtent = 10;
		
		curAttribs: DataParameters;
		data: DataPoint[];
		
		constructor (defaultAttribs: DataAttribute[]) {
			this.updateDataAttribs(defaultAttribs, true);	
		}
		
		// given a complete set of data attributes, generate a sample scatterplot
		private generateData() {
			this.data = [];
			switch (this.curAttribs.dataDist) {
				case DataDistrib.Random:
					for (var i = 0; i < this.curAttribs.numPoints; i++) {
						var pt: DataPoint = {
							x: Math.random() * this.xExtent,
							y: Math.random() * this.yExtent 
						}
						this.data.push(pt);
					}
					break;
				case DataDistrib.Linear:
					var r = 0.7 + (Math.random() * 0.3);  // try to limit this from r = 0.7 to 1
					for (var i = 0; i < this.curAttribs.numPoints; i++) {
						// see Rensink2010 (equation 1) for generating points
					}
			}
		}
		
		// construct a mapping from data attribute value to scatterplot value
		updateDataAttribs(dataAttrib: DataAttribute[], doDefault?: boolean) {
			var baseAttribs: any = this.defaultAttribs || {};
			dataAttrib.forEach(da => {
				switch (da.attribute_id) {
					case 1:
						if (da.attrib_value_id == 1)
							baseAttribs.numClasses = NumClasses.OneClass;
						else if (da.attrib_value_id == 2)
							baseAttribs.numClasses = NumClasses.TwoToFourClasses;
						else if (da.attrib_value_id == 3)
							baseAttribs.numClasses = NumClasses.FivePlusClasses;
						else
							throw "Mapping for given attribute_id/attrib_value_id not implemented";
						break;
					case 2:
						if (da.attrib_value_id == 4)
							baseAttribs.numPoints = Math.ceil(Math.random() * 10);
						else if (da.attrib_value_id == 5)
							baseAttribs.numPoints = Math.ceil(Math.random() * 90) + 10;
						else if (da.attrib_value_id == 6)
							baseAttribs.numPoints = Math.ceil(Math.random() * 900) + 100;
						else if (da.attrib_value_id == 7)
							baseAttribs.numPoints = Math.ceil(Math.random() * 5000) + 1000;
						else 
							throw "Mapping for given attribute_id/attrib_value_id not implemented";
						break;
					case 3:
						if (da.attrib_value_id == 8)
							baseAttribs.dims = NumDims.TwoPicked;
						else if (da.attrib_value_id == 9)
							baseAttribs.dims = NumDims.TwoDerived;
						else if (da.attrib_value_id == 10)
							baseAttribs.dims = NumDims.MultiDim;
						else 
							throw "Mapping for given attribute_id/attrib_value_id not implemented";
						break;
					case 4:
						if (da.attrib_value_id == 11)
							baseAttribs.spatialNature = Spatial.TwoNonSpatial;
						else if (da.attrib_value_id == 12)
							baseAttribs.spatialNature = Spatial.TwoSpatial;
						else if (da.attrib_value_id == 13)
							baseAttribs.spatialNature = Spatial.OneEach;
						else
							throw "Mapping for given attribute_id/attrib_value_id not implemented";
						break;
					case 5:
						if (da.attrib_value_id == 14)
							baseAttribs.dataDist = DataDistrib.Random;
						else if (da.attrib_value_id == 15)
							baseAttribs.dataDist = DataDistrib.Clusters;
						else if (da.attrib_value_id == 16)
							baseAttribs.dataDist = DataDistrib.Manifolds;
						else if (da.attrib_value_id == 17)
							baseAttribs.dataDist = DataDistrib.Linear;
						else if (da.attrib_value_id == 18)
							baseAttribs.dataDist = DataDistrib.Overlap;
						else
							throw "Mapping for given attribute_id/attrib_value_id not implemented";
						break;
					default:
						throw "Mapping for given attribute_id not implemented "
				}
			});
			
			if (doDefault) this.defaultAttribs = baseAttribs;
			this.curAttribs = baseAttribs;
		}
	}
}