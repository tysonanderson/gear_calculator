var rims = [{"name":"700c / 29er","iso":622,"wheel_mm":662},
			{"name":"27inch","iso":630,"wheel_mm":670},
			{"name":"650c","iso":571,"wheel_mm":611},
			{"name":"26inch mtb","iso":559,"wheel_mm":599},
			{"name":"24inch S5","iso":547,"wheel_mm":587},
			{"name":"24inch E6","iso":540,"wheel_mm":580},
			{"name":"24inch Terry","iso":520,"wheel_mm":560},
			{"name":"20inch Recumbent","iso":451,"wheel_mm":491},
			{"name":"20inch Schwinn","iso":419,"wheel_mm":459}];

var tires = [{"name":"20 mm","tire_mm":20},
			{"name":"23 mm","tire_mm":23},
			{"name":"25 mm","tire_mm":25},
			{"name":"28 mm","tire_mm":28},
			{"name":"32 mm","tire_mm":32},
			{"name":"35 mm","tire_mm":35},
			{"name":"38 mm","tire_mm":38},
			{"name":"44 mm","tire_mm":44},
			{"name":"50 mm","tire_mm":50},
			{"name":"56 mm","tire_mm":56},
			{"name":"1.00 inch","tire_mm":25.4},
			{"name":"1.25 inch","tire_mm":31.75},
			{"name":"1.5 inch","tire_mm":38.1},
			{"name":"1.75 inch","tire_mm":44.45},
			{"name":"1.95 inch","tire_mm":49.5},
			{"name":"2.00 inch","tire_mm":50.8},
			{"name":"2.10 inch","tire_mm":53.34},
			{"name":"2.125 inch","tire_mm":54},
			{"name":"2.20 inch","tire_mm":55.88},
			{"name":"2.25 inch","tire_mm":57.15},
			{"name":"2.30 inch","tire_mm":58.42},
			{"name":"2.35 inch","tire_mm":59.69},
			{"name":"2.40 inch","tire_mm":60.69}];

var chainrings = new Miso.Dataset({
  importer : Miso.Dataset.Importers.GoogleSpreadsheet,
  parser : Miso.Dataset.Parsers.GoogleSpreadsheet,
  key : "0AgEcBPN1ANYGdFd4N1pWdkF4V3I4LWxLWEt5QnhtUWc",
  worksheet : "1"
});

chainrings.fetch({ 
  success : function() {

    var data = [];
	this.each(function(row){ data.push(row); });

	//populate vendor select
	$.each( _.uniq(this.column('vendor').data), function(i,d){
		var option = $('<option></option>').text(d);
		$('#vendor-name').append(option);
	} );

	//populate type select
	$.each( _.uniq(this.column('type').data), function(i,d){
		var option = $('<option></option>').text(d);
		$('#gearing-type').append(option);
	} );

	//convert chainrings to array
	$.each(data,function(i,row){ row['chainrings'] = textToArray(row['chainrings']) });

  },
  error : function() {
    alert("Error fetching data");
  }
}).then(function() {
  // add a column that combines the name with the range for the select
	  chainrings.addComputedColumn("name_description", "string", function(row) {
	    return row.name + ":  " + row.range;
	  });
  });

var cassette = new Miso.Dataset({
  importer : Miso.Dataset.Importers.GoogleSpreadsheet,
  parser : Miso.Dataset.Parsers.GoogleSpreadsheet,
  key : "0AgEcBPN1ANYGdFd4N1pWdkF4V3I4LWxLWEt5QnhtUWc",
  worksheet : "2"
});

cassette.fetch({ 
  success : function() {

    var data = [];
	this.each(function(row){ data.push(row); });

	//populate chainring picker
	$.each( _.uniq(this.column('vendor').data), function(i,d){
		var option = $('<option></option>').text(d);
		$('#chainring-picker').append(option);
	} );

	//convert sprockets to array
	$.each(data,function(i,row){ row['sprockets'] = textToArray(row['sprockets']) });

  },
  error : function() {
    alert("Error fetching data");
  }
}).then(function() {
  // add a column that combines the name with the range for the select
	  cassette.addComputedColumn("name_description", "string", function(row) {
	    return row.name + ":  " + row.range;
	  });
  });

//populate crankset,cassette selects (after vendor,type have been chosen)
$('#gearing-type').change(function (){

	$('.label-remove').remove()

	//crankset

	//clear any previous options
	$('#vendor-crankset').empty();

	$.each( chainrings.where({columns:['name_description','range'], rows: function(row){return row.vendor == $('#vendor-name').val() && row.type == $('#gearing-type').val()} }).column('name_description').data , function(i,d){
		var option = $('<option></option>').text(d);
		$('#vendor-crankset').append(option);
	} );

	//enable the select
	$('#vendor-crankset').prop('disabled', false);

	///----------------

	//cassette

	//clear any previous options
	$('#vendor-cassette').empty();

	$.each( cassette.where({columns:['name_description','range'], rows: function(row){return row.vendor == $('#vendor-name').val() && row.type == $('#gearing-type').val()} }).column('name_description').data , function(i,d){
		var option = $('<option></option>').text(d);
		$('#vendor-cassette').append(option);
	} );

	//enable the select
	$('#vendor-cassette').prop('disabled', false);

})


