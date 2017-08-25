var chrome = {
    tabs: {
        onCreated: {
            addListener: function() {}
        },
        onReplaced: {
            addListener: function() {}
        },
        onUpdated: {
            addListener: function() {}
        }
    },
    commands: {
        onCommand: {
            addListener: function() {}
        },
        getAll: function() {}
    },
    runtime: {
        onMessage: {
            addListener: function() {}
        },
        sendMessage: function() {}
    },
    storage: {
        sync: {
            get: function() {}
        }
    }
};
