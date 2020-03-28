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
let politiciansData = null;
/* global d3 */

const $section = d3.select('#bubblechart');
const $graphic = $section.select('.line__graphic');

const $chart = $graphic.select('.graphic__chart');
const $profiles = $graphic.select('.profiles__chart');

const $svg = $chart.select('svg');
const $gVis = $svg.select('.g-vis');
const $gAxis = $svg.select('.g-axis');

const $transTime = 300;

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
  "#5b5b5b"  //GRAY - INDEPENDENT
]

function getScaleParties() {
  return d3
    .scaleOrdinal()
    .domain(["SMER","SaS","MOST - HÍD","ZA ĽUDÍ","ĽSNS","OĽaNO","SNS","SME RODINA","MKP","KDH","PS/Spolu","DOBRÁ VOĽBA","VLASŤ","Independent"])
    .range(palette);
}

function getScaleColour(data) {
  return d3
    .scaleSequential()
    .domain([d3.min(data, d => d.difference),d3.max(data, d => d.difference)])
    .interpolator(d3.interpolate("#CC2A36", "#00b068"));
}

function getScaleY(data) {
  return d3
    .scaleLinear()
    .domain([d3.min(data, d => d.difference),d3.max(data, d => d.difference)])
    .nice()
    .range([height,0]);
}

function getScaleBand(data) {
  return d3
    .scaleBand()
    .domain(data.sort((a, b) => d3.descending(a.difference, b.difference)).map(d => d.politician))
    // .sort((a, b) => d3.descending(a.difference, b.difference));
    .range([0,width])
    .padding(1);
}

function updateAxis(scaleY, scaleBand) {
  //axes

  const axisY = d3.axisLeft(scaleY)
    .tickPadding(FONT_SIZE / 2)
    .tickSize(-width)
    .ticks(7)
    .tickFormat(d3.format(".0%"));

  $gAxis.select('.axis--y')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
    .call(axisY);

  const axisX = d3.axisBottom(scaleBand)
    .tickPadding(FONT_SIZE / 2)
    .tickSize(0);

  //function to wrap long labels on axis  
  function wrap(text, width) {
    text.each(function () {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(" "))
        if (tspan.node().getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(" "))
          line = [word]
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
        }
      }
    })
  }
}

