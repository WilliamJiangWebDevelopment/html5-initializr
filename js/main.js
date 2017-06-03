$(document).ready(function () {

    function createLogger(name) {
        return function (_, a, b) {
            // Skip the first argument (event object) but log the name and other args.
            console.log(name, a, b);
        };
    }

    $.subscribe('foo', createLogger('foo'));
    $.subscribe('foo.bar', createLogger('foo.bar'));

    $.subscribe('oee', function() {
        console.log('oee subscribe -> ', arguments);
        var filter = arguments[1].filter;
        var data = arguments[1].data
    })

    $('input', 'div#advanceSearchDivWrapper').on('blur', function (e) {
        console.log('changed', $(e.target).val())
        $.publish('foo', 1);
        e.preventDefault();
    });

    function getDataFromJSON(jsonFile, callback) {
        $.getJSON(jsonFile)
            .done(function (result) {
                console.log(JSON.stringify(result[0].data));
                callback(result)
            })
            .done(function(result) {
                // save in sessionStore
                pCIMHelper.store.saveState(result);
            })
            .done(function(result) {
                // save in mutable filterObj
                $.publish('oee', result);
            })
            .fail(function (err) {
                throw err;
            })
    }

    function getWorst(od) {
        return {
            minOEEIndex: od.min_oee_index,
            percentage: od.min_oee,
            label: od.min_oee_key
        }
    }

    function loadChartDataOEE(OEEData, next) {

        var oeeAry = ['chartdiv', 'chartdiv1', 'chartdiv2'];

        oeeAry.forEach(function (cdiv) {
            document.getElementById(cdiv).innerHTML = '';
        });

        var od = OEEData[0].data.details;
        var oeeObj = {};
        oeeObj[oeeAry[0]] = {};
        oeeObj[oeeAry[1]] = od[0] ? getWorst(od[0]) : {};
        oeeObj[oeeAry[2]] = od[1] ? getWorst(od[1]) : {};

        console.log(oeeObj)
        // oeeAry.forEach(function (c) {
        //     drawgauge2(
        //         c,
        //         oeeObj[c].percentage,
        //         config.oeeThreshold,
        //         [{text: oeeObj[c].percentage + "%", color: COLORS.GaugeDefaultText}],
        //         oeeObj[c].label,
        //         gaugeBalloonText
        //     )
        // });

        if (next && typeof next === 'function') {
            next(OEEData)
        }

    }

    $('#reportsSubmit').on('click', function (e) {

        getDataFromJSON('data/oee1.json', loadChartDataOEE);

        return false;
    });


    $('#radioDivWrapper').on('click', function (e) {

    });

    $('#sliderDivWrapper').on('click', function (e) {

    });


    $('#dateTimeDivWrapper').on('click', function (e) {

    });
});