var bikes = [];

var svg = d3.select('#vis').append('svg')
		.attr('width', 600)
		.attr('height', 500);


//measument object
var Measure = function(calcFun, units){
	this.calcFun = calcFun;
	this.units = units;
}
Measure.prototype.calc = function (cr){
	return this.calcFun(cr);
}

//ALL MEASUREMENT METHODS -----------
var gainRatio = new Measure(function(cr){
	return $.map(cr.cassette, function(sprocket){ return ((cr.wheel/Math.PI)/2) / cr.crank * (cr.chainring / sprocket)});
},"Gain ratio");

var gearInches = new Measure(function(cr){
	return $.map(cr.cassette, function(sprocket){ return ((cr.wheel/Math.PI) * (cr.chainring / sprocket)) * 0.039370})
},"Gear inches");

var devMeters = new Measure(function(cr){
	return $.map(cr.cassette, function(sprocket){ return (((cr.wheel/1000)/Math.PI) * (cr.chainring / sprocket)) * Math.PI})
},"Development in meters");

//dividing the chainwheel size by the rear sprocket size, multiplying the result by the wheel diameter and by pi (3.1416)

var measureMethod = gainRatio;




//create select boxes for tire and rims
$.each( rims, function(i,d){
	var option = $('<option></option>').attr("data-subtext", d.iso + "mm").text(d.name);
	$('#rim-picker').append(option);

} );

$.each( tires, function(i,d){
	var option = $('<option></option>').attr("data-subtext", d.tire_mm + "mm").text(d.name);
	$('#tire-picker').append(option);

} );

//start spinners
$('#chainringSpinner').spinner({
	min: 1,
	max: 5
})
$('#cassetteSpinner').spinner({
	min: 1,
	max: 20
})

//start bootstrap-select addon
$('.selectpicker').selectpicker();

$('#chainringSpinner').on('changed', function (){ 

	$('#chainringContainer').empty();

	for (var i = 0; i < $('#chainringSpinner').spinner('value'); i++) {
		$('#chainringContainer').append('<input type="number" class="form-control gear-form" value="1">');
	};

})
$('#cassetteSpinner').on('changed', function (){ 

	$('#cassetteContainer').empty();

	for (var i = 0; i < $('#cassetteSpinner').spinner('value'); i++) {
		$('#cassetteContainer').append('<input type="number" class="form-control gear-form" value="1">');
	};

})

//controls for measurment select
$('#measureType').change(function(e){

	measureMethod = window[e.currentTarget.value];
	addVis();

})

//engage modal on page load
$('#bikeAddModal').modal('show');


//add event to bike addition form
$('#add-btn').click(function(e){
	$('#bikeAddModal').modal('hide');
	
	bikes.push( processVendorForm(e.currentTarget) );

	addVis();
	return false;
 });

$('#addBike').click(function(e){

	$('#bikeAddModal').modal('show');
 });

//add event to window to redraw vis on resize
$(window).resize(function() {
	addVis();
});

function processVendorForm(form){

	var bike = {
		name: $('#vendor-name').val(),
		description: $('#vendor-crankset').val() + " - " + $('#vendor-cassette').val(),
		wheel: wheelSize(rims[$.inArray($('#rim-picker').prop('value'),$.map(rims, function (d){  return d.name }))].iso,
				tires[$.inArray($('#tire-picker').prop('value'),$.map(tires, function (d){  return d.name }))].tire_mm),
		chainrings: textToArray(chainrings.where({columns:['name_description','chainrings'], rows: function(row){ return new String( row.name_description ).replace(/\s+/g, ' ') === new String($('#vendor-crankset').val() ).replace(/\s+/g, ' ') } }).toJSON()[0].chainrings),
		cassette: textToArray(cassette.where({columns:['name_description','sprockets'], rows: function(row){ return new String( row.name_description ).replace(/\s+/g, ' ') === new String($('#vendor-cassette').val() ).replace(/\s+/g, ' ') } }).toJSON()[0].sprockets),
		crank: parseInt($('#crank').val())
	}
	bike.cassette = bike.cassette.sort(function(a,b){return a-b});
	bike.chainrings = bike.chainrings.sort(function(a,b){return a-b});

	return bike;
}




function processForm(form){

	var bike = {
		name: $('#bike-name').prop('value'),
		wheel: wheelSize(rims[$.inArray($('#rim-picker').prop('value'),$.map(rims, function (d){  return d.name }))].iso,
				tires[$.inArray($('#tire-picker').prop('value'),$.map(tires, function (d){  return d.name }))].tire_mm),
		chainrings: $.map($('#chainringContainer > input'), function (d){return parseInt(d.value)}).sort(function(a,b){return a-b}),
		cassette: $.map($('#cassetteContainer > input'), function (d){return parseInt(d.value)}).sort(function(a,b){return a-b}),
		crank: parseInt($('#crank').prop('value'))

	}

	return bike;
}



