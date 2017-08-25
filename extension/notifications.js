(function (chrome) {
    'use strict';

    chrome.storage.sync.get({ 'newFeatures': 0 }, items => {
        if (items.newFeatures >= 20100) {
            return;
        }

        let isFirefox = typeof InstallTrigger !== 'undefined';
        let notificationOptions = {
            type: 'basic',
            iconUrl: 'Speaker_128.png'
        };

        if (!isFirefox) {
            notificationOptions.requireInteraction = true;
        }

        if (items.newFeatures < 20000) {
            notificationOptions.title = 'New features in AutoMute 2.0';
            notificationOptions.message = 
                'AutoMute has new features including a URL whitelist and keyboard shortcuts. Click the speaker button to explore.';
            
            chrome.notifications.create('new-features-2.0', notificationOptions, notificationId => {});
        }

        if (items.newFeatures < 20100) {
            notificationOptions.title = 'New features in AutoMute 2.1';
            notificationOptions.message = 
                'AutoMute has a new feature. You can now switch to blacklist mode, which will only mute the pages you specify.';
            chrome.notifications.create('new-features-2.1', notificationOptions, notificationId => {});
        }

        if (items.newFeatures < 20200) {
            notificationOptions.title = 'New features in AutoMute 2.2';
            notificationOptions.message = 
                'AutoMute has a new feature. You can now use regular expressions when defining URL rules.';
            chrome.notifications.create('new-features-2.1', notificationOptions, notificationId => {});
        }

        chrome.storage.sync.set({ 'newFeatures': 20200 });
    });

})(chrome);
