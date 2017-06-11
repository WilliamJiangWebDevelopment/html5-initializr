$(document).ready(function () {

    $.subscribe('oee', function () {
        console.log('oee subscribe -> ', arguments[1]);
        var filter = arguments[1].filter;
        var data = arguments[1].data
    })

    $('input', 'div#advanceSearchDivWrapper').on('blur', function (e) {
        console.log('changed', $(e.target).val())
        e.preventDefault();
    });

    function getDataFromJSON(jsonFile, callback) {
        $.getJSON(jsonFile)
            .done(function (result) {
                //console.log(JSON.stringify(result[0].data));
                callback(result)
            })
            .done(function (result) {
                // save in sessionStore
                pCIMHelper.store.saveState(result);
            })
            .done(function (result) {
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

    var defer = function (ms) {
        return new Promise(function (resolve) {
            return setTimeout(resolve, ms)
        });
    }

    function checkClickNotDefined(id) {
        try {
            return $._data($('#' + id)[0], 'events').click === undefined;
            if ($._data($('#' + id)[0], 'events').click) {
                console.log($._data($('#' + id)[0], 'events').click.delegateCount); //1
            }
        }
        catch (e) {
            throw e;
        }
    }

    var setMouse = function (divID) {
        $('#' + divID).find('text:first').attr('fill', 'blue').css('cursor', 'pointer');
        if ($._data($('#' + divID)[0], 'events') === undefined) {
            $('#' + divID)
                .on('click', 'text:first', function (e) {
                    e.preventDefault();
                    var t = $(e.target).text();
                    var owd = oee2WorstDetails();
                    var worst = owd.find(function (obj) {
                        return obj.min_oee_key === t;
                    });
                    //console.log('add condition:', worst);
                    if ($('li.no-selections').is(':visible')) {
                        $('li.no-selections').hide();
                    }
                    if ($('li.clear').is(':hidden')) {
                        $('li.clear').show();
                    }

                    var notexist = true;
                    $('div.gauge-item').find('>span').each(function (i) {
                        if ($(this).text() === t) {
                            notexist = false;
                            $(this).next('button.close').trigger('click');
                        }
                    })
                    if (notexist) {
                        selectSingleItem(t);
                    }
                    $('#reportsSubmit').trigger('click');
                    return false;
                })
                .mousemove(function (e) {
                    var b = document.getElementById("balloon");
                    b.innerHTML = 'tooltipText';
                    b.style.display = "block";
                    b.style.top = e.pageY + 'px';
                    b.style.left = e.pageX + 'px';
                })
                .mouseleave(function (e) {
                    var b = document.getElementById("balloon");
                    b.innerHTML = "";
                    b.style.display = "none";
                });
        }
    }

    var oee2WorstDetails = (function () {
        var worst2DetailsAry = [];
        return function (details) {
            if (details) {
                worst2DetailsAry = details.slice(0, 2);
                console.log('11111', worst2DetailsAry);
            }
            else {
                return worst2DetailsAry;
            }
        }
    }());


    $('#reportsSubmit').on('click', function (e) {
        getDataFromJSON('data/oee1.json', loadChartDataOEE);
    });

    $('#reportsSubmit-new').on('click', function (e) {
        var jsonFile = 'data/chartData.json';

        // then() or done()?
        // jqXHR.done === jqXHR.success,  jqXHR.fail === jqXHR.error
        $.getJSON(jsonFile, function (data) {
            //1. save filterStore
            //$.publish('foo.bar', data);
        }).done(function (data) {
            //2. draw the picture
            console.log('draw.', data)
        }).done(function (data) {
            //3. select2 append tag
        }).fail(function (e) {
            throw e;
        });
        return false;
    });

    $('div.lines-selection')
        .on('click', 'div.gauge-item>button.close', function (e) {
            $(e.target).closest('li').remove();
            if ($("div.gauge-item").length === 0) {
                $('li.no-selections').fadeIn(500).show();
                $('li.clear').hide();
            }
            $('#reportsSubmit').trigger('click');
            return false;
        })
        .on('click', 'button.dropdown-toggle', function () {
            $('div.dropdown-menu').toggle();
            return false;
        })
        .on('click', 'span.dropdown-item>button.close', function (e) {
            $(e.target).closest('span.dropdown-item').remove();
            if ($('div.dropdown span.dropdown-item').length === 0) {
                $('div.dropdown').closest('li').remove();
                $('li.no-selections').show();
                $('.lines-selection li:last-child').hide();
            }
            else {
                $('button.dropdown-toggle').trigger('click');
            }
            $('#reportsSubmit').trigger('click');
            return false;
        })
        .on('click', 'li.clear', function (e) {
            $("div.gauge-item").closest('li').remove();
            $('li.no-selections').fadeIn(200).show();
            $(this).hide();
            $('#reportsSubmit').trigger('click');
            return false;
        });

    var selectSingleItem = (function () {
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
        return function (text) {
            text = text || 'Opportunity Close MonthYear: Feb 2016';
            var s = li.slice(0, 2).concat('<span>' + text + '</span>', li.slice(2));
            $(s.join('\n')).insertBefore(li_clear);
        }
    })();

    var selectMultiItems = (function () {
        var $ul = $('div.lines-selection ul');
        var menu = [
            '<li>',
            '   <div class="dropdown">',
            '       <button class="btn btn-secondary dropdown-toggle" type="button">',
            'User Full Name : 3 of 388',
            '       </button>',
            '       <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">',
            '       </div>',
            '   </div>',
            '</li>'
        ]
        $(menu.join('\n')).insertAfter('div.lines-selection ul li:first-child');
        var item = [
            '   <span class="dropdown-item">',
            '       <button type="button" class="close" aria-label="Close">',
            '           <span aria-hidden="true">×</span>',
            '       </button>',
            '   </span>',
        ];
        return function (text) {
            text = text || 'Charlie Sheen';
            var s = item.slice(0, 1).concat(text, item.slice(1));
            $('div.dropdown-menu').append(s.join('\n'));
        }
    }());

    selectMultiItems();
    selectMultiItems('Orval  Ebner');
    selectMultiItems('Terrence  Knight');
    selectMultiItems('Val  Conforto');
});