function drawBubbleChart(data, scaleY, scaleColour, scaleBand) {
  d3.selectAll(".baseline").remove();

  //TITLE
  $svg.selectAll('text.heading')
    .remove();

  $svg.append('text')
    .text('● PERSONAL POPULARITY')
    .at({
      'class': 'heading',
      'transform': `translate(${0},${MARGIN.top/5})`
  });

  //SUBTITLE
  $svg.selectAll('text.subheading')
    .remove();

  $svg.append('text')
    .text('Percentage difference in approval vs. disapproval ratings.')
    .at({
      'class': 'subheading',
      'transform': `translate(${0},${MARGIN.top/2.2})`
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


  $gVis.append('line')
    .attr("class","baseline")
    .attr("x1",0)
    .attr("x2",width)
    .attr("y1",scaleY(0))
    .attr("y2",scaleY(0))
    .style("stroke-width","1px")
    .style("stroke","grey");

  const $politician = $gVis
    .selectAll('.politician')
    .data(data);

  const $politicianEnter = $politician.enter().append('g')
    .attr('class','politician');

  $politicianEnter.append("rect")
    .attr('class', 'approval_rect');

  const $politicianMerge = $politician.merge($politicianEnter);

  $politicianMerge
    .selectAll('.approval_rect')
    .attr('class',function(d) { return d.politician })
    .attr("y", function(d) { return scaleY(Math.max(0, d.difference)); })//scaleY(Math.min(0, d.difference));}) //scaleX(0.6);})
    .attr("x", function(d) { return scaleBand(d.politician); })
    .attr("height", function(d) { return Math.abs(scaleY(d.difference) - scaleY(0));})
    .attr("width", "3.5px")//scaleBand.bandwidth())
    .attr("fill", function(d) { return scaleColour(d.difference);})
    .attr("opacity", 1.0);

  const img_size = width * 0.065;

  $politicianEnter.append("circle")
    .attr('class', 'approval_circ');

  $politicianMerge
    .selectAll('.approval_circ')
    .attr('class',function(d) { return d.politician })
    .attr("cy", function(d) { return scaleY(d.difference);}) //scaleX(0.6);})
    .attr("cx", function(d) { return scaleBand(d.politician); })
    .attr("r", img_size*0.57)
    .attr("fill", function(d) { return scaleColour(d.difference);})
    .attr("opacity", 1.0);

  $politicianEnter.append("image")
    .attr('class','approval_img');

  $politicianMerge
    .selectAll(".approval_img")
    .attr("xlink:href",function(d){ 
      return `assets/images/circle_profile/${d.politician
        .toLowerCase()
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
    .attr("y", function(d) { return scaleY(d.difference)-img_size/2;}) //scaleX(0.6);})
    .attr("x", function(d) { return scaleBand(d.politician)-img_size/2; })
    .attr("width", img_size)
    .attr("height", img_size)
    .attr("opacity", .4)
    .on('mouseover',function() {
      d3.select(this)
      .transition()
      .duration($transTime)
      .attr("opacity", .9);
    })
    .on('mouseout',function() {
      d3.select(this)
      .transition()
      .duration($transTime)
      .attr("opacity", .4);
    });;

  $politicianEnter.append("text")
    .attr('class', 'approval_text');

  $politicianMerge
    .selectAll('.approval_text')
    .attr("x", function(d) { 
      if (d.difference > 0){
        return scaleY(0.7); 
      } else {
        return scaleY(0.36); 
      };
    })
    .attr("y", function(d) { return scaleBand(d.politician)+img_size/10; })
    .text( function (d) { return d.politician; })
    .attr("transform", function(d) {
      return "rotate(-90)" 
    })    
    .attr("opacity", 0.5)
    .style('text-anchor','center')
    .style('vertical-align','center');

  $gVis.selectAll('.politician').on("mouseover", function(d) {
    $profiles.selectAll('h3').remove();
    $profiles.selectAll('img').remove();
    $profiles.selectAll('p').remove();

    // $gVis.select('.approval_img').attr('opacity',1);

    $profiles.append("h3")
      .attr('class','politician_title')
      .text(d.politician)
      .attr('display','inline');
      
    $profiles.append("img")
      .attr('class','profile_pic')
      .attr("src",`assets/images/circle_profile/${d.politician
          .toLowerCase()
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
      )
      .style('width',"80px")
      .style('display','inline')
      .style('margin','0px 10px 0px 0px')
      .style('vertical-align','baseline');

    $profiles.append("p")
      .attr('class','birthplace')
      .text(`* ${d.birthdate}, ${d.birthplace}`)
      .style('font-size','11px');

    $profiles.append("p")
      .attr('class','approval')
      .text(`Dôvera: ${Math.round(d.approval*100)}%`)
      .style('font-size','11px')
      .style("color", scaleColour(d.approval))
      .style("display", "inline");

    $profiles.append("p")
      .attr('class','approval')
      .text(` vs. `)
      .style('font-size','11px')
      .style("display", "inline");

    $profiles.append("p")
      .attr('class','disapproval')
      .text(`Nedôvera: ${Math.round(d.disapproval*100)}%`)
      .style('font-size','11px')
      .style("color", scaleColour(-d.disapproval))
      .style("display", "inline");
    
    $profiles.append("p")
      .attr('class','bio')
      .text(d.bio)
      .style('font-size','10px');
  });

  $politician.on("mouseout", function() {

  });
}

function bubbleChart() {
  const data = politiciansData;
  const scaleY = getScaleY(data);
  const scaleBand = getScaleBand(data);
  const scaleColour = getScaleColour(data);
  updateAxis(scaleY, scaleBand);
  drawBubbleChart(data, scaleY, scaleColour, scaleBand);
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
  $gVis.selectAll('.politician').remove();
  bubbleChart();
}

function init() {
  loadData('data_politicians.csv').then(result => {
    politiciansData = cleanData.cleanPoliticians(result).sort((a, b) => d3.descending(a.difference, b.difference)).slice(0,10);
    //politiciansData = dirty//.sort((a, b) => d3.descending(a.difference, b.difference));
    // console.log(politiciansData);
    resize();
    bubbleChart();
  }).catch(console.error);
}

export default {
  init,
  resize
};
