$(document).ready(function () {

    function createLogger(name) {
        return function (_, a, b) {
            // Skip the first argument (event object) but log the name and other args.
            console.log(name, a, b);
        };
    }

    $.subscribe('foo', createLogger('foo'));

    $.subscribe('foo.bar', createLogger('foo.bar'));

    $('input', 'div#advanceSearchDivWrapper').on('blur', function (e) {
        console.log('changed', $(e.target).val())
        $.publish('foo', 1);
        e.preventDefault();
    });

    $('#reportsSubmit').on('click', function (e) {
        var jsonFile = 'js/chartData.json';

        // then() or done()?
        // jqXHR.done === jqXHR.success,  jqXHR.fail === jqXHR.error
        $.getJSON(jsonFile, function (data) {
            //1. save filterStore
            $.publish('foo.bar', data);
        }).done(function (data) {
            //2. draw the picture
            console.log('draw.', data)
        }).done(function (data) {
            //3. select2 append tag
        }).fail(function (e) {
            throw e;
        });

        return false;
    })

});

