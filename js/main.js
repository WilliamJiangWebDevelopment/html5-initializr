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
        $.publish('foo.bar', [3, 4]);
        return false;
    })
});

