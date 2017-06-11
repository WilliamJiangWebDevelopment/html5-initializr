$(document).ready(function () {

    var store = {};
    store.fromDB = {};
    var searchWorstDetails = function (data) {
        if (data) {
            var details = {};
            Object.keys(data).forEach(function (d) {
                details[d] = data[d].details.slice(0, 2);
            });
            store.fromDB = details;
        }
        return store.fromDB;
    }

    var ary = ['oee.json', 'placement.json', 'board.json', 'error.json'].map(function (x) {
        return $.getJSON('./data/' + x);
    });

    var controller = {
        view: '',
        model: ''
    };

    var searchMap = {
        'oee': ['chartdiv1', 'chartdiv2'],
        'placement': ['chartdiv4', 'chartdiv4_2'],
        'board': ['chartdiv6', 'chartdiv7'] //'error': []
    };

    var getJson = function (divId) {
        var owd = [], inx = -1;
        var swd = searchWorstDetails();
        for (var i in searchMap) {
            inx = searchMap[i].indexOf(divId);
            if (inx !== -1) {
                owd.push(i, swd[i][inx]);
                break;
            }
        }
        return owd;
    }

    $('#reportsSubmit').on('click', function (e) {
        //return: data, status, jqXHR
        $.when(ary[0], ary[1], ary[2], ary[3]).done(function (d1, d2, d3, d4) {
            searchWorstDetails({
                'oee': d1[0],
                'placement': d2[0],
                'board': d3[0],
                'error': d4[0]
            });
        });
    });
})
