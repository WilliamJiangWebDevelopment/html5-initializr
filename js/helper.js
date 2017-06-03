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

    var delay = function (ms) {
        return new Promise(function (resolve) {
            return setTimeout(resolve, ms)
        });
    }

    var init = function (url, params, callback) {
        return delay(500).then(function () {
            $.getJSON(url, params, callback);
        });
    }

    return {
        store: store,
        logger: logger,
    }
})();