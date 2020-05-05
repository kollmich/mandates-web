import cleanData from './clean-data';
import loadData from './load-data';

const MARGIN = {
  top: 120,
  bottom: 70,
  left: 50,
  right: 10
}
const FONT_SIZE = 12;
let width = 0;
let height = 0;
let mandatesData = null;
let STROKE_W = 2;
/* global d3 */
const $section = d3.select('#main');
const $graphic = $section.select('.scroll__graphic');
const $chart = $graphic.select('.graphic__chart');
const $date = $graphic.select('.graphic__date');
const $svg = $chart.select('svg');
const $gVis = $svg.select('.g-vis');
const $gAxis = $svg.select('.g-axis');

const $transTime = 300;
const timeParse = d3.timeFormat("%e. %B %Y");

//helper functions
function round_to_precision(x, precision) {
  let y = +x + (precision === undefined ? 0.5 : precision/2);
  return y - (y % (precision === undefined ? 1 : +precision));
}

function getScaleX(data) {
  return d3
    .scaleTime()
    .domain([d3.min(data, d => d.poll_date), d3.max(data, d => d.poll_date)])
    .range([0, width])
    .nice();
}

function getScaleY(data) {
  return d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.result)*1.05])
    .range([height, 0])
    .nice();
}

function getScaleOpacity(data) {
  return d3
    .scaleLinear()
    .domain(d3.extent(data, d => d.result))
    .range([0.4, 0.8]);
}


const palette = [
  "#CC2A36", //DARK RED - SMER
  "#00A0B0", //LIGHT-GREEN/BLUE - SAS
  "#eb6841", //ORANGE - MOST HID
  "#edc951", //YELLOW - ZA LUDI
  "#4f372d", //BROWN - LSNS
  "#00b068", //GREEN - OLANO
  "#2d454f", //DARK-BLUE - SNS
  "#949494", //GRAY - SME RODINA
  "#98a54c", //GREEN - MKP
  "#5175ed", //BLUE - KDH
  "#4e30b0", //PURPLE - PS/Spolu
  "#eb416f", //PINK - DOBRA VOLBA
  "#5b5b5b"  //
]

function getScaleColour(data) {
  return d3
    .scaleOrdinal()
    .domain(["SMER","SaS","MOST - HÍD","ZA ĽUDÍ","ĽSNS","OĽaNO","SNS","SME RODINA","MKP","KDH","PS/Spolu","DOBRÁ VOĽBA","VLASŤ"])
    .range(palette);
}

function updateAxis(scaleX, scaleY) {
  //axes
  const axisY = d3.axisLeft(scaleY)
    .tickPadding(FONT_SIZE / 2)
    .tickSize(-width)// + MARGIN.right)
    .ticks(5)
    .tickFormat(d3.format(".0%"));

  $gAxis.select('.axis--y')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
    .call(axisY);

  const axisX = d3.axisBottom(scaleX)
    .tickPadding(FONT_SIZE / 2)
    .tickSize(-height)
    .ticks(5);

  $gAxis.select('.axis--x')
    .attr('transform', `translate(${MARGIN.left},${height + MARGIN.top})`)
    .call(axisX)
    .selectAll("text")	
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", function(d) {
        return "rotate(-65)" 
        });
}

