function countdown(mins, counter_id='counter') {
    if (isNaN(mins)) {
        return;
    }
    //mins = parseInt(mins); //"2" to 2
    var counter = document.getElementById(counter_id);
    var seconds = 60;

    function tick() {
        var current_minutes = mins - 1
        seconds--;
        var format_timer = current_minutes.toString() + ":" + (seconds < 10 ? "0" : "") + String(seconds);
        counter.innerText = format_timer; //$(counter).text(format_timer);
        if (seconds > 0) {
            timeHandler = setTimeout(tick, 1000);
        } else {
            if (mins > 1) {
                countdown(mins - 1);
            }
            else {
                console.log('Stop here?', mins, seconds, timeHandler);
                countdown(mins);
            }
        }
    }

    tick();
}
$(document).ready(function () {
    var defaultAR = 'AutoRefresh Setting';
    window.timeHandler = null;

    $('#counter').text(defaultAR);
    $(':input[name="autoRefresh"]', '#ar-form').on('change', function () {
        console.log('radio change: ', $(this).prop('id'), timeHandler);
        if (/enable/.test($(this).prop('id'))) {
            console.log('disable:', timeHandler);
            $('#countdown').fadeIn(500);
            $('#countdown :input').focus();
        }
        else {
            $('#countdown').fadeOut(500);
            console.log('disable:', timeHandler);
            clearTimeout(timeHandler);
            $('#counter').text(defaultAR);
        }
    });
    $(':input[type="text"]', '#countdown').blur(function () {
        var mins = $(this).val();
        console.log('minutes change:', mins, timeHandler);
        clearTimeout(timeHandler);
        countdown(parseInt(mins));
    })
});

var chartData = [
    {date: new Date(2011, 5, 1, 0, 0, 0, 0), val:10},
    {date: new Date(2011, 5, 2, 0, 0, 0, 0), val:11},
    {date: new Date(2011, 5, 3, 0, 0, 0, 0), val:12},
    {date: new Date(2011, 5, 4, 0, 0, 0, 0), val:11},
    {date: new Date(2011, 5, 5, 0, 0, 0, 0), val:10},
    {date: new Date(2011, 5, 6, 0, 0, 0, 0), val:11},
    {date: new Date(2011, 5, 7, 0, 0, 0, 0), val:13},
    {date: new Date(2011, 5, 8, 0, 0, 0, 0), val:14},
    {date: new Date(2011, 5, 9, 0, 0, 0, 0), val:17},
    {date: new Date(2011, 5, 10, 0, 0, 0, 0), val:13}
];

AmCharts.ready(function() {
    var chart = new AmCharts.AmStockChart();
    chart.pathToImages = "https://www.amcharts.com/lib/3/images/";

    var dataSet = new AmCharts.DataSet();
    dataSet.dataProvider = chartData;
    dataSet.fieldMappings = [{fromField:"val", toField:"value"}];
    dataSet.categoryField = "date";
    chart.dataSets = [dataSet];

    var stockPanel = new AmCharts.StockPanel();
    chart.panels = [stockPanel];

    var panelsSettings = new AmCharts.PanelsSettings();
    panelsSettings.startDuration = 1;
    chart.panelsSettings = panelsSettings;

    var graph = new AmCharts.StockGraph();
    graph.valueField = "value";
    graph.type = "column";
    graph.fillAlphas = 1;
    graph.title = "MyGraph";
    stockPanel.addStockGraph(graph);

    chart.write("chartdiv");
});