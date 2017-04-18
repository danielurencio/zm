var width = window.innerWidth,
    height = window.innerHeight,
    active = d3.select(null);

var projection = d3.geo.mercator();

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g")

d3.json("mx2.json", function(error, mx) {
  if (error) throw error;

  var key = Object.keys(mx.objects)[0];
  var municipios = topojson.feature(mx, mx.objects[key]);
  projection.scale(1).translate([0,0]);

  var b = path.bounds(municipios);
  var s = 0.95 / Math.max((b[1][0]-b[0][0]) / width, (b[1][1] - b[0][1]) / height);
  var t = [(width-s*(b[1][0]+b[0][0]))/2, (height-s*(b[1][1]+b[0][1]))/2];

  projection.scale(s).translate(t);

//  svg.append("g")
//      .attr("class", "municipalities")
    g.selectAll("path")//.attr("class", "municipalities")
      .data(topojson.feature(mx, mx.objects.municipalities).features)
    .enter().append("path")
      .attr("d", path)
      .style("fill", function(d) {
	return "rgba(0,0,0,0.8)";
      });


  g.append("path")
      .datum(topojson.mesh(mx, mx.objects.municipalities, function(a, b) { return a.properties.state === b.properties.state && a !== b; }))
      .attr("class", "municipality-boundary")
      .attr("d", path);


  var zm = mx.objects.municipalities.geometries
       .filter(function(d) { return d.properties.sun })
       .map(function(d) { return d.properties.sun; })
       .reduce(function(a,b) { if (a.indexOf(b) < 0 ) a.push(b); return a; }, [])

  g.append("path")
      .datum(topojson.mesh(mx, mx.objects.municipalities, function(a, b) { return a.properties.state !== b.properties.state; }))
      .attr("class", "state-boundary")
      .attr("d", path);


  var selected = d3.set(zm);

for(var k in zm ) {
  g.append("path")
	.datum(topojson.merge(mx, mx.objects.municipalities.geometries.filter(function(d) {
	  return d.properties.sun == zm[k];
	})))
	.attr("d", path)
	.attr("class", "sun")
	.attr("id", zm[k])
	.on("click",clicked)
}

/////////////////////////////////////////////////
///////////// Z00M
//////////////////////////////////////

function clicked(d) {
  d3.selectAll("#quitar_cuando_zoom").remove();

  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true)
	.style("fill", "rgba(255,195,77,0.5)");

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .55 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];


  g.transition()
      .duration(750)
      .style("stroke-width", 1 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

   g.selectAll(".municipality-boundary").transition()
//	.duration(750)
	.style("stroke-width", 0.25 / scale + "px");



  g.selectAll(".state-boundary")
	.style("stroke-width", 2 / scale + "px");

  g.selectAll(".sun")
	.style("stroke-width", 2.5 / scale + "px")
	.style("stroke", "rgba(255,195,77,0.85)");


  var cuadro = svg.append("g").attr("id","OFF");
  var city = d3.select(this).attr("id");

////////////////////////////////////////
/////////////////// CUADROS
////////////////////////////////////

  d3.csv("matriz1.csv",function(error,data) {
    var info_ciudad = data.filter(function(d) { return d.clave_SUN == city; })[0];
    var years = ["2010","2015","2020","2025","2030"];
    var proy = []

    for(var i in years) {
      proy.push({ "date": years[i], "pob":+info_ciudad[years[i]] })
    }


    var titX = width / 25,
	titY = height / 7,
	titOffset = 10;

    var nom_ciudad = svg.append("text").attr("id","OFF")
	.attr("x", titX)
	.attr("y", titY)
	.text(info_ciudad["Nombre de la ciudad"])
	.attr("font-family","SoberanaBlack")
	.attr("font-size", "80px")
	.attr("class", "nombre_de_ciudad")
	.attr("alignment-baseline","middle")
	.attr("fill","white");

    svg.append("rect").attr("id","OFF")
	.attr({ "rx":8, "ry":8 })
	.attr("x", (titX) - titOffset)
	.attr("y", function(d) {
	  return nom_ciudad.node().getBBox().y - titOffset
	})
	.attr("width", function(d) {
	  return nom_ciudad.node().getBBox().width + titOffset*2
	})
	.attr("height", function(d) {
	  return nom_ciudad.node().getBBox().height + titOffset;
	})
	.attr("fill", "rgba(0,0,0,0.75)")
//	.style("z-index","-1");

    var nom_ciudad = svg.append("text").attr("id","OFF")
	.attr("x", titX)
	.attr("y", titY)
	.text(info_ciudad["Nombre de la ciudad"])
	.attr("font-family","SoberanaBlack")
	.attr("font-size", "80px")
	.attr("class", "nombre_de_ciudad")
	.attr("alignment-baseline","middle")
	.attr("fill","white");


    lineChart(proy,cuadro);
    rectangulo(info_ciudad,nom_ciudad);

    cuadro.append("text")
	.attr("x", 130)
	.attr("y", height / 2 + 20)
	.text("Crecimiento poblacional")
	.style({
	  "font-family":"SoberanaLight"
	})
	.attr("fill","white");


  });

}


function reset() {
  d3.selectAll("#OFF").remove()
  d3.selectAll(".active").style("fill", "rgba(255,255,255,0.4)");
  active.classed("active", false);
  active = d3.select(null);

  g.selectAll(".municipality-boundary")
	.transition().duration(750)
	  .style("stroke-width", "0.5px")

  g.selectAll(".state-boundary")
	.transition().duration(750)
	  .style("stroke-width", "1px")

  g.selectAll(".sun")
	.transition().duration(750)
	  .style("stroke-width", "1px")
	  .style("stroke", "orange")

  g.transition()
      .duration(750)
 //     .style("stroke-width", "1px")
      .attr("transform", "");

}

});

