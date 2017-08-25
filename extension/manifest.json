{
  "manifest_version": 2,

  "name": "AutoMute",
  "description": "Automatically mutes each new tab the instant it is opened.",
  "version": "2.2",

  "permissions": [
    "tabs",
    "storage",
    "notifications"
  ],

  "background": {
    "scripts": [
        "background.js",
        "notifications.js"
    ]
  },

  "browser_action": {
    "default_icon": {
      "19": "images/Speaker_19.png",
      "38": "images/Speaker_38.png"
    },
    "default_title": "AutoMute",
    "default_popup": "browserAction.html"
  },

  "commands": {
    "mute-all": {
      "suggested_key": {
        "default": "Alt+Shift+L"
      },
      "description": "Mute all tabs"
    },
    "mute-tab": {
      "suggested_key": {
        "default": "Alt+Shift+M"
      },
      "description": "Mute current tab"
    },
    "mute-other": {
      "suggested_key": {
        "default": "Alt+Shift+O"
      },
      "description": "Mute other tabs"
    }
  },

  "icons": {
    "16": "images/Speaker_16.png",
    "48": "images/Speaker_48.png",
    "128": "images/Speaker_128.png"
  },

  "options_ui": {
    "page": "options.html",
    "chrome_style": true
  }
}