function drawLineChart(data, scaleX, scaleY, scaleColour) {
  $gVis.selectAll('#overlay')
    .remove();

  $gVis.append('rect')
    .attr('id','overlay')
    .attr("x",0)
    .attr("y",0)
    .attr('width',width)
    .attr('height',height)
    .attr('z-index',-100)
    .attr('opacity',0);


  //TITLE
  $svg.selectAll('text.heading')
    .remove();

  $svg.append('text')
    .text('● POLITICAL FRONTRUNNERS IN SLOVAKIA')
    .at({
      'class': 'heading',
      'transform': `translate(${0},${MARGIN.top/5})`
  });

  //SUBTITLE
  $svg.selectAll('text.subheading')
    .remove();

  $svg.append('text')
    .text('General election opinion polls timeline.')
    .at({
      'class': 'subheading',
      'transform': `translate(${0},${MARGIN.top/2})`
    })

  $svg.append('text')
  .text('(% of decided voters)')
  .at({
    'class': 'subheading',
    'transform': `translate(${0},${MARGIN.top/1.55})`
  })

  //DATA
  $svg.selectAll('text.source')
    .remove();

  $svg.append('text')
    .text(`data: Focus, AKO`)
    .at({
      'class': 'source',
      'transform': `translate(${0},${height+MARGIN.top+MARGIN.bottom - 5})`,
      'text-anchor':'start'
  });

  //BRAND
  $svg.selectAll('text.brand')
    .remove();

  $svg.append('text')
    .text(`trendspotting.site`)
    .at({
      'class': 'brand',
      'transform': `translate(${width+MARGIN.left},${height+MARGIN.top+MARGIN.bottom - 5})`,
      'text-anchor':'end'
  });


  const $result = $gVis
    .selectAll('.result')
    .data(data);

  const $resultEnter = $result.enter().append('g')
    .attr('class','result');

  //add bars
  $resultEnter.append('circle')
    .attr('class', 'circle');

  const $resultMerge = $result.merge($resultEnter);

  $resultMerge
    .selectAll('.circle')
    .attr('r', $chart.node().offsetWidth/400 )
    .attr('cy', function (d) {
      return scaleY(d.result);
    })
    .attr('cx', function (d) {
      return scaleX(d.poll_date);
    })
    // .attr('opacity',1)
    .attr('stroke', function (d) {
      return scaleColour(d.party_shortname);
    })
    .attr('stroke-width', STROKE_W/2)
    .attr('stroke-opacity', 0.3)
    .attr('fill-opacity', 0)
    .attr('fill-opacity',0.3)
    .attr('fill', function (d) {
      return scaleColour(d.party_shortname);
    })
    .attr('id', function(d) { 
      return d.party_shortname.replace(/ /g,'').replace('/','');
    });
    
  $result.exit().remove();

  const sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
    .key(function(d) { return d.party_shortname;})
    .entries(data.sort((a, b) => d3.ascending(a.poll_date, b.poll_date)));

  const $line = $gVis
    .selectAll('.line')
    .data(sumstat);

  const $lineEnter = $line.enter().append('g')
    .attr('class','line');

  //add bars
  $lineEnter.append('path').attr('class','party');

  const $lineMerge = $line.merge($lineEnter);

  $lineMerge
    .selectAll('.party')
    .attr("fill", "none")
    .attr("stroke", function(d){ return scaleColour(d.key) })
    .attr("stroke-width", STROKE_W*1.5)
    .attr("d", function(d){
      return d3.line()
        .defined(d => !isNaN(d.result))
        .x(function(d) { return scaleX(d.poll_date); })
        .y(function(d) { return scaleY(d.result); })
        .curve(d3.curveBasis)
        (d.values)
    })
    .attr('id', function(d) { return d.key.replace(/ /g,'').replace('/','')});
  
  $line.exit().remove();

  const $tooltip = $gVis.append("g");
  
  function mouseOver() {
    $gVis.selectAll('.highlight')
      .remove();
    $date.selectAll('.date')
      .remove();

    const bisectLeft = d3.bisector(d => d.poll_date).left;

    let datex = null;

    if(this == null) {
      datex = d3.max(data, d=>d.poll_date);
    } else if(scaleX.invert(d3.mouse(this)[0]) < d3.max(data, d=>d.poll_date)) {
      datex = scaleX.invert(d3.mouse(this)[0]);
    } else {
      datex = d3.max(data, d=>d.poll_date);
    };

    const indexLeft = bisectLeft(data,datex,1);

    const highlightPoints = data[indexLeft].poll_date;  
    const highlightAgency = data[indexLeft].poll_agency;

    let highlight_data = [];
    highlight_data = data.filter(function(d) {
      if(timeParse(d.poll_date) == timeParse(highlightPoints)) {
        return d.result;
      }
    });
    highlight_data = highlight_data.sort((a, b) => d3.descending(a.result, b.result));
    let current_date = d3.map(highlight_data,function(d){return timeParse(d.poll_date);}).keys();

    let result_list = [];
    for (let i = 0; i < highlight_data.length; i++) {
      const value = Math.round( highlight_data[i].result * 1000) / 10 ;
      const party = highlight_data[i].party_shortname;
      result_list.push(`${party} - ${value}%`);
    }

    let resultDisplayArray = [];
    for (let i = 0; i < result_list.length; i++) {
      resultDisplayArray.push(`${result_list[i]}
`);
    }
    
    const $highlight = $gVis
      .selectAll('.highlight')
      .data(highlight_data);

    const $highlightEnter = $highlight.enter().append('g')
      .attr('class','highlight');

    //add bars
    $highlightEnter.append('circle')
      .attr('class', 'highlightCircle');

    const $highlightMerge = $highlight.merge($highlightEnter);

    $highlightMerge
      .selectAll('.highlightCircle')
      .attr('r', $chart.node().offsetWidth/150)
      .attr('cy', function (d) {
        return scaleY(d.result);
      })
      .attr('cx', function (d) {
        return scaleX(d.poll_date);
      })
      .attr('fill', function (d) {
        return scaleColour(d.party_shortname);
      })
      .style('stroke', 'black')
      .style('stroke-width',2.5)
      .attr('fill-opacity', 0.7);

    // ADD DATE ON MOUSEOVER
    const $dateZoom = $svg
      .selectAll('.date')
      .data(current_date);

    const $dateZoomEnter = $dateZoom.enter().append('g')
      .attr('class','date');

    //add bars
    $dateZoomEnter.append('text')
      .at({
        'class': 'datetime',
        'transform': `translate(${width+MARGIN.left},${MARGIN.top/1.3})`,
        'text-anchor':'end'
      })

    const $dateZoomMerge = $dateZoom.merge($dateZoomEnter);

    $dateZoomMerge
      .selectAll('.datetime')
      .text(current_date)
      .style("margin-top","5px");
    
    
    const inside = highlight_data.filter(function(d) {
      if((d.result >= 0.05 && d.coalition == "f") || (d.result >= 0.07 && d.coalition == "t")) {
        return d.result;
      }
    });

    const outside = highlight_data.filter(function(d) {
      if((d.result < 0.05 && d.coalition == "f") || (d.result < 0.07 && d.coalition == "t")) {
        return d.result;
      }
    });

    const inside_div = '#in';
    const outside_div = '#out';

    legenDraw(inside, inside_div);
    legenDraw(outside, outside_div);

    function legenDraw(dat, div) {
      const $parties = $graphic.select(div);

      const $legend = $parties
        .selectAll('.party')
        .data(dat);
              
      const $legendEnter = $legend.enter().append('div')
        .attr('class','party')
        .attr('id',function(d){ return d.party_shortname});
    
      const $legendMerge = $legend.merge($legendEnter);

      //ADD LOGOS
      $legendEnter.append('img')
        .attr('class','result_logo');
      
      $legendMerge
        .select(".result_logo")
        .attr('src', function(d) { return `assets/images/parties/${d.party_shortname.toLowerCase()
        .replace('ľ','l')
        .replace('é','e')
        .replace('í','i')
        .replace('á','a')
        .replace('ý','y')
        .replace('ž','z')
        .replace('ť','t')
        .replace('č','c')
        .replace('ó','o')
        .replace('š','s')
        .replace('-','')
        .replace(/ /g,'')
        .replace('/','')}.png`
        })
      .style('width',"35px")
      .style('display','inline')
      .style('margin','0 auto')
      .style('vertical-align','baseline');

      //ADD TITLES
      $legendEnter.append('p')
        .attr('class','party_title');

      $legendMerge
        .select(".party_title")
        .text(function(d) { return `${d.party_shortname}`})
        .style("color",function(d){ return scaleColour(d.party_shortname)})

      //ADD RESULTS
      $legendEnter.append('p')
        .attr('class','result_title');
      
      $legendMerge
        .select(".result_title")
        .text(function(d) { return `${Math.round(d.result * 10000)/100}%`})
        .style("color",function(d){ return scaleColour(d.party_shortname)});


      $legend.on("mouseover", function(d) {

        $gVis.selectAll('.highlightCircle').attr('opacity',0);
        $gVis.selectAll('.party').attr('opacity',0.1);
        $gVis.selectAll('.circle').attr('opacity',0.1);
        $gVis.selectAll('.line').selectAll('#'+d.party_shortname.replace(/ /g,'').replace('/','')).attr('opacity',1).attr('stroke-width',STROKE_W*2);
        $gVis.selectAll('.result')
          .selectAll('#'+d.party_shortname.replace(/ /g,'').replace('/',''))
          .attr('opacity',1)
          .attr('stroke-width',STROKE_W)
          .attr('r', $chart.node().offsetWidth/250);
        d3.select(this)
          .style('background-color','#eee')
          .style('border-radius','5px')
          .style('border','0px solid #ddd');
      });

      $legend.on("mouseout", function() {
        $gVis.selectAll('.party').attr('opacity',1).attr('stroke-width',STROKE_W*1.5);
        $gVis.selectAll('.circle')
          .attr('opacity',1)
          .attr('stroke-width',STROKE_W/2)
          .attr('r', $chart.node().offsetWidth/400);
        d3.select(this)
          .style('background-color',"white")
          .style('border','none');
      });

      $legend.exit().remove();
    }

  };

  $gVis.on("touchmove mousemove", mouseOver);
  
  $gVis.on("touchend mouseleave", function() {
    // $tooltip.call(callout, null);
    $gVis.selectAll('.highlight')
      .remove();
  });

  mouseOver();
}

