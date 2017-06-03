(function () {
    'use strict';

    function FilterStore() {

        this.state = null;
        this.listeners = [];

        this.getState = function () {
            return this.state;
        }

        this.dispatch = function (action) {
            this.state = reducer(state, action);

            this.listeners.forEach(function (listener) {
                listener.call(this);
            });
        }

        this.subscribe = function (listener) {
            this.listeners.push(listener);
            return function () {
                this.listeners = this.listeners.filter(function (l) {
                    return listener !== l
                })
            }
        }
    }
}());


function reducer(state, action) {
    switch (action.type) {
        case 'ADD':
            return state;
        case 'EDIT':
            return state;
        default:
            return state;
    }
    return state;
}

var filterStore = new FilterStore(reducer);
filterStore.getState();
filterStore.dispatch();
filterStore.subscribe();



var filterParams = [{
    "quickFilter": "",
    "range": "All",
    "startDateTime": 1480744800000,
    "endDateTime": 1496499720000,
    "advanceSearchValues": {
        "Lines": "",
        "Product": "",
        "Equipment": "",
        "PartNumber": "",
        "ReelBarcode": "",
        "Feeder": ""
    }
}, {
    "quickFilter": "",
    "range": "All",
    "startDateTime": "2016-12-3 0:0:0",
    "endDateTime": "2017-6-3 9:22:0",
    "advanceSearchValues": {
        "Lines": "",
        "Product": "",
        "Equipment": "",
        "PartNumber": "",
        "ReelBarcode": "",
        "Feeder": ""
    },
    "shifts": []
}, {
    "quickFilter": "",
    "range": "All",
    "startDateTime": 1480744800000,
    "endDateTime": 1496501880000,
    "advanceSearchValues": {
        "Lines": "LCLine-2, ",
        "Product": "KBOTPRODA,  KPRODUCTA, KPRODUCTB, ",
        "Equipment": "NPM-D, ",
        "PartNumber": "0402C, ",
        "ReelBarcode": "000C29AC0F69-37, ",
        "Feeder": "FA0210AXA042017, "
    }
}, {
    "quickFilter": "",
    "range": "All",
    "startDateTime": "2016-12-3 0:0:0",
    "endDateTime": "2017-6-3 9:58:0",
    "advanceSearchValues": {
        "Lines": "LCLine-2, ",
        "Product": "KBOTPRODA,  KPRODUCTA, KPRODUCTB, ",
        "Equipment": "NPM-D, ",
        "PartNumber": "0402C, ",
        "ReelBarcode": "000C29AC0F69-37, ",
        "Feeder": "FA0210AXA042017, "
    },
    "shifts": ["shift1", "shift3", "shift2"]
}]
