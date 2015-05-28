# Chart.MultiDoughnut.js
### Introduction
A Chart.js plugin for showing dougnut/pie chart with multiple rings on a single canvas element.
Usage is exactly the same as the default doughnut chart in Chart.js, with the exception of the data structure of the datasets.
### Example usage

```javascript
var multidoughnut = new Chart(ctx).MultiDoughnut(data, options);
```

### Data structure

```javascript
var datasets = [
		// 1st ring
		[
			{
				value: 100,
				color: "#FDB45C",
				highlight: "#FFC870",
				label: "Orange"
			}
		],
		// 2nd ring
		[
		    {
			  value: 10,
			  color: "#46BFBD",
			  highlight: "#5AD3D1",
			  label: "Cyan"
			},
			{
				value: 50,
				color: "#949FB1",
				highlight: "#A8B3C5",
				label: "Grey"
			}
		]
	];
```

### Chart Options

These are the default customisation options specific to MultiDoughnut charts. These options are merged with the global chart configuration options in Chart.Core.js.

```javascript
{
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
}
```


These default options can be overriden for a specific `Chart` instance by passing an object containing the options to be overriden as the second argument of the `MultiDoughnut` method.

For example, to have a MultiDoughnut chart with an inner radius of zero, i.e. a pie chart in the middle, do the following:

```javascript
new Chart(ctx).MultiDoughnut(data, {
	percentageInnerCutout: 0
});
```


Gaps can be inserted between each ring by modifying the  `percentageDatasetGap` option. Note that width of the gap is taken as a pecentage of the width of a segment. For example:

```javascript
new Chart(ctx).MultiDoughnut(data, {
	percentageDatasetGap: 50
	// The value 50 indicates that the gap between each ring will be 50% the width of a segment in a ring.
});
```