function lineChart() {
  const parseYear = d3.timeParse("%Y-%m-%d");
  const data_unsorted = mandatesData.filter(function(d) {
    if(d.result >= 0.01 && d.poll_date >= parseYear('2012-02-01') ) {
      return d.poll_date
    }
  });
  const data = data_unsorted.sort((a, b) => d3.descending(a.poll_date, b.poll_date)).sort((a, b) => d3.descending(a.result, b.result));
  const scaleX = getScaleX(data);
  const scaleY = getScaleY(data)
  const scaleColour = getScaleColour(data);

  updateAxis(scaleX, scaleY);
  drawLineChart(data, scaleX, scaleY, scaleColour);
}

function updateDimensions() {
  const h = window.innerHeight;
  width = $chart.node().offsetWidth - MARGIN.left - MARGIN.right;
  height = Math.floor(h*0.7) - MARGIN.top - MARGIN.bottom;
}

function resize() {
  updateDimensions();
  $svg.attr('width', width + MARGIN.left + MARGIN.right)
    .attr('height', height + MARGIN.top + MARGIN.bottom);
  $gVis.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
  lineChart();
}

function init() {
  loadData('data_mandaty.csv').then(result => {
    mandatesData = cleanData.cleanMandates(result);
    resize();
    lineChart();
  }).catch(console.error);
}

export default {
  init,
  resize
};
