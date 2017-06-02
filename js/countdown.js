window.timeHandler = null;

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

    $('#counter').text(defaultAR);
    $(':input[name="autoRefresh"]', '#ar-form').on('change', function () {
        console.log('radio change: ', $(this).prop('id'), timeHandler);
        if (/enable/.test($(this).prop('id'))) {
            $('#countdown').fadeIn(500);
            $('#countdown :input').focus();
        }
        else {
            $('#countdown').fadeOut(500);
            clearTimeout(timeHandler);
            $('#counter').text(defaultAR);
        }
    });
    $(':input[type="text"]', '#countdown').blur(function () {
        var mins = $(this).val();
        clearTimeout(timeHandler);
        countdown(parseInt(mins));
    })
});
