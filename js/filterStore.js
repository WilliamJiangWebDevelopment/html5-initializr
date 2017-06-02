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