d3.select(self.frameElement).style("height", height + "px");

////////////////////////////////////////////////////////////////
// AUMENTO POBLACIONAL
///////////////////////////////////////////////////////////

function lineChart(data,c){
  var y = height / 2,
      yOffset = 300;

  c.append("rect").transition().delay(800)
	.attr({
	"rx":6,
	"x": 20,
	"y": y - 40,
	"width":width / 3.33,
	"height":yOffset + 80,
	"fill": "rgba(0,0,0,0.75)"
	});


    var parseDate = d3.time.format("%Y").parse;

    data.forEach(function(d) {
        d.date = parseDate(d.date);
//        d.close = +d.close;
    });


    var x = d3.time.scale().range([0, width/3.33 - 40]);
    var y = d3.scale.linear().range([y , 60]);

// Define the axes
    var xAxis = d3.svg.axis().scale(x)
      .orient("bottom").ticks(5);

    var yAxis = d3.svg.axis().scale(y)
      .orient("right").ticks(5);

// Define the line
    var valueline = d3.svg.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.pob); });


    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain(d3.extent(data, function(d) { return d.pob; }));

    // Add the valueline path.
    c.append("path")
        .attr("class", "line")
        .attr("transform", "translate(40," + yOffset + ")")
        .attr("d", valueline(data));

    // Add the X Axis
    c.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(40," + ((height/2 + 300) - 0) + ")")
        .call(xAxis);

    // Add the Y Axis
    c.append("g")
        .attr("class", "y axis")
	.attr("transform", "translate(40," + (yOffset) + ")")
        .call(yAxis);


    d3.selectAll(".tick text")
	.style("fill","white")
	.style("font-family", "SoberanaLight")
	.style("font-size", "8px");
};

//////////////////////////////////////////////////////////////
//////// DATOS GENERALES
////////////////////////////////////////////////////////

