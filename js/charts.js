
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