function getActualVal(percent) {
    if (percent > 100) {
        percent = 100;
    }
    if (percent < 0) {
        percent = 0;
    }
    return (parseFloat(percent / 100) * 80);
}

function drawgauge2(divID, value, thresholds, innerTextArr, bottomText, lessIsBetter, doNotTruncateBottom) {

    var GAUGE_COLORS = ['#F3A49B', '#FFC656', '#74C153'];

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
            "bottomTextColor": '#ofa1ea',
            "bands": [{
                "color": "#eee",
                "startValue": 0,
                "endValue": 80,
                "radius": "100%",
                "innerRadius": "70%"
            }, {
                "color": col,
                "startValue": 0,
                "endValue": getActualVal(value),
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
}


function loadChartDataOEE(OEEData, next) {

    var oeeAry = ['chartdiv', 'chartdiv1', 'chartdiv2'];
    var config = thresholdDefaults();
    var colors = getColors();

    oeeAry.forEach(function (cdiv) {
        document.getElementById(cdiv).innerHTML = '';
    });

    var od = OEEData[0].data.details;

    oee2WorstDetails(od);

    //TODO:
    var oeeObj = {};
    oeeObj[oeeAry[0]] = {};
    oeeObj[oeeAry[1]] = od[0] ? getWorst(od[0]) : {};
    oeeObj[oeeAry[2]] = od[1] ? getWorst(od[1]) : {};

    var od0 = {percentage: 50};
    drawgauge2("chartdiv", od0.percentage, config.oeeThreshold,
        [{text: od0.percentage + "%", color: colors.GaugeDefaultText, size: 12}],
        "Average", 'gaugeBalloonText - chartdiv');

    var od1 = oeeObj.chartdiv1;
    defer(0).then(function () {
        return drawgauge2('chartdiv1', od1.percentage, config.oeeThreshold, [{
                text: od1.percentage + "%",
                color: colors.GaugeDefaultText
            }],
            od1.label, 'gaugeBalloonText - chartdiv1');
    }).then(function () {
        setMouse('chartdiv1');
    });

    var od2 = oeeObj.chartdiv2;
    defer(0).then(function () {
        drawgauge2('chartdiv2', od2.percentage, config.oeeThreshold, [{
                text: od2.percentage + "%",
                color: colors.GaugeDefaultText
            }],
            od2.label, 'gaugeBalloonText - chartdiv2')
    }).then(function () {
        setMouse('chartdiv2');
    });

    if (next && typeof next === 'function') {
        next(OEEData)
    }
}

function loadChartDataPlacement() {

}

function loadChartDataBoard() {
}

function loadChartDataError() {
}


