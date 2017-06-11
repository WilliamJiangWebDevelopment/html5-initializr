
function getColors() {
    return {
        'BottomGaugeText': '#ofa1ea',
        'GaugeDefaultText': '#808185',
        'GaugeRedText': '#FF5558',
    };
}

function thresholdDefaults() {
    var config = window.config || {};
    config.boardThreshold = config.boardThreshold || [65, 80];
    config.oeeThreshold = config.oeeThreshold || [65, 80];
    config.oeeQualityThreshold = config.oeeQualityThreshold || [65, 80];
    config.placementThreshold = config.placementThreshold || [90, 95];
    return config;
}


var pCIMHelper = (function () {

    var store = {AppState: 'filterState'};

    store.loadState = function () {
        try {
            var serializedState = sessionStorage.getItem(this.AppState);
            if (serializedState === null) {
                return undefined;
            }
            return JSON.parse(serializedState)
        }
        catch (err) {
            return undefined;
        }
    }

    store.saveState = function (state) {
        try {
            const serializedState = JSON.stringify(state);
            sessionStorage.setItem(this.AppState, serializedState);
        } catch (err) {
            // Ignore write errors.
        }
    }

    store.removeState = function () {
        sessionStorage.removeItem(this.AppState);
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
        var defer = new Promise(function (resolve) {
            return setTimeout(resolve, ms)
        });
        return defer(500).then(function () {
            $.getJSON(url, params, callback);
        });
    }

    return {
        store: store,
        logger: logger,
    }
})();
