var PALETTE = [
    "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78",
    "#2ca02c", "#98df8a", "#d62728", "#ff9896",
    "#9467bd", "#c5b0d5", "#8c564b", "#c49c94",
    "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7",
    "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];

var PRIMARY_PALETTE = {
    normal: '#96C0F6',
    error: '#FA9D99',
    1: '#9CA95F',
    2: '#567BA9',
    3: '#AA6F68',
    4: '#8568A8',
    5: '#F38531',
    6: '#22AA99'
};

var SECONDARY_PALETTE = ['#00FFFF', '#F0F8CA', '#99413D', '#FF9900', '#3B3EAC', '#D9CCA7', '#FF5558'];


var COLORS = {
    'BottomGaugeText': '#ofa1ea',
    'GaugeDefaultText': '#808185',
    'GaugeRedText': '#FF5558',
};


(function () {
    // "use strict";
    var THIS = this;
    var ln;
    var config = {};

    var RED = PRIMARY_PALETTE.error;    //'#F3A49B';
    var YELLOW = PRIMARY_PALETTE[5];    //'#FFC656';
    var GREEN = PRIMARY_PALETTE.normal; //'#74C153';

    /** green/orange/red */
    var GAUGE_COLORS = [RED, YELLOW, GREEN];

    function thresholdDefaults() {
        config.boardThreshold = config.boardThreshold || [65, 80];
        config.oeeThreshold = config.oeeThreshold || [65, 80];
        config.oeeQualityThreshold = config.oeeQualityThreshold || [65, 80];
        config.placementThreshold = config.placementThreshold || [90, 95];
    }

    UserConfigService.load().then(function (data) {
        config = data.reports.dashboard;
        thresholdDefaults();
    }, function (err) {
        console.error(err);
        thresholdDefaults();
    });

    /*
     * This method is used to render the Lines screen
     *  @param element = element to render the Lines Screen
     */

    this.Lines.LinesView = function (element) {
        this.element = element;
        // Get the HTML file for Lines screen
        this.VIEW_CONTENT_FILE = "../../configuration/html/" + Locale + "/lines.html";
        var htmlString = THIS.FileCache.get(this.VIEW_CONTENT_FILE);

        this.element.append(htmlString);
        // Register all event listeners on Lines Screen
        this.registerListeners();
        ln = this;

        this.headerModel = new PanaCIM.LC.Framework.HeaderModel();
        /*
         * Search Parameters to be provided at the time of
         * calling the search control
         */
        this.tileClicked = "oeeeTile";
        this.graphList = [];
        this.tableData = [];
        this.SearchMetadata = {
            radioButtonData: [Resources.idThis, Resources.idLast],
            sliderData: ["idSliderCustom", "idSliderHour", "idSliderDay", "idSliderWeek", "idSliderMonth", "idSliderQuarter", "idSliderAll"]
                .map(function (n) {
                    return Resources[n];
                }),
            customIndex: 0,
            dateTimeData: {'frequency': 4}
        };

        this.autorefresh = {mins: 0};
        this.searchMap = {
            'oee': ['chartdiv1', 'chartdiv2'],
            'placement': ['chartdiv4', 'chartdiv4_2'],
            'board': ['chartdiv6', 'chartdiv7'] //'error': []
        };
        this.fps = {};
        this.dds = Array(2); //array of 2: current and previous fps.

        this.SearchMetadata.searchData = [
            {
                'placeholder': Resources.idLines,
                'service': "GET_ROUTES",
                'label': 'Lines',
                'type': 'STRING'
            },
            {
                'placeholder': Resources.idProduct,
                'service': "GET_PRODUCT_SEARCH_DATA",
                'label': 'Product',
                'type': 'STRING'
            },
            {
                'placeholder': 'Equipment',
                'service': "GET_MACHINE_SEARCH_DATA",
                'label': 'Equipment',
                'type': 'STRING'
            },
            {
                'placeholder': 'Part Number',
                'service': "GET_PART_SEARCH_DATA",
                'label': 'PartNumber',
                'type': 'STRING'
            },
            {
                'placeholder': 'Reel Barcode',
                'service': "GET_REEL_BARCODE_SEARCH_DATA",
                'label': 'ReelBarcode',
                'type': 'STRING'
            },
            {
                'placeholder': 'Feeder',
                'service': "GET_FEEDER_BARCODE_SEARCH_DATA",
                'label': 'Feeder',
                'type': 'STRING'
            }
        ];

        //path for Line service
        this.LINE_SERVICE = "lines/getLinesData";

        //Details of service and model to get OEE Chart Data
        this.PA_DASHBOARD_OEE_PARAMS = {
            model: "PA_DASHBOARD_OEE",
            data: null,
            service: this.LINE_SERVICE
        };

        //Details of service and model to get Placement ratio data
        this.PA_DASHBOARD_PLACEMENT_RATIO_PARAMS = {
            model: "PA_DASHBOARD_PLACEMENT_RATIO",
            data: null,
            service: this.LINE_SERVICE
        };

        //Details of service and model to get Board Data
        this.PA_DASHBOARD_BOARDS_PARAMS = {
            model: "PA_DASHBOARD_BOARDS",
            data: null,
            service: this.LINE_SERVICE
        };

        // Details of service and model to get Error information
        this.PA_DASHBOARD_ERRORS_PARAMS = {
            model: "PA_DASHBOARD_ERRORS",
            data: null,
            service: this.LINE_SERVICE
        };

        this.GET_FILTER_VALUES = "getFilterValues";

        /* Container to render the search controls */
        this.SEARCH_CONTROLS_DIV = $("#searchControls");

        this.START_DATE_VALUE = ".lines #startdate";
        this.START_TIME_VALUE = ".lines #starttime";
        this.END_DATE_VALUE = ".lines #enddate";
        this.END_TIME_VALUE = ".lines #endtime";
        this.TIME_SELECTORS = '.lines #startdate, .lines #starttime, .lines #enddate, .lines #endtime';
        this.SLIDER_SELECTOR = 'input #slider';
        this.SLIDER_TEXT = ".trace-report #slidertext";
        this.RADIO_BUTTON = ".trace-report #radioDiv input[type='radio']";
        this.CUSTOM_TEXT = Resources["idSliderCustom"];
        this.SEARCH_FILTER_SELECTORS = 'input.searchFilters';

        this.OEE_ATTRIBUTES = {
            "OEE": {"hidden": false},
            "PERFORMANCE": {"hidden": false},
            "AVAILABILITY": {"hidden": false},
            "QUALITY": {"hidden": false}
        }

        // initialize object of Trace model
        this.LINE_MODEL = new THIS.Lines.OEE();

        /*render the view */
        this.renderView();
    };

    this.Lines.LinesView.prototype = {

        // method to render the searchcontrols and gridcontrol
        renderView: function () {
            var self = this;
            this.shifts = this.LINE_MODEL.getShiftNames();
            $("span[id^='idShift']").text('');
            $("input[id^='shiftInput']").removeAttr('checked');

            for (var i in this.shifts) {
                var shiftSpanId = parseInt(i) + 1;
                $("#idShift" + shiftSpanId.toString()).text(this.shifts[i]['shift_name']);
                $("input#shiftInput" + i.toString()).attr('name', this.shifts[i]['shift_name']);
            }

            this.SEARCH_CONTROLS_DIV.SearchFilter(this.SearchMetadata);

            THIS.showLoading();
            setTimeout(function () {
                // Bind event listeners once Search Controls Have been Rendered in DOM
                this.registerListeners();
                this.addListenerConfiguration();
                THIS.removeLoading();
            }.bind(this), 1);
        },

        getActualVal: function (percent) {
            if (percent > 100) {
                percent = 100;
            }
            if (percent < 0) {
                percent = 0;
            }
            return (parseFloat(percent / 100) * 80);
        },

        loadingOn: function () {
            window.parent.postMessage({cmd: 'loadingOn'}, "*");
        },

        loadingOff: function () {
            window.parent.postMessage({cmd: 'loadingOff'}, "*");
        },

        //drawing gauge chart
        // Params:
        // @value - value from range [0-100]
        // @thresholds - array of 2 thresholds : {0-thresholds[0]} - first color, {thresholds[0]-thresholds[1]} - second color {thresholds[1]-100} - third color
        // @innerTextArr - array of strings - text inside gauge, each string - new line (do not use more than 3)
        // @bottomText - text under gauge (may be trancated)
        // @tooltipText - html string to show in tooltip baloon
        // @lessIsBetter - if true - colors order is reversed. Default - red, orange, green, but when lessIsBetter - green, orange, red
        // @doNotTruncateBottom - if true - do not truncate bottom text
        drawgauge2: function (divID, value, thresholds, innerTextArr, bottomText, tooltipText, lessIsBetter, doNotTruncateBottom) {
            var col;
            if (lessIsBetter) {
                col = value < thresholds[0] ? GAUGE_COLORS[2] : value < thresholds[1] ? GAUGE_COLORS[1] : GAUGE_COLORS[0];
            } else {
                col = value < thresholds[0] ? GAUGE_COLORS[0] : value < thresholds[1] ? GAUGE_COLORS[1] : GAUGE_COLORS[2];
            }

            var innerLines = innerTextArr.length;

            var hh = $("#" + divID).height();

            var chart = AmCharts.makeChart(divID, {
                "type": "gauge",
                "theme": "light",
                "autoDisplay": true,
                "autoResize": true,
                "axes": [{
                    "axisAlpha": 0,
                    "tickAlpha": 0,
                    "labelsEnabled": false,
                    "startValue": 0,
                    "endValue": 100,
                    "startAngle": -140,
                    "endAngle": 210,
                    "bottomTextYOffset": 17,
                    "bottomText": (bottomText.length > 10 && !doNotTruncateBottom) ? bottomText.substr(0, 8) + "\u2026" : bottomText,
                    "bottomTextBold": false,
                    "bottomTextFontSize": 12,
                    "bottomTextColor": COLORS.BottomGaugeText,
                    "bands": [{
                        "color": "#eee",
                        "startValue": 0,
                        "endValue": 80,
                        "radius": "100%",
                        "innerRadius": "70%"
                    }, {
                        "color": col,
                        "startValue": 0,
                        "endValue": this.getActualVal(value),
                        "radius": "100%",
                        "backgroundAlpha": 10,
                        "innerRadius": "70%"
                    }],
                }],
                "allLabels": innerTextArr.map(function (txt, i) {
                    return {
                        "text": txt.text,
                        "x": "0%",
                        "y": hh / 2 + i * 12 - innerLines * 6, // <Middle point> - <num of lines> * <half line height> + <current line> * < line height>
                        "size": txt.size || 11,
                        "bold": false,
                        "color": txt.color,
                        "align": "center"
                    }
                }),
                "responsive": {
                    "enabled": true
                },
                "export": {
                    "enabled": true
                }
            });

            var $div = $('#' + divID);
            if ($._data($div[0], 'events') === undefined) {
                $div.mousemove(function (event) {
                    var b = document.getElementById("balloon");
                    b.innerHTML = tooltipText;
                    b.style.display = "block";
                    b.style.top = event.pageY + 'px';
                    b.style.left = event.pageX + 'px';
                });
                $div.mouseleave(function (event) {
                    var b = document.getElementById("balloon");
                    b.innerHTML = "";
                    b.style.display = "none";
                });
            }
        },

        activeTile: function (tileSelector) {
            if (this.currentActiveTile) {
                $(this.currentActiveTile).removeClass("active");
            }
            this.currentActiveTile = tileSelector;
            $(this.currentActiveTile).addClass("active");
        },

        //drawing line chart using amcharts
        drawlineChart: function (dataArray, fieldData) {
            var self = this;

            function handleLegendClick(graph) {
                var chart = graph.chart;
                var attribute = graph.valueField;
                if (self.OEE_ATTRIBUTES[attribute.toUpperCase()]['hidden'] == false) {
                    self.OEE_ATTRIBUTES[attribute.toUpperCase()]['hidden'] = true;
                    chart.hideGraph(graph);
                } else {
                    self.OEE_ATTRIBUTES[attribute.toUpperCase()]['hidden'] = false;
                    chart.showGraph(graph);
                }
                for (var i = 0; i < dataArray.length; i++) {
                    dataArray[i].OEE = 100;
                    if (self.OEE_ATTRIBUTES["Performance".toUpperCase()]['hidden'] == false) {
                        dataArray[i].OEE = dataArray[i].OEE * (dataArray[i].Performance / 100);
                    }
                    if (self.OEE_ATTRIBUTES["Availability".toUpperCase()]['hidden'] == false) {
                        dataArray[i].OEE = dataArray[i].OEE * (dataArray[i].Availability / 100);
                    }
                    if (self.OEE_ATTRIBUTES["Quality".toUpperCase()]['hidden'] == false) {
                        dataArray[i].OEE = dataArray[i].OEE * (dataArray[i].Quality / 100);
                    }
                    dataArray[i].OEE = dataArray[i].OEE.toFixed(2);
                }
                chart.dataProvider = dataArray;
                chart.validateData();
                // return false so that default action is canceled
                return false;
            }

            var graphsarray = [];
            var fieldArray = Object.keys(fieldData);
            for (var i in fieldArray) {
                var graph = {
                    "id": "g" + (i + 1),
                    "balloon": {
                        "adjustBorderColor": false,
                        "horizontalPadding": 10,
                        "verticalPadding": 10,
                        "color": "#96C0F6",
                        "borderColor": "#96C0F6"
                    },
                    "hideBulletsCount": 50,
                    "lineThickness": 3,
                    "title": fieldArray[i],
                    "useLineColorForBulletBorder": true,
                    "valueField": fieldArray[i],
                    "fillColors": "#FFFFFF",
                    "lineColor": fieldData[fieldArray[i]].lineColor,
                    "balloonText": "<span>" + fieldArray[i] + " [[value]]%" + "<br>[[category]]</span>"
                };
                if (fieldData[fieldArray[i]].dashLength != null) {
                    graph["dashLength"] = fieldData[fieldArray[i]].dashLength;
                }
                graphsarray.push(graph);
            }

            if (dataArray.length) {
                var chart = AmCharts.makeChart("oeeLinechartdiv", {
                    "type": "serial",
                    "theme": "light",
                    "marginLeft": 40,
                    "autoMarginOffset": 5,
                    "legend": {
                        "useGraphSettings": true,
                        "position": "right",
                        "marginRight": -20,
                        "markerLabelGap": 5,
                        "equalWidths": true,
                        "clickMarker": handleLegendClick,
                        "clickLabel": handleLegendClick
                    },
                    "valueAxes": [{
                        "id": "v1",
                        "axisAlpha": 0,
                        "position": "left",
                        "ignoreAxisWidth": true
                    }],
                    "balloon": {
                        "borderThickness": 1,
                        "shadowAlpha": 0
                    },
                    "graphs": graphsarray,
                    "chartCursor": {
                        "showHandOnHover": true,
                        "categoryBalloonEnabled": false,
                        "cursorColor": "#258cbb",
                        "oneBalloonOnly": true,
                        "cursorAlpha": 0,
                    },
                    "categoryField": "date",
                    "categoryAxis": {
                        "parseDates": false,
                        "dashLength": 1,
                        "minorGridEnabled": true,
                    },
                    "export": {
                        "enabled": true
                    },
                    "dataProvider": dataArray
                });
            }
        },

        //draw serial chart for placement data
        drawPlacementRatioDrilldownByField: function (componentData, detailField, title) {
            var self = this;
            var threshold = [100 - config.placementThreshold[1], 100 - config.placementThreshold[0]];

            function getDataByField() {
                var ret = [];
                for (var j in componentData) {
                    var placementJSON = {"part": componentData[j][detailField]};
                    placementJSON.lostComponentsRatio = componentData[j].place_ratio == 0 ? 0 : parseFloat((100 - componentData[j].place_ratio).toFixed(2));

                    placementJSON.lostComponentsRatioBad = placementJSON.lostComponentsRatio > threshold[1] ? placementJSON.lostComponentsRatio : 0;
                    placementJSON.lostComponentsRatioWarn = placementJSON.lostComponentsRatio <= threshold[1] && placementJSON.lostComponentsRatio > threshold[0] ? placementJSON.lostComponentsRatio : 0;
                    placementJSON.lostComponentsRatioGood = placementJSON.lostComponentsRatio <= threshold[0] ? placementJSON.lostComponentsRatio : 0;

                    ret.push(placementJSON);
                }
                return ret;
            }

            var placementData = getDataByField();

            title += " (%)";

            var cfg = {
                "type": "serial",
                "theme": "light",
                "titles": [{
                    "text": title,
                    "size": 15,
                    "color": "#777"
                }],
                "dataProvider": placementData,
                "valueAxes": [{
                    "gridAlpha": 0,
                    "stackType": "regular",
                    "position": "left",
                    "color": "rgba(0,0,0,0.7)",
                    "axisColor": "rgba(0,0,0,0.7)"
                }],
                "graphs": [
                    {
                        "balloonText": false,
                        "fillAlphas": 1,
                        "lineAlpha": 0.5,
                        "type": "column",
                        "title": "Lost",
                        "valueField": "lostComponentsRatioBad",
                        "lineColor": RED,
                        "fillColors": RED
                    },
                    {
                        "balloonText": false,
                        "fillAlphas": 1,
                        "lineAlpha": 0.5,
                        "type": "column",
                        "title": "Lost",
                        "valueField": "lostComponentsRatioWarn",
                        "lineColor": YELLOW,
                        "fillColors": YELLOW
                    },
                    {
                        "balloonText": "Lost: [[lostComponentsRatio]] %",
                        "fillAlphas": 1,
                        "lineAlpha": 0.5,
                        "type": "column",
                        "title": "Lost2",
                        "valueField": "lostComponentsRatioGood",
                        "lineColor": GREEN,
                        "fillColors": GREEN
                    }],
                "marginLeft": 0,
                "marginBottom": 0,
                "chartCursor": {
                    "cursorAlpha": 0,
                    "zoomable": false
                },
                "export": {
                    "enabled": true
                },
                "categoryField": "part",
                "categoryAxis": {
                    "balloonText": "[[value]]",
                    "labelFunction": function (valueText, serialDataItem, categoryAxis) {
                        return valueText.length > 8 ? valueText.substr(0, 7) + "\u2026" : valueText;
                    },
                    "labelRotation": 90,
                    "gridPosition": "start",
                    "axisAlpha": 0,
                    "gridAlpha": 0,
                    "position": "left"
                }

            };

            var chart = AmCharts.makeChart("chartdivPlacementRatio", cfg);
            return chart;
        },

        //draw serial chart for placement data
        drawPlacementRatioDrilldown: function () {
            var self = this;

            function getDataByTime(details) {
                var ret = [];
                for (var i in details) {
                    if (details[i].key == 'interval') {
                        var componentData = details[i].details;
                        for (var j in componentData) {
                            var placementJSON = {"time": componentData[j].interval};
                            placementJSON.lostComponents = componentData[j].place_ratio == 0 ? 0 : parseFloat((100 - componentData[j].place_ratio).toFixed(2));
                            ret.push(placementJSON);
                        }
                        break;
                    }
                }
                return ret;
            }

            var placementData = getDataByTime(this.placementRatioData.details);

            var placementInterval = "";
            this.placementRatioData.details.forEach(function (d) {
                if (d.key === 'interval' && d.label) {
                    placementInterval = " by " + d.label;
                }
            });


            placementInterval += " (%)";

            var cfg = {
                "type": "serial",
                "theme": "light",
                "titles": [{
                    "text": "Placement" + placementInterval,
                    "size": 15,
                    "color": "#777"
                }],
                "dataProvider": placementData,
                "valueAxes": [{
                    "gridAlpha": 0,
                    "color": "rgba(0,0,0,0.7)",
                    "axisColor": "rgba(0,0,0,0.7)",
                    "axisAlpha": 1,
                    "position": "left"
                }],
                "graphs": [{
                    "fillAlphas": 1,
                    "lineAlpha": 0.5,
                    "title": "Lost",
                    "valueField": "lostComponents",
                    "lineColor": RED,
                    "fillColors": RED
                }],
                "plotAreaBorderAlpha": 0,
                "marginLeft": 0,
                "marginBottom": 0,
                "chartCursor": {
                    "cursorAlpha": 0,
                    "zoomable": false
                },
                "categoryField": "time",
                "categoryAxis": {
                    "startOnAxis": true,
                    "gridAlpha": 0
                },
                "export": {
                    "enabled": true
                }
            };

            var chart = AmCharts.makeChart("chartdivPlacementRatio", cfg);
            return chart;
        },

        getRandomColor: function () {
            var colorArray = ['#00404d', '#245bff', '#000d33'];
            var color = colorArray[Math.floor(Math.random() * 3)];
            return color;
        },

        //Method to be called to draw boards graph as stacked column chart
        drawBoardsChartDrilldown: function (dataArray, keys) {
            var graphdata = [];
            for (var i = 0; i < keys.length; i++) {
                var graphObj = {};
                graphObj = {
                    "balloonText": "<b>[[title]]</b><br><span style='font-size:14px'>[[category]]: <b>[[value]]</b></span>",
                    "fillAlphas": 0.8,
                    "labelText": "[[value]]",
                    "lineAlpha": 0.3,
                    "title": keys[i],
                    "type": "column",
                    "color": "#000000",
                    "valueField": keys[i],
                    "colorField": keys[i] + "color",
                    "lineColorField": keys[i] + "color"
                }
                graphdata.push(graphObj);
            }

            var chart = AmCharts.makeChart("chartdivBoardChart", {
                "type": "serial",
                "theme": "light",
                "dataProvider": dataArray,
                "valueAxes": [{
                    "stackType": "regular",
                    "axisAlpha": 0.3,
                    "gridAlpha": 0
                }],
                "graphs": graphdata,
                "categoryField": "interval",
                "categoryAxis": {
                    "gridPosition": "start",
                    "axisAlpha": 0,
                    "gridAlpha": 0,
                    "position": "left"
                },
                "export": {
                    "enabled": true
                }
            });
        },

        drawErrorCharts: function (errorData, errorNameData) {

            function flatValue(value, formattedValue, valueAxis, type) {
                return value;
            }

            function formatValue(value, formattedValue, valueAxis, type) {
                var timeString = value;
                if (value != '' && value != undefined && value != null && type != 'COUNT') {
                    var t = parseInt(value, 10);
                    t = t < 0 ? 0 : t;
                    var hours = Math.floor(t / 3600);
                    var minutes = Math.floor((t - (hours * 3600)) / 60);
                    var seconds = t - (hours * 3600) - (minutes * 60);
                    hours = hours < 10 ? "0" + hours : hours;
                    minutes = minutes < 10 ? "0" + minutes : minutes;
                    seconds = seconds < 10 ? "0" + seconds : seconds;
                    timeString = hours + ":" + minutes + ":" + seconds;
                }
                return timeString;
            }


            function formatBalloonTextCount(graphDataItem, graph) {
                return graphDataItem.category + "  " + graphDataItem.values.value;
            }

            function formatBalloonTextDuration(graphDataItem, graph) {
                return graphDataItem.category + "  " + formatValue(graphDataItem.values.value, 'DURATION');
            }

            var intervalJSON = {};
            for (var i in errorData) {
                intervalJSON[errorData[i].Time] = errorData[i].Time;
            }
            var intervalList = Object.keys(intervalJSON).sort();
            var errorList = Object.keys(errorNameData).sort();

            var charts = {};

            ['DURATION', 'COUNT'].forEach(function (type) {
                var dataArray = [];
                var graphArray = [];
                var maxDuration = 0;

                for (var i in intervalList) {
                    var objDict = {};
                    objDict['category'] = intervalList[i];
                    for (var j in errorList) {
                        var errorObject = errorData.filter(function (v) {
                            return v.Time == intervalList[i] && v.ErrorType == errorList[j];
                        });
                        if (errorObject.length !== 0) {
                            if (type == 'COUNT') {
                                objDict[errorList[j]] = errorObject[0].ErrorCount;
                            } else if (type === 'DURATION') {
                                objDict[errorList[j]] = errorObject[0].Duration;
                                if (objDict[errorList[j]] > maxDuration) {
                                    maxDuration = objDict[errorList[j]];
                                }
                            }
                        } else {
                            objDict[errorList[j]] = 0;
                        }
                        if (i == 0) {
                            var title = '';
                            if (type == 'COUNT') {
                                title = errorList[j] + " " + errorNameData[errorList[j]].error_count + " " + errorNameData[errorList[j]].error_count_ratio + "%";
                            } else if (type == 'DURATION') {
                                title = errorList[j] + " " + this.convertToTime(errorNameData[errorList[j]].error_time) + " " + errorNameData[errorList[j]].error_time_ratio + "%";
                            }
                            var graphdict = {
                                "fillAlphas": 0.3,
                                "title": title,
                                "bullet": "round",
                                "valueField": errorList[j],
                                "balloonFunction": type === 'COUNT' ? formatBalloonTextCount : formatBalloonTextDuration,
                            };
                            graphArray.push(graphdict)
                        }
                    }
                    dataArray.push(objDict);
                }


                var valAxis = {
                    "gridType": "lines",
                    "minimum": 0,
                    "autoGridCount": true,
                    "axisAlpha": 0.2,
                    "fillAlpha": 0.05,
                    "fillColor": "#FFFFFF",
                    "gridAlpha": 0.08,
                    "position": "left",
                    "integersOnly": true,
                    "labelFunction": type == 'COUNT' ? flatValue : formatValue,
                }

                /*
                 * Below logic is to hard code the values on Value Axis of Duration Chart
                 * By default it shows random values on axis like "00:16:40", "00:33:20" etc
                 * But with this logic it will show value like "00:10:00","00:20:00"
                 */
                if (type == 'DURATION') {
                    var maximum = 0;
                    var useGuide = true;

                    if (maxDuration <= 360) {         // if value < 6 min - 2 mins gap in each axis
                        maximum = 720;
                    } else if (maxDuration <= 720) {   // if value < 12 min - 2 mins gap in each axis
                        maximum = 720;
                    } else if (maxDuration <= 1800) {  // if value < 30 min - 5 mins gap in each axis
                        maximum = 1800;
                    } else if (maxDuration <= 3600) {  // if value < 60 min - 10 mins gap in each axis
                        maximum = 3600;
                    } else if (maxDuration <= 5400) {  // if value < 90 min - 15 mins gap in each axis
                        maximum = 5400;
                    } else if (maxDuration <= 10800) {  // if value < 3 hrs - 30 mins gap in each axis
                        maximum = 10800;
                    } else if (maxDuration <= 21600) {  // if value < 6 hrs - 1 hr gap in each axis
                        maximum = 21600;
                    } else if (maxDuration <= 43200) { // if value < 12 hr - 2 hrs gap in each axis
                        maximum = 43200;
                    } else if (maxDuration <= 86400) { // if value < 24 hr - 4 hrs gap in each axis
                        maximum = 86400;
                    } else if (maxDuration <= 172800) {  // if value < 2 days - 8 hrs gap in each axis
                        maximum = 172800;
                    } else if (maxDuration <= 259200) {  // if value < 3 days - 12 hrs gap in each axis
                        maximum = 259200;
                    } else {
                        maximum = maxDuration;             // else will work as default
                    }
                    if (useGuide == true) {
                        valAxis.labelsEnabled = false;
                        var errorGuide = [];
                        for (var i = 1; i <= 6; i++) {
                            var guideJSON = {};
                            guideJSON.value = parseInt(maximum * i / 6);
                            guideJSON.label = formatValue(parseInt(maximum * i / 6));
                            errorGuide.push(guideJSON);
                        }
                        valAxis.maximum = maximum;
                        valAxis.guides = errorGuide;
                    }

                }

                var id = type === 'COUNT' ? 'chartDivErrors1' : 'chartDivErrors2';
                charts[type] = AmCharts.makeChart(id, {
                    "type": "radar",
                    "theme": "light",
                    "dataProvider": dataArray,
                    "valueAxes": [valAxis],
                    "startDuration": 0,
                    "graphs": graphArray,
                    "categoryField": "category",
                    "export": {
                        "enabled": true
                    }
                });
            });

            var legendDiv = $("#drillDownErrorLegends");
            legendDiv.empty();
            var tbl = $(`<table style='width:100%'>
            <tr>
                <th></th>
                <th>Category</th>
                <th>Count</th>
                <th>Count %</th>
                <th>Duration</th>
                <th>Duration %</th>
                </tr>
            </table>`).appendTo(legendDiv);
            var cntChart = charts['COUNT'];
            for (var i in cntChart.graphs) {
                var value = cntChart.graphs[i].valueField;
                var color = cntChart.colors[i];

                var tr = $("<tr count=${i} class='legend-item'></tr>").appendTo(tbl);

                $(`<td><div class='legend-marker' style='background:${color}'></td>`).appendTo(tr);
                $(`<td class="category">${value}</td>`).appendTo(tr);
                var errCount = errorNameData[value].error_count;
                var errRatio = errorNameData[value].error_count_ratio;
                $(`<td>${errCount}</td>`).appendTo(tr);
                $(`<td>${errRatio}%</td>`).appendTo(tr);
                var errTime = this.convertToTime(errorNameData[value].error_time);
                var errTimeRatio = errorNameData[value].error_time_ratio;
                $(`<td>${errTime}</td>`).appendTo(tr);
                $(`<td>${errTimeRatio}%</td>`).appendTo(tr);

                tr.off('click').on('click', function () {
                    var item = $(this).attr('count')
                    if ($(this).hasClass('remove')) {
                        $(this).removeClass('remove');
                        charts['COUNT'].showGraph(charts['COUNT'].graphs[item]);
                        charts['DURATION'].showGraph(charts['DURATION'].graphs[item]);
                    } else {
                        $(this).addClass('remove');
                        charts['COUNT'].hideGraph(charts['COUNT'].graphs[item]);
                        charts['DURATION'].hideGraph(charts['DURATION'].graphs[item]);
                    }
                })
            }

        },
        longCall(context, f, params) {
            THIS.showLoading();
            setTimeout(function () {
                f.apply(context, params);
                THIS.removeLoading();
            }, 0);
        },

        //load data in different tiles like OEE, Placement, Board, Error
        loadChartDataOEE: function (callback) {
            me = this;

            //OEE
            this.LINE_MODEL.getOEEGraphData(this.PA_DASHBOARD_OEE_PARAMS.model, this.filterParams, this.PA_DASHBOARD_OEE_PARAMS.service, function (err, result) {

                $("#chartdiv, #chartdiv1, #chartdiv2").empty();

                if (result === null) {
                    THIS.removeLoading();
                    return;
                }
                me.OEEData = result;

                if (me.OEEData.details && Array.isArray(me.OEEData.details)) {
                    me.searchWorstDetails('oee', me.OEEData.details);
                }

                var percentage = parseFloat(me.OEEData.average_availability == null ? 0 : me.OEEData.average_availability);

                var gaugeBalloonText = `Average<br>Value - ${percentage}%`;

                me.drawgauge2("chartdiv", percentage, config.oeeThreshold, [{
                    text: percentage + "%",
                    color: COLORS.GaugeDefaultText,
                    size: 12
                }], "Average", gaugeBalloonText);

                if (me.OEEData.details != null) {
                    if (me.OEEData.details.length > 0) {
                        var worstElement1 = me.OEEData.details[0];
                        var minOEEIndex = worstElement1.min_oee_index;
                        var worstPercentage1 = worstElement1.min_oee;
                        var worstElementKey1 = worstElement1.name;
                        var worstElementType1 = worstElement1.label;
                        var worstElementLabel1 = worstElement1.min_oee_key;

                        var gaugeBalloonText = `${worstElementType1} - ${worstElementLabel1}<br>Value - ${worstPercentage1}%`;
                        me.drawgauge2("chartdiv1", worstPercentage1, config.oeeThreshold, [{
                            text: worstPercentage1 + "%",
                            color: COLORS.GaugeDefaultText
                        }], worstElementLabel1, gaugeBalloonText);
                    }
                    if (me.OEEData.details.length > 1) {
                        var worstElement2 = me.OEEData.details[1];
                        var minOEEIndex = worstElement2.min_oee_index;
                        var worstPercentage2 = worstElement2.min_oee;

                        var worstElementKey2 = worstElement2.name;
                        var worstElementType2 = worstElement2.label;
                        var worstElementLabel2 = worstElement2.min_oee_key;

                        var gaugeBalloonText = `${worstElementType2} - ${worstElementLabel2}<br>Value - ${worstPercentage2}%`;
                        me.drawgauge2("chartdiv2", worstPercentage2, config.oeeThreshold, [{
                            text: worstPercentage2 + "%",
                            color: COLORS.GaugeDefaultText
                        }], worstElementLabel2, gaugeBalloonText);
                    }

                }
                if (me.tileClicked == 'oeeeTile') {
                    $('#' + me.tileClicked).click();
                }

                me.setClickEvents('chartdiv1', 'chartdiv2');

                callback();
            });

        },

        loadChartDataPlacement: function (callback) {
            var me = this;
            //Placement Ratio
            this.LINE_MODEL.getOEEGraphData(this.PA_DASHBOARD_PLACEMENT_RATIO_PARAMS.model, this.filterParams, this.PA_DASHBOARD_PLACEMENT_RATIO_PARAMS.service, function (err, result) {
                $("#chartdiv3, #chartdiv4, #chartdiv4_2").empty();

                if (result === null) {
                    THIS.removeLoading();
                    return;
                }

                me.placementRatioData = result;

                if (me.placementRatioData.details && Array.isArray(me.placementRatioData.details)) {
                    me.searchWorstDetails('placement', me.placementRatioData.details);
                }

                var percentage = me.placementRatioData.average_place_ratio == null ? 0 : me.placementRatioData.average_place_ratio;
                var gaugeBalloonText = `Average<br>Value - ${percentage}%`;

                me.drawgauge2("chartdiv3", percentage, config.placementThreshold, [{
                    text: percentage + "%",
                    color: COLORS.GaugeDefaultText,
                    size: 12
                }], "Average", gaugeBalloonText);

                if (me.placementRatioData.details != null) {
                    if (me.placementRatioData.details.length > 0) {
                        var worst1_element = me.placementRatioData.details[0];
                        var min_index = worst1_element.min_index;
                        if (min_index != null) {
                            var worst1_percentage = worst1_element.details[min_index].place_ratio;
                            var key = worst1_element.key;
                            var type = worst1_element.label || "";
                            var element = worst1_element.details[min_index][key] || "";

                            var gaugeBalloonText = `${type} - ${element}<br>Value - ${worst1_percentage}%`;
                            me.drawgauge2("chartdiv4", worst1_percentage, config.placementThreshold, [{
                                text: worst1_percentage + "%",
                                color: COLORS.GaugeDefaultText
                            }], element, gaugeBalloonText);
                        }
                    }

                    if (me.placementRatioData.details.length > 1) {
                        var worstElement2 = me.placementRatioData.details[1];
                        var minIndex = worstElement2.min_index;
                        if (minIndex != null && worstElement2.details != null) {
                            var worstPercentage2 = worstElement2.details[minIndex].place_ratio;
                            var worstKey2 = worstElement2.key;
                            var worstType2 = worstElement2.label;
                            var worstElementLabel2 = worstElement2.details[minIndex][worstKey2];

                            var gaugeBalloonText = `${worstType2} - ${worstElementLabel2}<br>Value - ${worstPercentage2}%`;
                            me.drawgauge2("chartdiv4_2", worstPercentage2, config.placementThreshold, [{
                                text: worstPercentage2 + "%",
                                color: COLORS.GaugeDefaultText
                            }], worstElementLabel2, gaugeBalloonText);
                        } else {
                            me.drawgauge2("chartdiv4_2", 0, config.placementThreshold, [{
                                text: "0%",
                                color: COLORS.GaugeDefaultText
                            }], "", "0%");
                        }
                    }
                }

                if (me.tileClicked == 'placementTile') {
                    $('#placementTile').click();
                }

                me.setClickEvents('chartdiv4', 'chartdiv4_2');

                callback();

            });
        },

        loadChartDataBoard: function (callback) {
            var me = this;
            //Boards
            this.LINE_MODEL.getOEEGraphData(this.PA_DASHBOARD_BOARDS_PARAMS.model, this.filterParams, this.PA_DASHBOARD_BOARDS_PARAMS.service, function (err, result) {
                if (result === null) {
                    THIS.removeLoading();
                    return;
                }

                me.boardData = result;

                if (me.boardData.details && Array.isArray(me.boardData.details)) {
                    me.searchWorstDetails('board', me.boardData.details);
                }

                var boardCount = me.boardData.total_board_count == null ? 0 : me.boardData.total_board_count;
                var failedBoardCount = me.boardData.total_failed_board_count == null ? 0 : me.boardData.total_failed_board_count;
                var targetBoardCount = me.boardData.total_target_board_count == null ? 0 : me.boardData.total_target_board_count;
                var boardPercentage = targetBoardCount === 0 ? 0 : parseFloat((boardCount * 100 / targetBoardCount).toFixed(2));
                var FailedPercentage = targetBoardCount === 0 ? 0 : parseFloat((failedBoardCount * 100 / targetBoardCount).toFixed(2));
                var tooltipText = "Target - " + (targetBoardCount / 1000).toFixed(1) + "k";
                tooltipText += "<br> Board - " + (boardCount / 1000).toFixed(1) + "k";

                var tbc = (targetBoardCount / 1000).toFixed(1) + "k"
                me.drawgauge2("chartdiv5", boardPercentage, config.boardThreshold, [{
                    text: (boardCount / 1000).toFixed(1) + "/" + tbc,
                    color: COLORS.GaugeDefaultText,
                    size: 12
                }, {
                    text: failedBoardCount,
                    color: COLORS.GaugeRedText,
                    size: 12
                }], 'Total', tooltipText);

                if (me.boardData.details != null && me.boardData.details.length > 0) {
                    var boardCount0 = me.boardData.details[0].board_count == null ? 0 : me.boardData.details[0].board_count;
                    var failedBoardCount0 = me.boardData.details[0].failed_board_count == null ? 0 : me.boardData.details[0].failed_board_count;
                    var targetBoardCount0 = me.boardData.details[0].target_board_count == null ? 0 : me.boardData.details[0].target_board_count;
                    var boardPercentage0 = parseFloat((boardCount0 * 100 / targetBoardCount0).toFixed(2));
                    var FailedPercentage0 = parseFloat((failedBoardCount0 * 100 / targetBoardCount0).toFixed(2));
                    var boardRationKey0 = me.boardData.details[0].board_ratio_key;

                    var tooltipText = me.boardData.details[0].label + " - " + boardRationKey0;
                    tooltipText += "<br>Target - " + (targetBoardCount0 / 1000).toFixed(1) + "k";
                    tooltipText += "<br> Board - " + (boardCount0 / 1000).toFixed(1) + "k";
                    tooltipText += "<br> Failed - " + failedBoardCount0;

                    var tbc = (targetBoardCount0 / 1000).toFixed(1) + "k";
                    me.drawgauge2("chartdiv6", boardPercentage0, config.boardThreshold, [{
                        text: (boardCount0 / 1000).toFixed(1) + "/" + tbc,
                        color: COLORS.GaugeDefaultText
                    }, {
                        text: failedBoardCount0,
                        color: COLORS.GaugeRedText
                    }], boardRationKey0, tooltipText);
                }

                if (me.boardData.details != null && me.boardData.details.length > 1) {
                    var boardCount1 = me.boardData.details[1].board_count == null ? 0 : me.boardData.details[1].board_count;
                    var failedBoardCount1 = me.boardData.details[1].failed_board_count == null ? 0 : me.boardData.details[1].failed_board_count;
                    var targetBoardCount1 = me.boardData.details[1].target_board_count == null ? 0 : me.boardData.details[1].target_board_count;
                    var boardPercentage1 = parseFloat((boardCount1 * 100 / targetBoardCount1).toFixed(2));
                    var FailedPercentage1 = parseFloat((failedBoardCount1 * 100 / targetBoardCount1).toFixed(2));
                    var boardRationKey1 = me.boardData.details[1].board_ratio_key;

                    var tooltipText = me.boardData.details[1].label + " - " + boardRationKey1;
                    tooltipText += "<br>Target - " + (targetBoardCount1 / 1000).toFixed(1) + "k";
                    tooltipText += "<br> Board - " + (boardCount1 / 1000).toFixed(1) + "k";
                    tooltipText += "<br> Failed - " + failedBoardCount1;

                    var tbc = (targetBoardCount1 / 1000).toFixed(1) + "k";
                    me.drawgauge2("chartdiv7", boardPercentage1, config.boardThreshold, [{
                        text: (boardCount1 / 1000).toFixed(1) + "/" + tbc,
                        color: COLORS.GaugeDefaultText
                    }, {
                        text: failedBoardCount1,
                        color: COLORS.GaugeRedText
                    }], boardRationKey1, tooltipText);
                }
                if (me.tileClicked == 'boardsTile') {
                    $('#' + me.tileClicked).click();
                }

                me.setClickEvents('chartdiv6', 'chartdiv7');

                callback();
            });
        },

        loadChartDataError: function (callback) {
            var me = this;
            //Error
            this.LINE_MODEL.getOEEGraphData(this.PA_DASHBOARD_ERRORS_PARAMS.model, this.filterParams, this.PA_DASHBOARD_ERRORS_PARAMS.service, function (err, result) {
                if (result === null) {
                    THIS.removeLoading();
                    return;
                }

                me.errorData = result;

                // No need:
                // if (me.errorData.details && Array.isArray(me.errorData.details)) {
                //     me.searchWorstDetails('error', me.errorData.details);
                // }

                var details = me.errorData.details;
                var totalPercentage = me.errorData.total_error_ratio == null ? 0 : me.errorData.total_error_ratio;
                $('#TotalErrors').width(totalPercentage + '%');
                $('#TotalErrorsText').html(totalPercentage + '%');

                var maxErrorRatioIndex = me.errorData.max_error_ratio_index;
                if (maxErrorRatioIndex != null) {
                    var worstPercentage = details[maxErrorRatioIndex].max_error_ratio == null ? 0 : details[maxErrorRatioIndex].max_error_ratio;
                    $('#TotalWorstErrors').width(worstPercentage + '%');
                    $('#TotalWorstErrorsText').html(worstPercentage + '%');
                }

                var durationPercentage = me.errorData.total_error_average == null ? 0 : me.errorData.total_error_average;
                var maxErrorAverageIndex = me.errorData.max_error_average_index;
                var worstDurationPercentage = 0;
                if (maxErrorAverageIndex != null) {
                    var worstDurationPercentage = details[maxErrorAverageIndex].max_error_average == null ? 0 : details[maxErrorAverageIndex].max_error_average;
                }

                var maxDurWorst = Math.max(durationPercentage, worstDurationPercentage);

                $('#DurationErrors').width(Math.floor(durationPercentage / maxDurWorst * 100) + '%');
                $('#DurationErrorsText').html(me.convertToTime(durationPercentage));

                if (maxErrorAverageIndex != null) {
                    $('#DurationWorstErrorsText').html(me.convertToTime(worstDurationPercentage));
                    $('#DurationWorstErrors').width(Math.floor(worstDurationPercentage / maxDurWorst * 100) + '%');
                }
                if (me.tileClicked == 'errorsTile') {
                    $('#errorsTile').click();
                }
                callback();
            })
        },

        convertToTime: function (value) {
            var timeString = value;
            if (value != '' && value != undefined && value != null) {
                var t = parseInt(value, 10);
                t = t < 0 ? 0 : t;
                var hours = Math.floor(t / 3600);
                var minutes = Math.floor((t - (hours * 3600)) / 60);
                var seconds = t - (hours * 3600) - (minutes * 60);
                var tmToShow = [];
                timeString = "";
                if (hours > 0) {
                    timeString += (hours < 10 ? "0" + hours : hours) + " h ";
                }
                if (hours > 0 || minutes > 0) {
                    timeString += (minutes < 10 ? "0" + minutes : minutes) + " m ";
                }
                timeString += (seconds < 10 ? "0" + seconds : seconds) + " s";
                // minutes = minutes < 10 ? "0" + minutes : minutes;
                // seconds = seconds < 10 ? "0" + seconds : seconds;
                // timeString = tmToShow.join(" ") //hours + ":" + minutes + ":" + seconds;
            }
            return timeString;
        },

        searchWorstDetails: (function () {
            var worst2Details = {};
            return function (groupId, details) {
                if (details) {
                    worst2Details[groupId] = details.slice(0, 2);
                }
                else {
                    return worst2Details;
                }
            }
        }()),

        /**
         * e.g:
         * Product: obj.min_oee_key,  Lines: obj.min_oee_key
         * TODO:
         */
        updatefps: function (obj, type) {
            // dds[0]: current .fps status
            // dds[1]: previous .fps status
            this.dds[1] = jQuery.extend(true, {}, this.fps);
            switch (type) {
                case 1:
                    Object.assign(this.fps, obj);
                    break;
                case 2:
                    var key = Object.keys(obj)[0];
                    var value = obj[key];
                    this.fps.advanceSearchValues[key] += value + ', ';
                    break;
                case 3:
                    var shift = obj.shift;
                    if (this.fps.shifts.indexOf(shift) === -1) {
                        this.fps.shifts.push(shift);
                    }
                    break;
                default:
                    console.error('updatefps: ', obj);
            }
            this.dds[0] = this.fps;
            return this.fps;
        },

        // input: chartdiv2, 'product_name'
        deletefps: function (divId, text) {
            var owd = this.getJson(divId);
            var obj = owd[1];
            var fps = me.fps;

            if (obj.name === 'interval' || obj.key === 'interval') {
                fps["range"] = obj.label;
                fps["startDateTime"] = obj.details[0].start_time;
                fps["endDateTime"] = obj.details[0].end_time;
            }
            else if (obj.name === 'shift_name') {
                var shifts = fps.shifts;
                var inx = shifts.indexOf(text);
                shifts.splice(inx, 1);
            }
            else {
                var t = fps.advanceSearchValues[obj.label];
                fps.advanceSearchValues[obj.label] = t.split(',').filter(function (x) {
                    return x !== ' ' && x !== '';
                }).filter(function (m) {
                    return m.indexOf(text.replace('…', '').replace(/\/.*$/, '')) === -1;
                }).join(',')
            }
        },

        getJson: function (divId) {
            var owd = [], inx = -1;
            var swd = this.searchWorstDetails();
            for (var i in this.searchMap) {
                inx = this.searchMap[i].indexOf(divId);
                if (inx !== -1) {
                    owd.push(i, swd[i][inx]);
                    break;
                }
            }
            return owd;
        },

        /**
         * patch: for "VL33A1H6…", return full-string: "VL33A1H63F-N6SB_T"
         */
        getWorst: function (divId, text) {
            var worst = {}, fulltext = '';
            var owd = this.getJson(divId);
            var obj = owd[1];
            switch (owd[0]) { //[oee, detail_ary[chartdiv1]
                case 'oee':
                    if (obj.name === 'interval') {
                        var key = obj.min_oee_key;
                        var interval = obj.details.find(function (d) {
                            return d.interval === key;
                        });
                        worst = {
                            range: obj.label,
                            startDateTime: interval.start_time,
                            endDateTime: interval.end_time
                        }
                        this.updatefps(worst, 1);
                        if (obj.label === 'Month') {
                            fulltext = 'week of ' + text;
                        }
                    }
                    else {
                        if (obj.label === 'Product') {
                            this.updatefps({'Product': obj.min_oee_key}, 2);
                        }
                        else if (obj.label === 'Route') {
                            this.updatefps({'Lines': obj.min_oee_key}, 2);
                        }
                        else if (obj.label === 'Shift') {
                            this.updatefps({shift: obj.min_oee_key}, 3);
                        }
                        else {
                            console.log('[oee] unknown -> ', obj);
                        }
                        if (/…/.test(text)) {
                            fulltext = obj.min_oee_key;
                        }
                    }
                    break;
                case 'placement':
                    if (!(obj.details && Array.isArray(obj.details))) {
                        return;
                    }
                    if (obj.key === 'interval') {
                        var interval = obj.details.find(function (d) {
                            return d.interval === text;
                        });
                        worst = {
                            range: obj.label,
                            startDateTime: interval.start_time,
                            endDateTime: interval.end_time
                        }
                        this.updatefps(worst, 1);
                    }
                    else {
                        if (obj.label === 'Part') {
                            this.updatefps({'PartNumber': obj.details[0][obj.key]}, 2);
                        }
                        else if (obj.label === "Route") {
                            this.updatefps({'Lines': obj.details[0][obj.key]}, 2);
                        }
                        else if (obj.label === "Feeder") {
                            this.updatefps({'Feeder': obj.details[0].feeder_barcode}, 2);
                        }
                        else {
                            // ReelBarcode: obj.details[0].feeder_barcode
                            console.log('[placement] unknown -> ', obj);
                        }
                    }
                    break;
                case 'board':
                    if (obj.name === 'interval') {
                        worst = {
                            range: obj.board_ratio_key,
                            startDateTime: obj.details[0].start_time,
                            endDateTime: obj.details[0].end_time
                        }
                        this.updatefps(worst, 1);
                    }
                    else {
                        if (obj.label === 'Product') {
                            this.updatefps({'Product': obj.board_ratio_key}, 2);
                        }
                        else if (obj.label === 'Route') {
                            this.updatefps({'Lines': obj.board_ratio_key}, 2)
                        }
                        else if (obj.label === 'Equipment') {
                            this.updatefps({'Equipment': obj.board_ratio_key}, 2);
                        }
                        else if (obj.label === 'Route') {
                            this.updatefps({'Lines': obj.board_ratio_key}, 2);
                        }
                        else if (obj.label === 'Shift') {
                            this.updatefps({'shift': obj.board_ratio_key}, 3);
                            fulltext = obj.board_ratio_key;
                        }
                        else {
                            console.log('[board] unknown -> ', obj);
                        }
                    }
                    break;
                case 'error':
                    console.log('[error] unknown -> ', obj);
                    break;
                default:
                    console.error(divId, text, obj)
                    throw 'exception in getWorst';
            }

            console.info('%c worst', 'color: red', owd[0], divId, JSON.stringify(this.fps), obj);
            return fulltext ? fulltext : text;
        },

        //test: $._data($('#' + id)[0], 'events').click &&
        //  $._data($('#' + id)[0], 'events').click.delegateCount; //1
        setClickEvents: function () {
            var me = this;
            var args = [].slice.call(arguments);
            args.forEach(function (divID) {
                var $div = $('#' + divID);

                $div.find('text:first').attr('fill', 'blue').css('cursor', 'pointer');

                if ($._data($div[0], 'events')===undefined || $._data($div[0], 'events').click===undefined) {

                    $div.on('click', 'text:first', function (e) {
                        var divId = $(e.delegateTarget).attr('id');
                        var text = $(e.target).text();
                        text = me.getWorst(divId, text);

                        if ($('li.no-selections').is(':visible')) {
                            $('li.no-selections').hide();
                        }
                        if ($('li.clear').is(':hidden')) {
                            $('li.clear').show();
                        }

                        var notexist = true;
                        $('div.gauge-item').find('>span').each(function (i) {
                            if ($(this).text() === text) {
                                notexist = false;
                                $(this).next('button.close').trigger('click');
                            }
                        });
                        if (notexist) {
                            me.selectSingleItem(text, divId);
                            $('#reportsSubmit').trigger('click', {type: 'drilldown'});
                        }
                        e.preventDefault();
                    });
                }
            });
        },

        selectSingleItem: (function () {
            var li = [
                '<li>',
                '   <div class="gauge-item">',
                '       <button type="button" class="close" aria-label="Close">',
                '           <span aria-hidden="true"> ×</span>',
                '       </button>',
                '   </div>',
                '</li>'
            ];
            var li_clear = 'div.lines-selection li.clear';
            return function (text, divId) {
                var s = li.slice(0, 2).concat('<span data-spandiv="' + divId + '">' + text + '</span>', li.slice(2));
                $(s.join('\n')).insertBefore(li_clear);
            }
        })(),

        addListenerConfiguration: function () {
            //setting button click
            var self = this;

            function openDrillDown(title) {
                this.tileClicked = title;
                $('#drillDownContentPlacement').css('display', title == 'placementTile' ? 'block' : 'none');
                $('#drillDownContentError').css('display', title == 'errorsTile' ? 'block' : 'none');
                $('#drillDownContentBoards').css('display', title == 'boardsTile' ? 'block' : 'none');
                $('#drillDownContentOEE').css('display', title == 'oeeeTile' ? 'block' : 'none');
            }

            //click event on OEE Tile to render OEE chart on below screen
            $("#oeeeTile").off("click").on("click", function () {
                openDrillDown("oeeeTile");

                this.activeTile("#oeeeTile .tiles-box");

                $('#oeechart1, #oeechart2, #oeechart3, #oeechart4').empty();


                $("#oeeLinechartdiv").empty();
                var h = $("#oeeLinechartdiv").parent().height() - 120;
                $("#oeeLinechartdiv").css('height', h + 'px');


                var lineChartData = [];
                var details = this.OEEData.details;
                for (var i in details) {
                    if (details[i].name == 'interval') {
                        var chartDetails = details[i].details;
                        for (var j in chartDetails) {
                            var data = {};
                            data['date'] = chartDetails[j].interval; //new Date(chartDetails[j].start_time);
                            data['OEE'] = chartDetails[j].oee;
                            data['Performance'] = chartDetails[j].performance;
                            data['Availability'] = chartDetails[j].availability;
                            data['Quality'] = chartDetails[j].quality;
                            lineChartData.push(data);
                        }
                        break;
                    }
                }
                var fieldData = {
                    'OEE': {'lineColor': '#5f4f4f', 'dashLength': 3},
                    'Performance': {'lineColor': '#567BA9', 'dashLength': null},
                    'Availability': {'lineColor': '#9CA95F', 'dashLength': null},
                    'Quality': {'lineColor': '#8568A8', 'dashLength': null}
                }
                try {
                    this.drawlineChart(lineChartData, fieldData);
                }
                catch (e) {
                    //throw e; //Uncaught TypeError: this.balloon.setBounds is not a function
                    THIS.removeLoading();
                }

                setTimeout(function () {
                    averagePercentage = this.OEEData.average_availability == null ? 0 : this.OEEData.average_availability;
                    this.drawgauge2("oeechart1", averagePercentage, config.oeeThreshold, [{
                        text: averagePercentage + "%",
                        color: COLORS.GaugeDefaultText,
                        size: 12
                    }], "Average", `Average<br>Value - ${averagePercentage}%`, false, true);
                    performancePercentage = this.OEEData.average_performance == null ? 0 : this.OEEData.average_performance;
                    this.drawgauge2("oeechart2", performancePercentage, config.oeeThreshold, [{
                        text: performancePercentage + "%",
                        color: COLORS.GaugeDefaultText,
                        size: 12
                    }], "Performance", `Performance<br>Value - ${performancePercentage}%`, false, true);
                    oeePercentage = this.OEEData.average_oee == null ? 0 : this.OEEData.average_oee;
                    this.drawgauge2("oeechart3", oeePercentage, config.oeeThreshold, [{
                        text: oeePercentage + "%",
                        color: COLORS.GaugeDefaultText,
                        size: 12
                    }], "Availability", `Availability<br>Value - ${oeePercentage}%`, false, true);
                    qualityPercentage = this.OEEData.average_quality == null ? 0 : this.OEEData.average_quality;
                    this.drawgauge2("oeechart4", qualityPercentage, config.oeeQualityThreshold, [{
                        text: qualityPercentage + "%",
                        color: COLORS.GaugeDefaultText,
                        size: 12
                    }], "Quality", `Quality<br>Value - ${qualityPercentage}%`, false, true);
                }.bind(this), 200);
            }.bind(this));

            //click event on Placement Tile to render Placement chart on below screen
            $("#placementTile").off("click").on("click", function () {
                openDrillDown("placementTile");

                this.activeTile("#placementTile .tiles-box");

                var timeData = null;
                var routeData = null;
                var feederData = null;
                var partData = null;

                var labels = this.placementRatioData.labels;
                for (var i in this.placementRatioData.details) {
                    var componentData = this.placementRatioData.details[i];
                    if (componentData.key == "interval") {
                        timeData = componentData.details;
                    }
                    if (componentData.key == "route_name") {
                        routeData = componentData.details;
                    }
                    if (componentData.key == "feeder_barcode") {
                        feederData = componentData.details;
                    }
                    if (componentData.key == "part_no") {
                        partData = componentData.details;
                    }
                }
                var tableMainDiv = $("#tableMainDiv");
                tableMainDiv.empty();
                var spanLeft = $("<span id='spanLeft' style='position:absolute; left:-30px; bottom:30%; visibility:hidden'>&lt;</span>").appendTo(tableMainDiv);

                var tableDiv0 = $("<div id='tableDiv0' style='overflow:auto;width:100%;height:100%' class='currentTable'></div>").appendTo(tableMainDiv);
                var tableDiv1 = $("<div id='tableDiv1' style='overflow:auto;width:100%;height:100%;display:none'></div>").appendTo(tableMainDiv);
                var tableDiv2 = $("<div id='tableDiv2' style='overflow:auto;width:100%;height:100%;display:none'></div>").appendTo(tableMainDiv);
                var tableDiv3 = $("<div id='tableDiv3' style='overflow:auto;width:100%;height:100%;display:none'></div>").appendTo(tableMainDiv);

                var lastTableNum = 3;

                var spanRight = $("<span id='spanRight' style='position:absolute; right:-35px; bottom:30%; '>&gt;</span>").appendTo(tableMainDiv);

                function drawChart() {
                    var currentTable = parseInt($('div[id^=tableDiv].currentTable').attr('id').split('tableDiv')[1]);
                    var chart = null;
                    switch (currentTable) {
                        case 0:
                            chart = self.drawPlacementRatioDrilldown();
                            break;
                        case 1:
                            chart = self.drawPlacementRatioDrilldownByField(feederData, 'feeder_barcode', 'Placement by Feeder');
                            break;
                        case 2:
                            chart = self.drawPlacementRatioDrilldownByField(partData, 'part_no', 'Placement by Part');
                            break;
                        case 3:
                            chart = self.drawPlacementRatioDrilldownByField(routeData, 'route_name', 'Placement by Route');
                            break;
                    }

                    var t = $("#chartdivPlacementRatio > div > div.amcharts-chart-div > svg");
                }

                spanLeft.off('click').on('click', function () {
                    spanRight.css('visibility', 'visible');
                    var tableCounter = parseInt($('div[id^=tableDiv].currentTable').attr('id').split('tableDiv')[1]);
                    if ((tableCounter - 1) < 0) {
                        return false;
                    }
                    $('#tableDiv' + tableCounter).removeClass('currentTable');
                    $('#tableDiv' + tableCounter).hide(200)//attr('display','none');

                    $('#tableDiv' + (tableCounter - 1)).addClass('currentTable');
                    $('#tableDiv' + (tableCounter - 1)).show(200)//attr('display','block');
                    if ((tableCounter - 1) == 0) {
                        spanLeft.css('visibility', 'hidden');
                    }
                    drawChart();
                });

                spanRight.off('click').on('click', function () {
                    spanLeft.css('visibility', 'visible');
                    var tableCounter = parseInt($('div[id^=tableDiv].currentTable').attr('id').split('tableDiv')[1]);
                    if ((tableCounter + 1) > lastTableNum) {
                        return false;
                    }
                    $('#tableDiv' + tableCounter).removeClass('currentTable');
                    $('#tableDiv' + tableCounter).hide(200)//attr('display','none');

                    $('#tableDiv' + (tableCounter + 1)).addClass('currentTable');
                    $('#tableDiv' + (tableCounter + 1)).show(200)//attr('display','block');
                    if ((tableCounter + 1) == lastTableNum) {
                        spanRight.css('visibility', 'hidden');
                    }
                    drawChart();
                });

                function createTableByField(data, tableId, divWrapper) {
                    if (data != null && data.length > 0) {
                        var theTable = $("<table id='" + tableId + "'></table>").appendTo(divWrapper)
                        var headRow = $("<tr></tr>").appendTo(theTable);
                        var keys = Object.keys(data[0]);
                        for (var i in keys) {
                            var header = labels[keys[i]] != undefined ? labels[keys[i]] : keys[i];
                            $("<th>" + header + "</th>").appendTo(headRow);
                        }
                        for (var i in data) {
                            var row = $("<tr></tr>").appendTo(theTable);
                            for (var j in keys) {
                                $("<td>" + data[i][keys[j]] + "</td>").appendTo(row);
                            }
                        }
                    }
                }

                createTableByField(timeData, 'timeTable', tableDiv0);
                createTableByField(feederData, 'feederTable', tableDiv1);
                createTableByField(partData, 'partTable', tableDiv2);
                createTableByField(routeData, 'routeTable', tableDiv3);

                drawChart();
                percentage = this.placementRatioData.average_place_ratio;
                this.drawgauge2("chartDivGauge", percentage, config.placementThreshold, [{
                    text: percentage + "%",
                    color: COLORS.GaugeDefaultText,
                    size: 12
                }], "Average", `Average<br>Value - ${percentage}%`);
            }.bind(this));

            //click event on Board Tile to render Board count chart on below screen
            $("#boardsTile").off('click').on("click", function () {
                openDrillDown("boardsTile");

                this.activeTile("#boardsTile .tiles-box");

                var productBody = $("#productDataTable tbody").empty();
                var boardsDetails = this.boardData.details;
                if (!boardsDetails) {
                    return;
                }
                var productDataArray = [];
                var dataJSON = {};
                var dataArray = [];
                var productGraphData = {};

                var products = boardsDetails.filter((d) => {
                        return d.name === 'product_name'
                    })[0];
                var productDetail = products.details;
                for (var j in productDetail) {
                    var d = productDetail[j];
                    if (d.product_name != null) {
                        var productInfo = {};
                        productInfo['product_name'] = d.product_name;
                        productInfo['setup_name'] = d.setup_name;
                        productInfo['product_side'] = d.product_side;
                        productInfo['board_count'] = d.board_count;
                        productInfo['module_count'] = d.module_count;
                        productInfo['placement_cycle_time'] = d.placement_cycle_time;
                        productInfo['takt_time'] = d.takt_time;
                        productDataArray.push(productInfo);
                    }
                    if (d.product_name != null && d.setup_name != null && d.product_side != null) {
                        var productKey = d.product_name + " " + d.setup_name + " " + d.product_side;
                        productGraphData[productKey] = d.board_count + " " + d.module_count + " " + d.placement_cycle_time + " " + d.takt_time;
                    }
                }

                var interval = boardsDetails.filter((d) => {
                        return d.name === 'interval'
                    })[0];

                var keys = [];
                var col = 0;
                var lastProduct = null;
                var intervalDetails = interval.details;

                var productColors = {};

                for (var j = 0; j < intervalDetails.length; j++) {
                    var d = intervalDetails[j];
                    if (d.product_name != null && d.setup_name != null && d.product_side != null) {
                        var key = d.start_time;
                        if (dataJSON[key] == undefined) {
                            dataJSON[key] = {};
                        }
                        dataJSON[key]['interval'] = d.interval;
                        var product = d.product_name + " " + d.setup_name + " " + d.product_side;
                        var productKey = d.interval + " " + product;
                        keys.push(productKey);
                        dataJSON[key][productKey] = d.board_count;
                        if (!productColors[product]) {
                            if (lastProduct !== product) {
                                col = (col + 1) % PALETTE.length;
                            }
                            lastProduct = product;
                            dataJSON[key][productKey + 'color'] = PALETTE[col];
                            productColors[product] = PALETTE[col];
                        } else {
                            dataJSON[key][productKey + 'color'] = productColors[product];
                        }
                    }
                }

                var dataKeys = Object.keys(dataJSON).sort();
                for (var i = 0; i < dataKeys.length; i++) {
                    var objJSON = {};
                    objJSON.interval = dataJSON[dataKeys[i]].interval;
                    var boardKeys = Object.keys(dataJSON[dataKeys[i]]);
                    var boardJSON = dataJSON[dataKeys[i]];
                    for (var j = 0; j < boardKeys.length; j++) {
                        if (boardKeys[j] != 'interval') {
                            objJSON[boardKeys[j]] = boardJSON[boardKeys[j]];
                        }
                    }
                    dataArray.push(objJSON);
                }
                this.drawBoardsChartDrilldown(dataArray, keys);
                for (var i in productDataArray) {
                    productDataArray[i]['color'] = productColors[productDataArray[i]['product_name'] + " " + productDataArray[i]['setup_name'] + " " + productDataArray[i]['product_side']]
                }

                var cellsrenderer = function (row, column, value, defaultHtml, rowdata) {
                    var element = $(defaultHtml);
                    element.text('');
                    element.css({'background-color': value, 'width': '50%', 'height': '50%', 'margin-top': '25%'});
                    return element[0].outerHTML;
                }
                var gridColumnInfo1 = [
                    {text: '', datafield: 'color', width: 20, cellsrenderer: cellsrenderer},
                    {text: 'Product', datafield: 'product_name', width: 150},
                    {text: 'Setup', datafield: 'setup_name', width: 130},
                    {text: 'Side', datafield: 'product_side', width: 40},
                    {text: 'Board Count', datafield: 'board_count', width: 80},
                    {text: 'Panel Count', datafield: 'module_count', width: 80},
                    {text: 'Target Cycle', datafield: 'placement_cycle_time', width: 80},
                    {text: 'TAKT Time', datafield: 'takt_time', width: 80}
                ]
                $('#productDataTable').FWJGrid().FWJGrid('destroy');
                ($('#productDataTable').FWJGrid({
                    url: null,
                    headerInfo: null,
                    data: productDataArray,
                    requestType: "POST",
                    pageable: false,
                    sortable: true,
                    columnsResize: true,
                    filterable: false,
                    showFilterRow: false,
                    exportable: true,
                    lazyLoad: false,
                    height: '100%',
                    width: '99.5%',
                    heightCorrectionFactor: 18,
                    pageSize: 10,
                    extraHTTPValues: null,
                    columns: gridColumnInfo1,
                    rowClick: null,
                    selectionMode: 'none',
                    exportButtonId: null,
                    printButtonId: null,
                    gridtitle: ''
                }), function () {

                }.bind(this))();
            }.bind(this));

            //click event on Error Tile to render Error chart on below screen
            $("#errorsTile").off('click').on("click", function () {
                openDrillDown("errorsTile");

                this.activeTile("#errorsTile .tiles-box")

                var errorData = this.errorData.details;
                var errorIntervalData = [];
                var errorNameData = {};
                for (var i in errorData) {
                    if (errorData[i].name == 'interval') {
                        var subDetails = errorData[i].details;
                        if (subDetails != null) {
                            for (var j in subDetails) {
                                var errorJSON = {};
                                errorJSON['ErrorType'] = subDetails[j].error_name;
                                errorJSON['Time'] = subDetails[j].interval;
                                errorJSON['ErrorCount'] = subDetails[j].error_count;
                                errorJSON['Duration'] = subDetails[j].error_time;
                                errorIntervalData.push(errorJSON);
                            }
                        }

                    }
                    if (errorData[i].name == 'error_name') {
                        var subDetails = errorData[i].details;
                        if (subDetails != null) {
                            for (var j in subDetails) {
                                errorNameData[subDetails[j].error_name] = {
                                    "error_count_ratio": subDetails[j].error_count_ratio,
                                    "error_time_ratio": subDetails[j].error_time_ratio,
                                    "error_count": subDetails[j].error_count,
                                    "error_time": subDetails[j].error_time,
                                }
                            }
                        }

                    }
                }
                $('#chartDivErrors1').empty();
                $('#chartDivErrors2').empty();

                this.drawErrorCharts(errorIntervalData, errorNameData);
            }.bind(this));

            $('div.lines-selection')
                .on('click', 'div.gauge-item>button.close', function (e) {
                    var $t = $(e.target).closest('li').find('span:first-child');
                    var divId = $t.data('spandiv');
                    var text = $t.html();
                    self.deletefps(divId, text);
                    $(e.target).closest('li').remove();
                    if ($("div.gauge-item").length === 0) {
                        $('li.no-selections').fadeIn(500).show();
                        $('li.clear').hide();
                    }
                    $('#reportsSubmit').trigger('click', {type: 'drilldown'});
                    return false;
                })
                .on('click', 'li.clear', function (e, submitFlag) {
                    $("div.gauge-item").closest('li').remove();
                    $('li.no-selections').fadeIn(200).show();
                    $(this).hide();
                    if (typeof submitFlag === 'undefined') {
                        $('#reportsSubmit').trigger('click', {type: 'reset'});
                    }
                    return false;
                });

            $(document).ready(function () {
                //TODO: remove lastResize.
                $(window).resize(function () {
                    //[ary1,ary2...]=>['chartdiv1', 'chartdiv2',....]
                    self.lastResize = setTimeout(function () {
                        Object.values(self.searchMap).join(',').split(',').forEach(function (div) {
                            $('#' + div).find('text:first').attr('fill', 'blue').css('cursor', 'pointer');
                        });
                    }, 500);
                });

                var $Counter = $('#autoRefreshCounter');
                var $Timer = $('#autoRefreshTimer');
                var $Text = $('#autoRefreshText');

                function countdown(mins) {
                    if (isNaN(mins)) {
                        return;
                    }
                    var seconds = 60;
                    var getHeightPercentage = function (current_minutes, seconds) {
                        var t = (self.autorefresh.mins * 60 - (current_minutes * 60 + seconds)) / (self.autorefresh.mins * 60) * 100;
                        t = Math.floor(t) + '%';
                        //console.log(t, self.autorefresh.mins, current_minutes, seconds);
                        return t;
                    }
                    var Timeout = function () {
                        var timeoutBase = Date.now();
                        var out = {};
                        out.nextTick = function () {
                            return 1000 - (Date.now() - timeoutBase) % 1000;
                        }
                        return out;
                    }.call();

                    function tick() {
                        var current_minutes = mins - 1;
                        seconds--;
                        var format_timer = current_minutes.toString() + ":" + (seconds < 10 ? "0" : "") + String(seconds);
                        $Text.text(format_timer);
                        if (seconds > 0) {
                            self.timeHandler = setTimeout(tick, Timeout.nextTick());
                            var height = getHeightPercentage(current_minutes, seconds);
                            $Timer.css('height', height);
                        } else {
                            if (mins > 1) {
                                countdown(mins - 1);
                                //var height = Math.floor(((self.autorefresh.mins-mins+1)/self.autorefresh.mins) * 100) + '%'
                                //$Text.css('height', height)
                            }
                            else {
                                $('#reportsSubmit').trigger('click', {type: 'refresh'});
                                $Timer.css('height', 0)
                                countdown(self.autorefresh.mins);
                            }
                        }
                    }

                    tick();
                }

                function resetCountdown() {
                    $Counter.addClass('disable-icon');
                    $Timer.removeClass('timer');
                    $Text.text('');
                }

                function hideAutoRefresh() {
                    $('div.counterdown_dialog').hide();
                    $('div.counterdown_loading').hide();
                }

                $('button#autoRefreshButton').off('click').on('click', function () {
                    var mins = parseInt($('input#autoRefreshInput').val());
                    if (mins) {
                        self.autorefresh.mins = mins;
                        $Counter.removeClass('disable-icon');
                        $Timer.addClass('timer');
                        if (self.timeHandler) {
                            clearTimeout(self.timeHandler);
                        }
                        $('#reportsSubmit').trigger('click', {type: 'refresh'});
                        countdown(mins);
                    }
                    else {
                        $Counter.addClass('disable-icon');
                        $Timer.removeClass('timer');
                        $Text.text('');
                        if (self.timeHandler) {
                            clearTimeout(self.timeHandler);
                        }
                    }
                    hideAutoRefresh();
                    return false;
                });

                $('button.autoRefreshStop').click(function () {
                    $Counter.addClass('disable-icon');
                    $Timer.removeClass('timer');
                    $Text.text('');
                    if (self.timeHandler) {
                        clearTimeout(self.timeHandler);
                        self.timeHandler = null;
                    }
                    hideAutoRefresh();
                    return false;
                });

                // click the clock-icon, toggle the dialog-popup.
                $Counter.off('click').on('click', function (e) {
                    var $Dialog = $('div.counterdown_dialog');
                    var $Loading = $('div.counterdown_loading');
                    $Dialog.toggle();
                    if ($Dialog.is(':visible')) {
                        $Loading.show();
                        var $autorefreshInput = $('#autoRefreshInput');
                        if (self.autorefresh.mins) {
                            $autorefreshInput.val(self.autorefresh.mins).trigger('input');
                        }
                        $autorefreshInput.focus();
                    }
                    else {
                        $Loading.hide();
                    }
                });

                $('div.counterdown_loading').off('click').on('click', function (e) {
                    $(".counterdown_dialog").fadeOut();
                    $(this).hide();
                })

                $('#autoRefreshInput').on('input', function (e) {
                    $('button#autoRefreshButton').prop('disabled', parseInt(e.target.value) < 5);
                });

            });
        }, //listener wrapper for events firing on the searchControls.

        registerListeners: function () {
            var self = this;

            //click event on Submit button to render data on different tiles
            $('#reportsSubmit').off('click').on('click', function (e, action) {

                THIS.showLoading();
                if (e.hasOwnProperty('originalEvent')) {
                    if (self.timeHandler) {
                        setTimeout(function () {
                            clearTimeout(self.timeHandler);
                            var mins = self.autorefresh.mins;
                            if (mins) {
                                countdown(mins);
                            }
                            else {
                                resetCountdown();
                            }
                        }, 0);
                    }
                    if ($('li.clear').length > 0) {
                        $('li.clear').trigger('click', false);
                    }
                }

                $('#drillDown').css('display', 'block');
                this.filterParams = this.SEARCH_CONTROLS_DIV.SearchFilter(this.GET_FILTER_VALUES);

                var shifts = $('.shift-checkbox-filter :input:checked');
                var shiftArray = [];
                $.each(shifts, function (v) {
                    shiftArray.push($(shifts[v]).attr('name'));
                });

                this.filterParams.shifts = shiftArray;

                var startDate = new Date(this.filterParams.startDateTime);
                var startDateString = startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
                startDateString += " " + startDate.getHours() + ":" + startDate.getMinutes() + ":" + startDate.getSeconds();
                this.filterParams.startDateTime = startDateString;

                var endDate = new Date(this.filterParams.endDateTime);
                var endDateString = endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + endDate.getDate();
                endDateString += " " + endDate.getHours() + ":" + endDate.getMinutes() + ":" + endDate.getSeconds();
                this.filterParams.endDateTime = endDateString;

                if (e.hasOwnProperty('originalEvent')) {
                    this.fps = jQuery.extend(true, {}, this.filterParams);
                }
                else {
                    var showUpdate = 0;
                    //add extra condition-data to search.
                    if (action) {
                        switch (action.type) {
                            case 'drilldown':
                                showUpdate = 'drilldown';
                                //reference, not clone.
                                this.filterParams = this.fps;
                                break;
                            // TODO: this is for auto-refresh:
                            case 'refresh':
                                showUpdate = 'refresh';
                                this.filterParams.endDateTime = new Date().getFromFormat('yyyy-mm-dd hh:ii:ss');
                                break;
                            case 'reset':
                            default:
                                showUpdate = 'reset';
                                this.fps = jQuery.extend(true, {}, this.filterParams);
                        }
                    }
                }

                console.group('filterParams');
                if (showUpdate === 'drilldown') {
                    console.log('%c drilldown', 'color: green', this.filterParams);
                }
                else if (showUpdate === 'refresh') {
                    console.log('%c autorefresh', 'color: red', this.filterParams);
                }
                else if (showUpdate === 'reset') {
                    console.log('%c reset', 'color: black', this.filterParams);
                }
                else {
                    console.log('%c normal submit', 'color: gray', this.filterParams);
                }
                console.groupEnd('filterParams');

                $('#oeeeTile, #placementTile, #boardsTile, #errorsTile').css('display', 'block');

                var tasks = 4;
                /*
                 *DB request for each chart will be sent 1 after another to decrease db load. This is done by implmenting callback functionality
                 *each db request for next chart will be sent after 500 miliseconds so that previous chart gets time to load data on UI
                 *Above 2 points are mandatory to show data chart by chart otherwise data will be shown only after getting all the data
                 */
                self.loadChartDataOEE(function () {
                    tasks--;
                });
                self.loadChartDataPlacement(function () {
                    tasks--;
                });
                self.loadChartDataBoard(function () {
                    tasks--;
                });
                self.loadChartDataError(function () {
                    tasks--;
                });

                var it = setInterval(function () {
                    if (tasks === 0) {
                        clearInterval(it);
                        THIS.removeLoading();
                    }
                }, 300);

            }.bind(this));

        }
    };

    this.Lines.LinesView.prototype.constructor = this.Lines.LinesView;

}).apply(PanaCIM.LC.Framework);
