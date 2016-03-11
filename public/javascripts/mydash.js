$(function () { //DOM Ready

var data = [{
    "Data": "05/2009",
    "martialTech": 0
},{
    "Data": "09/2009",
    "martialTech": 3
}, {
    "Data": "03/2011",
    "martialTech": 2
}, {
    "Data": "10/2011",
    "martialTech": 1,
    "nossoAmigo": 0
}, {
    "Data": "11/2011",
    "martialTech": 2,
    "nossoAmigo": 4
}, {
    "Data": "02/2012",
    "martialTech": 0,
    "nossoAmigo": 1
}, {
    "Data": "04/2012",
    "nossoAmigo": 0
}, {
    "Data": "09/2012",
    "martialTech2": 2
}, {
    "Data": "10/2012",
    "martialTech": 0,
    "armazem": 0,
    "gueime": 0
}, {
    "Data": "11/2012",
    "martialTech": 2,
    "armazem": 3,
    "gueime": 4
}, {
    "Data": "12/2012",
    "martialTech": 0,
}, {
    "Data": "01/2013",
    "armazem": 1,
}, {
    "Data": "02/2013",
    "armazem": 0,
}, {
    "Data": "04/2013",
    "gueime": 7
}, {
    "Data": "05/2013",
    "doeja": 0,
    "andrelug": 0,
    "portfolio": 0,
    "boglr": 0,
    "euTenhoVoz": 0
}, {
    "Data": "06/2013",
    "doeja": 3,
    "gueime": 8,
    "portfolio": 1,
    "boglr": 2
}, {
    "Data": "07/2013",
    "andrelug": 3,
    "spv": 0,
    "portfolio": 0,
    "euTenhoVoz": .3
}, {
    "Data": "08/2013",
    "gueime": 9.5,
    "doeja": 4,
    "boglr": 0,
    "spv": .5,
    "euTenhoVoz": 0
}, {
    "Data": "09/2013",
    "spv": 0,
    "doeja": 0,
    "studybox": 0,
    "andrelug": 0,
    "gueime": 8,
    "captaqui": 0
}, {
    "Data": "10/2013",
    "gueime": 9,
    "iteratrack": 0,
    "studybox": 6,
    "captaqui": 2
}, {
    "Data": "11/2013",
    "gueime": 6,
    "iteratrack": 3,
    "studybox": 2,
    "captaqui": 4,
    "powerUp": 0
}, {
    "Data": "12/2013",
    "iteratrack": 0,
    "studybox": 0,
    "powerUp": 5,
    "gueime": 3
}, {
    "Data": "12/2013",
    "iteratrack": 0,
    "studybox": 0
}];


/* MEU GRAFICO */

var chart = AmCharts.makeChart("myGraph", {
    "type": "serial",
    "theme": "light",
    "marginRight": 40,
    "marginLeft": 40,
    "autoMarginOffset": 20,
    "dataDateFormat": "MM/YYYY",
    "balloon": {
        "borderThickness": 1,
        "shadowAlpha": 0
    },
    "mouseWheelZoomEnabled": true,
    "chartScrollbar": {
        "autoGridCount": true,
        "scrollbarHeight": 40,
        "dragIcon": "dragIconRoundBig.svg"
    },
















    "valueAxes": [{
        "id": "martialTech",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "nossoAmigo",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "armazem",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "gueime",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "doeja",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "andrelug",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "portfolio",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "boglr",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "spv",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "studybox",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "euTenhoVoz",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "captaqui",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "powerUp",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    },{
        "id": "iteratrack",
        "axisAlpha": 0,
        "position": "left",
        "maximum": 10,
        "ignoreAxisWidth":true
    }],










    "graphs": [{
        "valueAxis": "martialTech",
        "id": "g1",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#f39c12",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Martial Tech",
        "useLineColorForBulletBorder": true,
        "valueField": "martialTech",
        "balloonText": "<span style='font-size:12px;'>Martial Tech</span>"
    },{
        "valueAxis": "nossoAmigo",
        "id": "g2",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#e67e22",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Nosso Amigo",
        "useLineColorForBulletBorder": true,
        "valueField": "nossoAmigo",
        "balloonText": "<span style='font-size:12px;'>Nosso Amigo</span>"
    },{
        "valueAxis": "armazem",
        "id": "g5",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#9b59b6",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Armazem",
        "useLineColorForBulletBorder": true,
        "valueField": "armazem",
        "balloonText": "<span style='font-size:12px;'>Armazém</span>"
    },{
        "valueAxis": "gueime",
        "id": "g6",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#3498db",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Gueime",
        "useLineColorForBulletBorder": true,
        "valueField": "gueime",
        "balloonText": "<span style='font-size:12px;'>Gueime</span>"
    },{
        "valueAxis": "doeja",
        "id": "g7",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#e74c3c",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "DoeJa",
        "useLineColorForBulletBorder": true,
        "valueField": "doeja",
        "balloonText": "<span style='font-size:12px;'>Doe Já</span>"
    },{
        "valueAxis": "andrelug",
        "id": "g8",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#3498db",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Andrelug",
        "useLineColorForBulletBorder": true,
        "valueField": "andrelug",
        "balloonText": "<span style='font-size:12px;'>Andrelug</span>"
    },{
        "valueAxis": "portfolio",
        "id": "g9",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#9b59b6",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Portfolio",
        "useLineColorForBulletBorder": true,
        "valueField": "portfolio",
        "balloonText": "<span style='font-size:12px;'>Portfolio</span>"
    },{
        "valueAxis": "boglr",
        "id": "g10",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#3498db",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Boglr",
        "useLineColorForBulletBorder": true,
        "valueField": "boglr",
        "balloonText": "<span style='font-size:12px;'>Boglr</span>"
    },{
        "valueAxis": "spv",
        "id": "g11",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#9b59b6",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "spv",
        "useLineColorForBulletBorder": true,
        "valueField": "spv",
        "balloonText": "<span style='font-size:12px;'>San Pedro Valley</span>"
    },{
        "valueAxis": "studybox",
        "id": "g12",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#9b59b6",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Studybox",
        "useLineColorForBulletBorder": true,
        "valueField": "studybox",
        "balloonText": "<span style='font-size:12px;'>Studybox</span>"
    },{
        "valueAxis": "euTenhoVoz",
        "id": "g13",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#9b59b6",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Eu Tenho Voz",
        "useLineColorForBulletBorder": true,
        "valueField": "euTenhoVoz",
        "balloonText": "<span style='font-size:12px;'>Eu Tenho Voz</span>"
    },{
        "valueAxis": "captaqui",
        "id": "g14",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#e74c3c",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Captaqui",
        "useLineColorForBulletBorder": true,
        "valueField": "captaqui",
        "balloonText": "<span style='font-size:12px;'>Captaqui</span>"
    },{
        "valueAxis": "powerUp",
        "id": "g15",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#9b59b6",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "PowerUp",
        "useLineColorForBulletBorder": true,
        "valueField": "powerUp",
        "balloonText": "<span style='font-size:12px;'>PowerUp</span>"
    },{
        "valueAxis": "iteratrack",
        "id": "g16",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "lineColor": "#9b59b6",
        "fillAlphas": 0.2,
        "lineThickness": 2,
        "type": "smoothedLine",
        "title": "Iteratrack",
        "useLineColorForBulletBorder": true,
        "valueField": "iteratrack",
        "balloonText": "<span style='font-size:12px;'>Iteratrack</span>"
    }],









    "chartCursor": {
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
    "dataProvider": data
});


});