function rectangulo(data,nom_ciudad) {
  var contenedor = svg.append("g").attr("id","OFF");
  var x = (width / 3)*2 - 20;

  function y() {
    var Y = nom_ciudad.node().getBBox().y;
    var h = nom_ciudad.node().getBBox().height;
    return Y + h + 20;
  }

  var Y = y();

  contenedor.append("rect")
     .attr({
	"x": x,
	"y": y,
	"rx":8,
	"ry":8,
	"width":1,
	"height":1,
	"fill":"rgba(0,0,0,0.75)"
     })
     .transition().delay(750).duration(1000)
     .attr({
	"width":width / 3,
	"height":height - 180
     })

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 20),
      "y": (Y + 40),
      "fill":"white",
      "font-size": "30px",
      "font-family": "SoberanaLight",
      "class": "demos"
    }).text("Aspectos demográficos");


    var edades = [
      { rango:"0-14",num:+data["Población de 0 a 14 años (%)"] },
      { rango:"15-64",num:+data["Población de 15 a 64 años (%)"] },
      { rango:"65 o más", num:+data["Población de 65 años y más (%)"] }
    ];

    console.log(data);

    var color = d3.scale.ordinal()
	.range(["rgba(255,116,53,0.7)","rgba(255,161,53,0.7)","rgba(255,203,53,0.7)"]);

    var color0 = d3.scale.ordinal()
	.range(["rgba(255,116,53,0.0)","rgba(255,161,53,0.0)","rgba(255,203,53,0.0)"]);


    var arc = d3.svg.arc()
	.outerRadius(80)
	.innerRadius(50);

    var pie = d3.layout.pie()
	.sort(null)
	.value(function(d) { return d.num; })

    var centroArc = ((x + width / 3) - x) / 2

   

    var g = contenedor.selectAll(".arc")
	.data(pie(edades))
	.enter().append("g")
	.attr("class", "arc")
	.attr("transform", "translate(" + (x+100) + "," + (Y+140) + ")");

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 100),
      "y": (Y + 140),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
      "text-anchor": "middle",
      "alignment-baseline":"middle" 
    }).text("Edad");


    g.append("path")
	.attr("d", arc)
	.style("fill", function(d) { return color0(d.data.rango); })
	.transition().delay(1000).duration(2500)
	.style("fill", function(d) { return color(d.data.rango); });


  g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".20em")
      .attr("font-family", "SoberanaLight")
      .attr("font-size", "11px")
      .style("fill", "transparent")
      .text(function(d) {
	return "* " + d.data.rango + ": " + String(d.data.num.toFixed(2))+'%';
       })
      .transition().duration(2000)
      .style("fill", "rgba(255,255,255,0.8)");

  var sexo = [
    { "sexo":"hombres", "num":+data["Población masculina (%)"] },
    { "sexo":"mujeres", "num":+data["Población femenina (%)"] }
  ];
  console.log(sexo);


  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 330),
      "y": (Y + 80),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
      "text-anchor": "middle",
      "alignment-baseline":"middle" 
    }).text("Sexo");

var ext = d3.extent(sexo,function(d) { return d.num; });

  var scaleR = d3.scale.linear()
	.range([0,200])
	.domain(ext)



  var g0 = svg.append("g").attr("class","recuadro").attr("id","OFF");
