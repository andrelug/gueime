var gridster;
var chartNewData = [];
$(function () { //DOM Ready

    gridster = $(".gridster ul").gridster({
        widget_margins: [10, 10],
        widget_base_dimensions: [140, 140],
        draggable: {
            handle: '.fa-arrows',
            stop: function () {
                var grid = JSON.stringify(gridster.serialize());
                $.ajax({
                    url: '/grid',
                    type: 'POST',
                    data: { grid: grid }
                });
                console.log(JSON.stringify(gridster.serialize()));
            }
        }
    }).data('gridster');

    // sort serialization


    serialization = Gridster.sort_by_row_and_col_asc(serialization);



    $.each(serialization, function () {
        gridster.add_widget('<li><div class="panel radius large"><h5>teste</h5><div id="chartdiv" style="width:100%;height:88%;"></div></div></li>', this.size_x, this.size_y, this.col, this.row);

    });


    $('.toggle').on('click', function () {

        if ($('li').has('span').length >= 1) {
            $('span').remove();
        } else {
            $('.panel').prepend('<span><i class="fa fa-arrows"></i></span><span><i class="fa fa-expand"></i></span>');
        }
    });

    $(document).on('click', '.fa-expand', function () {
        if ($(this).closest('.panel').hasClass('large')) {
            gridster.resize_widget($(this).closest('li'), 2, 3);
            $(this).closest('.panel').removeClass('large');
            var grid = JSON.stringify(gridster.serialize());
            $.ajax({
                url: '/grid',
                type: 'POST',
                data: { grid: grid }
            });
            console.log(JSON.stringify(gridster.serialize()));
        } else {
            gridster.resize_widget($(this).closest('li'), 3, 3);
            $(this).closest('.panel').addClass('large');
            var grid = JSON.stringify(gridster.serialize());
            $.ajax({
                url: '/grid',
                type: 'POST',
                data: { grid: grid }
            });
        }

    });


// CHART ANALYTICS

for (i = 0; i< values.totalResults; i++) {
    chartNewData.push({
        "Data": values.rows[i][0].replace('2016', '').slice(2) + "/" + values.rows[i][0].replace('2016', '').slice(0,-2) + "/" + "2016",
        "Visitas": parseInt(values.rows[i][1])
    });
}
var chartData = chartNewData;
/*
AmCharts.ready(function(){
    console.log("novo chart " + chartNewData)
    var chart = new AmCharts.AmSerialChart();
    chart.dataProvider = chartData;
    chart.categoryField = "Data";

    var graph = new AmCharts.AmGraph();
    graph.valueField = "Visitas";
    graph.fillAlphas = 0.5;
    graph.bullet="round";
    graph.bulletSize=5;
    graph.bulletColor="#FFFFFF";
    graph.bulletBorderAlpha=1;
    graph.lineThickness=1;
    graph.balloonText="<span style='font-size:18px;'>[[value]]</span>"
    graph.useLineColorForBulletBorder=true;
    graph.type = "line";
    chart.addGraph(graph);

    chart.write('chartdiv');
});
*/
var chart = AmCharts.makeChart("chartdiv", {
    "type": "serial",
    "theme": "light",
    "marginRight": 40,
    "marginLeft": 40,
    "autoMarginOffset": 20,
    "dataDateFormat": "DD/MM/YYYY",
    "valueAxes": [{
        "id": "v1",
        "axisAlpha": 0,
        "position": "left",
        "ignoreAxisWidth":true
    }],
    "balloon": {
        "borderThickness": 1,
        "shadowAlpha": 0
    },
    "graphs": [{
        "id": "g1",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "bullet": "round",
        "bulletBorderAlpha": 1,
        "bulletColor": "#FFFFFF",
        "bulletSize": 5,
        "hideBulletsCount": 50,
        "lineThickness": 2,
        "title": "red line",
        "useLineColorForBulletBorder": true,
        "valueField": "Visitas",
        "balloonText": "<span style='font-size:18px;'>[[value]]</span>"
    }],

    "chartCursor": {
        "pan": true,
        "valueLineEnabled": true,
        "valueLineBalloonEnabled": true,
        "cursorAlpha":1,
        "cursorColor":"#258cbb",
        "limitToGraph":"g1",
        "valueLineAlpha":0.2
    },
    "categoryField": "Data",
    "categoryAxis": {
        "parseDates": true,
        "dashLength": 1,
        "minorGridEnabled": true
    },
    "dataProvider": chartData
});


});