//width of description column for bikes
var textCol = 275;

var color =  d3.scale.category10(),
	x = d3.scale.linear().range([textCol,$('#vis').width() - 20]);

var color = d3.scale.ordinal().range(['#F9B84B','#00A8C6','#F9B84B','#00A8C6','#F9B84B','#00A8C6','#F9B84B','#00A8C6','#F9B84B','#00A8C6','#F9B84B','#00A8C6'])



function addVis(){

	//clear existing svg and replace with new content
	$('svg').remove();

	svg = d3.select('#vis').append('svg')
		.attr('width', $('#vis').width())
		.attr('height', 500);

	//reset the domain of the x axis to match the min/max of the current data 
	x.domain([getMin(), getMax()])
    
    //add an svg:g element for each bike in the vis
	var bikeGrouping = svg.selectAll('.bike-group')
		.data(bikes)
		.enter()
		.append('g')
		.attr('class', 'bike-group')
		.attr('transform', function (d,i){ return 'translate(10,' + ((i * 60) + 10) + ')'});

	//add an svg:g element for chainring
	var chainringGrouping = bikeGrouping.selectAll('.cr-group')
		.data(function (d){
			return $.map(d.chainrings, function (cr){ return {wheel:d.wheel, chainring: cr, cassette: d.cassette, crank: d.crank} })
		})
		.enter()
		.append('g')
	 	.attr('class', 'cr-group')
	    .attr('transform', function (d,i){ return 'translate(0,' + (i * 20) + ')'});

	//tick line for each chainring
	chainringGrouping.append('line')
		.attr('x1', textCol)
		.attr('x2', $('#vis').width() - 20)
		.attr('class', 'cr-tick');

	//add an svg:line element for chainring to show range
	var gearRange = chainringGrouping.selectAll('.gear-line')
		.data( function(d){ return [measureMethod.calc(d)] })
		.enter()
		.append('line')
		.attr('x1',function (d){return x(d3.min(d)) } )
		.attr('x2',function (d){return x(d3.max(d)) } )
		.attr('y1',0)
		.attr('y2',0)
		.attr('class', 'gear-line');

	svg.selectAll('.bike-group').selectAll('.gear-line').attr('stroke', function(d,i,j){return color(j)})

	 //add an svg:circle element for each possible gear combination
	 var gearDot = chainringGrouping.selectAll('.gear-dot')
	 	.data( function(d){ return measureMethod.calc(d) } )
	 	.enter()
	 	.append('circle')
	 	.attr('r', $(window).width() < 600 ? 3 : 5)
	 	.attr('cx',function(d){return x(d) })
	    .attr('class',"gear-dot")
	    .append('title')
	    .text( function (d){ return d } );


	svg.selectAll('.bike-group').selectAll('.gear-dot').attr('fill', function(d,i,j){return color(j)})

	//labels for each chainring
	chainringGrouping.append('text')
		.attr('x', textCol - 25)
		.attr('y', ".5em")
		.text(function (d){ return d.chainring})
		.attr('class', 'cr-label');

	//labels for each bike
	bikeGrouping.append('text')
		.attr('y', 1)
		.attr('x', 1)
		.text(function (d){ return d.name})
		.attr('class', 'bike-label');

	//FIXME: slicing the text off at 30 chars for now
	bikeGrouping.append('text')
		.attr('y', "1em")
		.attr('x', 1)
		.text(function (d){ return d.description.slice(0,30)})
		.attr('class', 'bike-description');

	//add axis
	var xAxis = d3.svg.axis().scale(x);

	svg.append("g")
		.attr("transform", "translate(10," + ((bikes.length * 60) + 10) +")")
		.call(xAxis);

	//axis label	
	svg.append("text").attr('y', ((bikes.length * 60) + 50)).attr('x', (($('#vis').width() - textCol) * 0.5)+textCol ).attr('class','unit-label').text(measureMethod.units);

}

// UTILITY FUNCTIONS --------

function getMin(){
	return d3.min($.map(bikes, function(d){ return $.map(d.chainrings, function (cr){ return measureMethod.calc(  {wheel:d.wheel, chainring: cr, cassette: d.cassette, crank: d.crank} )}) }));
}
function getMax(){
	return d3.max($.map(bikes, function(d){ return $.map(d.chainrings, function (cr){ return measureMethod.calc(  {wheel:d.wheel, chainring: cr, cassette: d.cassette, crank: d.crank} )}) }));
}

//convert a comma sep string to an array
function textToArray(d){ return $.map(d.split(','), function (cog){ return parseInt(cog)}) }

//tire calc
function wheelSize(rim,tire){
	console.log( rim + tire)
	return (rim + tire) * Math.PI;
}