//	.attr("transform", "translate(" (x+200) + "," + (Y+100) + ")");

  var barras = g0.selectAll("rect").data(sexo).enter()
    .append("rect")
    .attr({
      "x": function(d,i) { return (x-190) + width / 3 },
      "y": function(d,i) { return Y + 110 + (40*i); },
      "width": 10,
      "height": 40,
      "fill": function(d) {
	if(d.sexo == "mujeres") { return "rgba(216,39,53,0)"; }
        else { return "rgba(0,82,185,0)"; }
      },
      "class": function(d) { return d.sexo; },
      "id": "OFF"
    })



    barras.transition().delay(1000).duration(2000)
    .attr("fill",function(d) {
	if(d.sexo == "mujeres") { return "rgba(216,39,53,0.7)"; }
        else { return "rgba(0,82,185,0.7)"; }
    })
    .attr("width", function(d) { return d.num*2.8 })

    g0.selectAll("text").data(sexo).enter()
      .append("text")
      .attr({
	"fill": "transparent",
	"alignment-baseline":"hanging",
	"font-family":"SoberanaLight",
	"font-size":"10px",
	"x": function(d) { return (x-190) + (width/3) + (d.num*2.8) + 5 },
	"y": function(d,i) { return Y + 110 + (40*i) }
      }).text(function(d) { return d.num.toFixed(1) + "%"; })
      .transition().delay(2000).duration(2000)
	.attr("fill", "rgba(255,255,255,0.7)");


    d3.select(".recuadro").append("text")
	.attr("x", function(d) { return d3.select(".hombres").node().getBBox().x + 5})
	.attr("y", function() { return d3.select(".hombres").node().getBBox().y + 5})
	.attr("alignment-baseline","hanging")
	.attr("font-family", "SoberanaLight")
	.attr("font-size", "10px")
	.style("fill", "rgba(255,255,255,0)")
	.text(function() { return d3.select(".hombres").attr("class"); })
	.transition().delay(2000).duration(2000)
	.style("fill", "rgba(255,255,255,0.7)");


    d3.select(".recuadro").append("text")
	.attr("x", function(d) { return d3.select(".mujeres").node().getBBox().x + 5})
	.attr("y", function() { return d3.select(".mujeres").node().getBBox().y + 5 })
	.attr("alignment-baseline","hanging")
	.attr("font-family", "SoberanaLight")
	.attr("font-size", "10px")
	.style("fill", "rgba(255,255,255,0)")
	.text(function() { return d3.select(".mujeres").attr("class"); })
	.transition().delay(2000).duration(2000)
	.style("fill", "rgba(255,255,255,0.7)");


  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 270),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Número de municipios: " + data["Número de Municipios"]);

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 300),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Entidad: " + data["Entidad"]);

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 300),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Entidad: " + data["Entidad"]);


  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 330),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Delitos por c/mil habitantes: " + data["Número de delitos por cada 1,000 habitantes"]);

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 360),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Grado de marginación urbana: " + data["Grado de marginación urbana 2010"]);

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 390),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Temperatura mínima anual: " + (+data["Temp. Minima Anual (°C)"]).toFixed(1) + " °C");

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 420),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Temperatura máxima anual: " + (+data["Temp. Máxima Anual (°C)"]).toFixed(1) + " °C");

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 450),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Clima: " + data["Clima A"].split(" ")[0] + " " + data["Clima A"].split(" ")[1]);

  contenedor.append("text").transition().delay(1000)
    .attr({
      "x": (x + 40),
      "y": (Y + 480),
      "fill":"rgba(255,255,255,0.8)",
      "font-size": "20px",
      "font-family": "SoberanaLight",
    }).text("Precipitación media anual (mm): " + (+data["Precipitación Media Anual"]).toFixed(1));

}

function consulta() {
  var consulta = svg.append("text")
    .attr({
      "x":width / 20,
      "y":(height / 15)*8,
      "font-family":"SoberanaBlack",
      "font-size":"50px",
      "fill":"none",
      "id":"quitar_cuando_zoom"
    }).text("Consulta:")
    .transition().duration(1000)
	.attr("fill","rgba(0,0,0,0.7)");

  var numBolitas = [1,2,3];

  var bolitas = svg.selectAll("circle")
    .data(numBolitas).enter()
    .append("circle")
    .attr({
      "id":"quitar_cuando_zoom",
      "cx": function(d,i) {
//	return (consulta.node().getBBox().x + 30) + (i*70) ;
	var w = consulta.node().getBBox().width / 2;
	return (width/20) + (i*w)
      },
      "cy": function() {
	var y = consulta.node().getBBox().y;
	var h = consulta.node().getBBox().height;
	return y + h + 35;
      },
      "r": 35,
      "fill": "rgba(0,0,0,0.8)"
    })
    .on("click", function(d) {
	d3.select(this).attr("fill","red");
    })


/*    svg.selectAll("text")
	.data(numBolitas).enter()
	.append("text")
	.attr({
	  "x": function(d,i) {
	    var w = consulta.node().getBBox().width / 2;
	    var p;
	    if(1) {
	      p = (width/20); //+ (i*w)
	    } else {
	      p = (width/20) + (i*w)
	    }
            return p;
          },
	  "y": function() {
	    var y = consulta.node().getBBox().y;
	    var h = consulta.node().getBBox().height;
	      return y + h + 35;
	  },
	   "fill":"white"
	 })//.text(function(d) { return d; console.log(d) })
*/
}
