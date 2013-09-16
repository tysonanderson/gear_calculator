var rims = [{"name":"27inch","iso":630,"wheel_mm":670},
			{"name":"700c / 29er","iso":622,"wheel_mm":662},
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

//convert a comma sep string to an array
function textToArray(d){ return $.map(d.split(','), function (cog){ return parseInt(cog)}) }

//_.uniq(ds.column('vendor').data)

var bikes = [];

var svg = d3.select('#vis').append('svg')
		.attr('width', 600)
		.attr('height', 500);


var gearings = [
	{type: "standard", chainrings: [39,53], cassette: [11,12,13,14,15,17,19,21,23,25,28]}
];


var gainRatio = function (bike,measure){
	var rval = [];
	$.each(bike.chainrings, function(i,cr){
		switch(measure){
			case "gainRatio":
				rval.push( $.map(bike.cassette, function(sprocket){ return ((bike.wheel/Math.PI)/2) / bike.crank * (cr / sprocket)}) )
			break;
			case "gearInches":
				rval.push( $.map(bike.cassette, function(sprocket){ return ((bike.wheel/Math.PI) * (cr / sprocket)) * 0.039370}) )
			break;
			case "devMeters":
				rval.push( $.map(bike.cassette, function(sprocket){ return ((bike.wheel/1000) * (cr / sprocket)) * Math.PI}) )
			break;
			default:
				rval.push( $.map(bike.cassette, function(sprocket){ return ((bike.wheel/Math.PI)/2) / bike.crank * (cr / sprocket)}) )
			break;
		}
		
	})
	
	return rval;
}

var gearInches = function (bike){
	var rval = [];
	$.each(bike.chainrings, function(i,cr){
		rval.push( $.map(bike.cassette, function(sprocket){ return ((bike.wheel/Math.PI) * (cr / sprocket)) * 0.039370}) )
	})
	
	return rval;
}

var devMeters = function (bike){
	var rval = [];
	$.each(bike.chainrings, function(i,cr){
		rval.push( $.map(bike.cassette, function(sprocket){ return ((bike.wheel/1000) * (cr / sprocket)) * Math.PI}) )
	})
	return rval;
}

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


//add event to bike addition form !!! OLD FUNCTION THAT PAIRS WITH CUSTOM FORM !!!
$('#add-bike').submit(function(e){
	bikes.push( processForm(e.currentTarget) );
	addVis();
	return false;
 })


//add event to bike addition form
$('#vendor-options').submit(function(e){
	
	bikes.push( processVendorForm(e.currentTarget) );
	addVis();
	return false;
 })

function processVendorForm(form){

	var bike = {
		name: $('#vendor-name').val(),
		wheel: wheelSize(rims[$.inArray($('#rim-picker').prop('value'),$.map(rims, function (d){  return d.name }))].iso,
				tires[$.inArray($('#tire-picker').prop('value'),$.map(tires, function (d){  return d.name }))].tire_mm),
		chainrings: textToArray(chainrings.where({columns:['name_description','chainrings'], rows: function(row){ return new String( row.name_description ).replace(/\s+/g, ' ') === new String($('#vendor-crankset').val() ).replace(/\s+/g, ' ') } }).toJSON()[0].chainrings),
		cassette: textToArray(cassette.where({columns:['name_description','sprockets'], rows: function(row){ return new String( row.name_description ).replace(/\s+/g, ' ') === new String($('#vendor-cassette').val() ).replace(/\s+/g, ' ') } }).toJSON()[0].sprockets),
		crank: parseInt($('#crank').val())

	}

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

//tire calc
function wheelSize(rim,tire){
	return (rim + (tire * 2)) * Math.PI;
}

var color =  d3.scale.category10(),
	x = d3.scale.linear().range([0,500]);

function addVis(){

	// var groups = $.map(gainRatio(bikes[0]), function(d){ return svg.data(d).append('g') });
	var groups = svg.selectAll('.cr-group')
	    .data(gainRatio(bikes[0], $('#visOptions > select').prop('value')))
	    .enter()
	    .append('g')
	    .attr('class', 'cr-group')
	    .attr('transform', function (d,i){ return 'translate(10,' + ((i * 10) + 10) + ')'})

	// groups[0].selectAll('circle')

	var minVal = d3.min(d3.min(gainRatio(bikes[0], $('#visOptions > select').prop('value')))),
		maxVal = d3.max(d3.max(gainRatio(bikes[0], $('#visOptions > select').prop('value'))));
	x.domain([d3.min(d3.min(gainRatio(bikes[0], $('#visOptions > select').prop('value')))),d3.max(d3.max(gainRatio(bikes[0], $('#visOptions > select').prop('value')))) ])

	function makeCircles(d, i){
		var c = color(i);
	    d3.select(this).selectAll('circle')
	        .data(d)
	        .enter()
	        .append('circle')
	        .attr('r', 3)
	        .attr('cx',function(d){return x(d) })
	        .attr('fill', function (d){return color(c)})
    }
    groups.each(makeCircles);

    function makeLines(d, i){
		var c = color(i);
	    d3.select(this)
	        .append('line')
	        .attr('x1',x(d3.min(d)))
	        .attr('x2',x(d3.max(d)))
	        .attr('y1',0)
	        .attr('y2',0)
	        .attr('stroke-width', 2)
	        .attr('stroke', color(c))
    }
    groups.each(makeLines);

	var xAxis = d3.svg.axis()
    	.scale(x);

	svg.append("g")
	    .attr("transform", "translate(10," + bikes[0].chainrings.length * 14 +")")
	    .call(xAxis);

	// var g = svg.selectAll('g')
	// 	.data(gainRatio(bikes[0]))
	// 	.enter()
	// 	.append('g');

	// g.append('circle')
	// 	.attr('r', 5)
	// 	.attr('cx', function (d){ console.log(d);return d })

	// g.append('circle')
	// 	.data(d)
	// 	.attr('r', 3)
	// 	.attr('cx',function(d){  console.log(d); return d});
}





