'use strict';

var pCIM = window.pCIM || {};
pCIM.filterStore = pCIM.filterStore || {};

var pCIMHelper = (function (store, $) {

    var localStore = {AppState: 'filterState'}

    localStore.loadState = function loadState() {
        try {
            var serializedState = localStorage.getItem(this.AppState);
            if (serializedState === null) {
                return undefined;
            }
            return JSON.parse(serializedState)
        }
        catch (err) {
            return undefined;
        }
    }

    localStore.saveState = function (state) {
        try {
            const serializedState = JSON.stringify(state);
            localStorage.setItem(this.AppState, serializedState);
        } catch (err) {
            // Ignore write errors.
        }
    }

    localStore.removeState = function () {
        localStorage.removeItem(this.AppState);
    }

    var logger = function (action) {
        console.group(action.type);
        console.log('%c prev state', 'color: gray', state.getState())
        console.log('%c action', 'color: blue', action)
        const returnValue = next(action)
        console.log('%c next state', 'color: green', state.getState())
        console.groupEnd(action.type);
        return returnValue;
    }

    var init = function (url, params, callback) {
        return delay(500).then(function() {
            $.getJSON(url, params, callback);
        });
    }

    var delay = function (ms) {
        return new Promise(function (resolve) {
            return setTimeout(resolve, ms)
        });
    }

    return {
        localStore: localStore,
        logger: logger,
    }
})(pCIM.filterStore, jQuery);