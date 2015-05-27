(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		//Cache a local reference to Chart.helpers
		helpers = Chart.helpers;

	var defaultConfig = {
		//Boolean - Whether we should show a stroke on each segment
		segmentShowStroke : true,

		//String - The colour of each segment stroke
		segmentStrokeColor : "#fff",

		//Number - The width of each segment stroke
		segmentStrokeWidth : 2,

		//Number - The gap between each ring, as a percentage of the width of each ring
		percentageDatasetGap : 0,

		//The percentage of the chart that we cut out of the middle.
		percentageInnerCutout : 50,

		//Number - Amount of animation steps
		animationSteps : 100,

		//String - Animation easing effect
		animationEasing : "easeOutBounce",

		//Boolean - Whether we animate the rotation of the Doughnut
		animateRotate : true,

		//Boolean - Whether we animate scaling the Doughnut from the centre
		animateScale : false,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"><%if(segments[i].label){%><%=segments[i].label%><%}%></span></li><%}%></ul>"

	};

	Chart.Type.extend({
		//Passing in a name registers this chart in the Chart namespace
		name: "MultiDoughnut",
		//Providing a defaults will also register the deafults in the chart namespace
		defaults : defaultConfig,
		//Initialize is fired when the chart is initialized - Data is passed in as a parameter
		//Config is automatically merged by the core of Chart.js, and is available at this.options
		initialize:  function(data){

			//Declare datasets as a static property to prevent inheriting across the Chart type prototype
			this.datasets = [];
			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) -	this.options.segmentStrokeWidth/2)/2;
			this.totalGap = function() {
				return (this.datasets.length - 1) * (this.options.percentageDatasetGap / 100);
			}
			this.chartGap = function(index) {
				return index * (this.outerWidth() - this.segmentWidth() * this.datasets.length) / (this.datasets.length - 1);
			}
			this.outerWidth = function() {
				return this.outerRadius * (1 - this.options.percentageInnerCutout/100);
			}
			this.segmentWidth = function() {
				return this.outerWidth() / (this.datasets.length + this.totalGap());
			}
			this.calculateOuterRadius = function(datasetIndex) {
				return (this.outerRadius * this.options.percentageInnerCutout/100) + ((datasetIndex + 1) * this.segmentWidth()) + this.chartGap(datasetIndex);
			}
			this.calculateInnerRadius = function(datasetIndex) {
				return (this.outerRadius * this.options.percentageInnerCutout/100) + ((datasetIndex) * this.segmentWidth()) + this.chartGap(datasetIndex);
			}

			this.SegmentArc = Chart.Arc.extend({
				ctx : this.chart.ctx,
				x : this.chart.width/2,
				y : this.chart.height/2
			});

			
			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];

					helpers.each(this.datasets, function(dataset){
						helpers.each(dataset, function(segment){
							segment.restore(["fillColor"]);
						});
					});
					helpers.each(activeSegments,function(activeSegment){
						activeSegment.fillColor = activeSegment.highlightColor;
					});
					this.showTooltip(activeSegments);
				});
			}
			
			this.calculateTotal(data);

			helpers.each(data, function(dataset, dataIndex){
				helpers.each(dataset, function(datapoint, index){
					if (!datapoint.color) {
						datapoint.color = 'hsl(' + (360 * index / data.length) + ', 100%, 50%)';
					}
					this.addData(datapoint, dataIndex, index, true);
				}, this);
			}, this);
			this.render();
		},
		getSegmentsAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.datasets, function(dataset){
				helpers.each(dataset, function(segment){
					if (segment.inRange(location.x, location.y)){
						segmentsArray.push(segment);
					}
				}, this);
			},this);
			return segmentsArray;
		},
		showTooltip : function(ChartElements, forceRedraw){
			// Only redraw the chart if we've actually changed what we're hovering on.
			if (typeof this.activeElements === 'undefined') this.activeElements = [];

			var isChanged = (function(Elements){
				var changed = false;

				if (Elements.length !== this.activeElements.length){
					changed = true;
					return changed;
				}

				helpers.each(Elements, function(element, index){
					if (element !== this.activeElements[index]){
						changed = true;
					}
				}, this);
				return changed;
			}).call(this, ChartElements);

			if (!isChanged && !forceRedraw){
				return;
			}
			else{
				this.activeElements = ChartElements;
			}
			this.draw();
			if(this.options.customTooltips){
				this.options.customTooltips(false);
			}
			if (ChartElements.length > 0){
				helpers.each(ChartElements, function(Element) {
					var tooltipPosition = Element.tooltipPosition();
					new Chart.Tooltip({
						x: Math.round(tooltipPosition.x),
						y: Math.round(tooltipPosition.y),
						xPadding: this.options.tooltipXPadding,
						yPadding: this.options.tooltipYPadding,
						fillColor: this.options.tooltipFillColor,
						textColor: this.options.tooltipFontColor,
						fontFamily: this.options.tooltipFontFamily,
						fontStyle: this.options.tooltipFontStyle,
						fontSize: this.options.tooltipFontSize,
						caretHeight: this.options.tooltipCaretSize,
						cornerRadius: this.options.tooltipCornerRadius,
						text: helpers.template(this.options.tooltipTemplate, Element),
						chart: this.chart,
						custom: this.options.customTooltips
					}).draw();
				}, this);
			}
			return this;
		},
		addData : function(segment, datasetIndex, atIndex, silent) {
			if (datasetIndex >= this.datasets.length) {
				this.datasets.splice(datasetIndex, 0, []);
			}
			var index = atIndex || this.datasets[datasetIndex].length;
			this.datasets[datasetIndex].splice(index, 0, new this.SegmentArc({
				value : segment.value,
				outerRadius : (this.outerRadius * this.options.percentageInnerCutout/100) + ((datasetIndex + 1) * this.segmentWidth()),
				innerRadius : (this.outerRadius * this.options.percentageInnerCutout/100) + (datasetIndex * this.segmentWidth()),
				fillColor : segment.color,
				highlightColor : segment.highlight || segment.color,
				showStroke : this.options.segmentShowStroke,
				strokeWidth : this.options.segmentStrokeWidth,
				strokeColor : this.options.segmentStrokeColor,
				startAngle : Math.PI * 1.5,
				circumference : (this.options.animateRotate) ? 0 : this.calculateCircumference(segment.value, datasetIndex),
				label : segment.label
			}));
			if (!silent) {
				this.reflow();
				this.update();
			}
		},
		calculateCircumference : function(value, datasetIndex) {
			if ( this.total[datasetIndex] > 0 ) {
				return (Math.PI*2)*(value / this.total[datasetIndex]);
			} else {
				return 0;
			}
		},
		calculateTotal : function(dataset){
			this.total = [0];
			helpers.each(dataset, function(data, index){
				helpers.each(data, function(segment){
					if (this.total.length <= index) {
						this.total[index] = Math.abs(segment.value);
					} else {
						this.total[index] += Math.abs(segment.value);
					}
				}, this);
			}, this);			
		},
		update : function(){
			this.calculateTotal(this.datasets);

			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor']);
			}, this);
			
			helpers.each(this.datasets, function(dataset){
				helpers.each(dataset, function(segment){
					segment.save();	
				}, this);
			}, this);
			this.render();
		},
		removeData: function(datasetIndex, atIndex){
			var setIndex = (helpers.isNumber(datasetIndex)) ? datasetIndex : this.datasets.length-1;
			var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.datasets[setIndex].length-1;
			this.datasets[setIndex].splice(indexToDelete, 1);
			this.reflow();
			this.update();
		},
		reflow : function(){
			helpers.extend(this.SegmentArc.prototype,{
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) -	this.options.segmentStrokeWidth/2)/2;
			
			helpers.each(this.datasets, function(dataset, datasetIndex){
				helpers.each(dataset, function(segment){
					segment.update({
						outerRadius : this.calculateOuterRadius(datasetIndex),
						innerRadius : this.calculateInnerRadius(datasetIndex)
					});
				}, this);
			}, this);
		},
		draw : function(easeDecimal){
			var animDecimal = (easeDecimal) ? easeDecimal : 1;
			this.clear();

			helpers.each(this.datasets, function(dataset, datasetIndex){
				helpers.each(dataset, function(segment, index){ 
					segment.transition({
						circumference : this.calculateCircumference(segment.value, datasetIndex),
						outerRadius : this.calculateOuterRadius(datasetIndex),
						innerRadius : this.calculateInnerRadius(datasetIndex)
					},animDecimal);

					segment.endAngle = segment.startAngle + segment.circumference;
					segment.draw();
					if (index === 0){
						segment.startAngle = Math.PI * 1.5;
					}
					//Check to see if it's the last segment, if not get the next and update the start angle
					if (index < this.datasets[datasetIndex].length-1){
						this.datasets[datasetIndex][index+1].startAngle = segment.endAngle;
					}
				}, this);
			}, this);
			
		}
	});
}).call(this);
