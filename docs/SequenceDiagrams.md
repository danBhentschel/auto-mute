# About Mermaid Diagrams

These diagrams are written in the [Mermaid](https://mermaid-js.github.io/mermaid/#/) diagramming
language. Currently, GitHub doesn't support mermaid natively, though it's a
[poular request](https://github.community/t/feature-request-support-mermaid-markdown-graph-diagrams-in-md-files/1922).

You can see what these diagrams should look like by copy-pasting the code into a
[mermaid live editor](https://mermaid.live). I have included direct links for each diagram.
Hopefully I can remember to keep them updated. I also have included a rendered image of each.
This is even less likely to be kept up-to-date.

## Icon Menu

This is the drop-down menu that appears when the user clicks the extension
icon in the top-right corner of the browser.

### Mute / Unmute current tab

```mermaid
sequenceDiagram
    actor user as User
    participant browserAction as Icon Menu (browserAction)
    participant runtime as chrome.runtime
    participant tabs as chrome.tabs
    participant extension as AutoMuteExtension
    participant tracker as TabTracker

    user->>browserAction: Mute / Unmute current tab
    browserAction->>runtime: sendMessage({ command: 'mute-tab' })
    runtime->>+extension: call onMessage listener
    extension->>+tracker: toggleMuteOnCurrentTabByUserRequest()
    deactivate extension
    tracker->>+tabs: query({ active: true })
    tabs-->>-tracker: callback(tab)
    tracker->>tabs: update(tab.id, { muted: !tab.mutedInfo.muted })
    deactivate tracker
```

[Diagram link](https://mermaid.live/edit/#eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICBhY3RvciB1c2VyIGFzIFVzZXJcbiAgIHBhcnRpY2lwYW50IGJyb3dzZXJBY3Rpb24gYXMgSWNvbiBNZW51IChicm93c2VyQWN0aW9uKVxuICAgcGFydGljaXBhbnQgcnVudGltZSBhcyBjaHJvbWUucnVudGltZVxuICAgcGFydGljaXBhbnQgdGFicyBhcyBjaHJvbWUudGFic1xuICAgcGFydGljaXBhbnQgZXh0ZW5zaW9uIGFzIEF1dG9NdXRlRXh0ZW5zaW9uXG4gICBwYXJ0aWNpcGFudCB0cmFja2VyIGFzIFRhYlRyYWNrZXJcblxuICAgIHVzZXItPj5icm93c2VyQWN0aW9uOiBNdXRlIC8gVW5tdXRlIGN1cnJlbnQgdGFiXG4gICAgYnJvd3NlckFjdGlvbi0-PnJ1bnRpbWU6IHNlbmRNZXNzYWdlKHsgY29tbWFuZDogJ211dGUtdGFiJyB9KVxuICAgIHJ1bnRpbWUtPj4rZXh0ZW5zaW9uOiBjYWxsIG9uTWVzc2FnZSBsaXN0ZW5lclxuICAgIGV4dGVuc2lvbi0-Pit0cmFja2VyOiB0b2dnbGVNdXRlT25DdXJyZW50VGFiKClcbiAgICBkZWFjdGl2YXRlIGV4dGVuc2lvblxuICAgIHRyYWNrZXItPj4rdGFiczogcXVlcnkoeyBhY3RpdmU6IHRydWUgfSlcbiAgICB0YWJzLS0-Pi10cmFja2VyOiBjYWxsYmFjayh0YWIpXG4gICAgdHJhY2tlci0-PnRhYnM6IHVwZGF0ZSh0YWIuaWQsIHsgbXV0ZWQ6ICF0YWIubXV0ZWRJbmZvLm11dGVkIH0pXG4gICAgZGVhY3RpdmF0ZSB0cmFja2VyIiwibWVybWFpZCI6IntcbiAgXCJ0aGVtZVwiOiBcImRlZmF1bHRcIlxufSIsInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0)

![Mute / Unmute sequence diagram](images/mermaid-diagram-icon-mute5.svg)

### Mute all tabs

```mermaid
sequenceDiagram
    actor user as User
    participant browserAction as Icon Menu (browserAction)
    participant runtime as chrome.runtime
    participant tabs as chrome.tabs
    participant extension as AutoMuteExtension
    participant tracker as TabTracker

    user->>browserAction: Mute all tabs
    browserAction->>runtime: sendMessage({ command: 'mute-all' })
    runtime->>+extension: call onMessage listener
    extension->>+tracker: muteAllTabs()
    deactivate extension
    tracker->>+tabs: query()
    tabs-->>-tracker: callback(tabs)
    loop For each tab
        tracker->>tabs: update(tab.id, { muted: true })
    end
    deactivate tracker
```

[Diagram link](https://mermaid.live/edit/#eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgYWN0b3IgdXNlciBhcyBVc2VyXG4gICAgcGFydGljaXBhbnQgYnJvd3NlckFjdGlvbiBhcyBJY29uIE1lbnUgKGJyb3dzZXJBY3Rpb24pXG4gICAgcGFydGljaXBhbnQgcnVudGltZSBhcyBjaHJvbWUucnVudGltZVxuICAgIHBhcnRpY2lwYW50IHRhYnMgYXMgY2hyb21lLnRhYnNcbiAgICBwYXJ0aWNpcGFudCBleHRlbnNpb24gYXMgQXV0b011dGVFeHRlbnNpb25cbiAgICBwYXJ0aWNpcGFudCB0cmFja2VyIGFzIFRhYlRyYWNrZXJcblxuICAgIHVzZXItPj5icm93c2VyQWN0aW9uOiBNdXRlIGFsbCB0YWJzXG4gICAgYnJvd3NlckFjdGlvbi0-PnJ1bnRpbWU6IHNlbmRNZXNzYWdlKHsgY29tbWFuZDogJ211dGUtYWxsJyB9KVxuICAgIHJ1bnRpbWUtPj4rZXh0ZW5zaW9uOiBjYWxsIG9uTWVzc2FnZSBsaXN0ZW5lclxuICAgIGV4dGVuc2lvbi0-Pit0cmFja2VyOiBtdXRlQWxsVGFicygpXG4gICAgZGVhY3RpdmF0ZSBleHRlbnNpb25cbiAgICB0cmFja2VyLT4-K3RhYnM6IHF1ZXJ5KClcbiAgICB0YWJzLS0-Pi10cmFja2VyOiBjYWxsYmFjayh0YWJzKVxuICAgIGxvb3AgRm9yIGVhY2ggdGFiXG4gICAgICAgIHRyYWNrZXItPj50YWJzOiB1cGRhdGUodGFiLmlkLCB7IG11dGVkOiB0cnVlIH0pXG4gICAgZW5kXG4gICAgZGVhY3RpdmF0ZSB0cmFja2VyIiwibWVybWFpZCI6IntcbiAgXCJ0aGVtZVwiOiBcImRlZmF1bHRcIlxufSIsInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0)

![Mute all tabs sequence diagram](images/mermaid-diagram-icon-mute-all3.svg)

### Mute other tabs

```mermaid
sequenceDiagram
    actor user as User
    participant browserAction as Icon Menu (browserAction)
    participant runtime as chrome.runtime
    participant tabs as chrome.tabs
    participant extension as AutoMuteExtension
    participant tracker as TabTracker

    user->>browserAction: Mute other tabs
    browserAction->>runtime: sendMessage({ command: 'mute-other' })
    runtime->>+extension: call onMessage listener
    extension->>+tracker: muteOtherTabsByUserRequest()
    deactivate extension
    tracker->>+tabs: query({ active: true })
    tabs-->>-tracker: callback(tab)
    tracker->>+tabs: query()
    tabs-->>-tracker: callback(tabs)
    loop For each otherTab !== tab
        tracker->>tabs: update(otherTab.id, { muted: true })
    end
    deactivate tracker
```

[Diagram link](https://mermaid.live/edit/#eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgYWN0b3IgdXNlciBhcyBVc2VyXG4gICAgcGFydGljaXBhbnQgYnJvd3NlckFjdGlvbiBhcyBJY29uIE1lbnUgKGJyb3dzZXJBY3Rpb24pXG4gICAgcGFydGljaXBhbnQgcnVudGltZSBhcyBjaHJvbWUucnVudGltZVxuICAgIHBhcnRpY2lwYW50IHRhYnMgYXMgY2hyb21lLnRhYnNcbiAgICBwYXJ0aWNpcGFudCBleHRlbnNpb24gYXMgQXV0b011dGVFeHRlbnNpb25cbiAgICBwYXJ0aWNpcGFudCB0cmFja2VyIGFzIFRhYlRyYWNrZXJcblxuICAgIHVzZXItPj5icm93c2VyQWN0aW9uOiBNdXRlIG90aGVyIHRhYnNcbiAgICBicm93c2VyQWN0aW9uLT4-cnVudGltZTogc2VuZE1lc3NhZ2UoeyBjb21tYW5kOiAnbXV0ZS1vdGhlcicgfSlcbiAgICBydW50aW1lLT4-K2V4dGVuc2lvbjogY2FsbCBvbk1lc3NhZ2UgbGlzdGVuZXJcbiAgICBleHRlbnNpb24tPj4rdHJhY2tlcjogbXV0ZU90aGVyVGFicygpXG4gICAgZGVhY3RpdmF0ZSBleHRlbnNpb25cbiAgICB0cmFja2VyLT4-K3RhYnM6IHF1ZXJ5KHsgYWN0aXZlOiB0cnVlIH0pXG4gICAgdGFicy0tPj4tdHJhY2tlcjogY2FsbGJhY2sodGFiKVxuICAgIHRyYWNrZXItPj4rdGFiczogcXVlcnkoKVxuICAgIHRhYnMtLT4-LXRyYWNrZXI6IGNhbGxiYWNrKHRhYnMpXG4gICAgbG9vcCBGb3IgZWFjaCBvdGhlclRhYiAhPT0gdGFiXG4gICAgICAgIHRyYWNrZXItPj50YWJzOiB1cGRhdGUob3RoZXJUYWIuaWQsIHsgbXV0ZWQ6IHRydWUgfSlcbiAgICBlbmRcbiAgICBkZWFjdGl2YXRlIHRyYWNrZXIiLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

![Mute other tabs sequence diagram](images/mermaid-diagram-icon-mute-other3.svg)

## Tab Events

These events are fired by the browser in response to the user performing actions such as
opening a new tab or navigating to a new page.

### User navigates to a new URL

In this example, the user is using a "should not mute list", and the
URL navigated to is not in the list, so it should be muted.

```mermaid
sequenceDiagram
    participant tabs as chrome.tabs
    participant storage as chrome.storage
    participant extension as AutoMuteExtension
    participant eOptions as ExtensionOptions
    participant tracker as TabTracker
    participant list as ListExpert

    tabs->>+extension: call tabs.onUpdated listener
    extension->>+tracker: onTabUrlChanged(tabId, url)
    deactivate extension
    tracker->>+tabs: get(tabId)
    tabs-->>-tracker: callback(tab)
    tracker->>+list: getListInfo()
    list->>+eOptions: getUsingAllowAudioList()
    eOptions->>+storage: get()
    storage-->>-eOptions: callback(true)
    eOptions-->>-list: true
    list->>+eOptions: getAllowOrBlockAudioList()
    eOptions->>+storage: get()
    storage-->>-eOptions: callback(urls)
    eOptions-->>-list: urls
    list-->>-tracker: listInfo
    tracker->>+list: isInList(listInfo, url)
    list-->>-tracker: false
    tracker->>+eOptions: getEnabled()
    eOptions->>+storage: get()
    storage-->>-eOptions: callback(true)
    eOptions-->>-tracker: true
    tracker->>tabs: update(tab.id, { muted: true })
```

[Diagram link](https://mermaid.live/edit/#eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgcGFydGljaXBhbnQgdGFicyBhcyBjaHJvbWUudGFic1xuICAgIHBhcnRpY2lwYW50IHN0b3JhZ2UgYXMgY2hyb21lLnN0b3JhZ2VcbiAgICBwYXJ0aWNpcGFudCBleHRlbnNpb24gYXMgQXV0b011dGVFeHRlbnNpb25cbiAgICBwYXJ0aWNpcGFudCBlT3B0aW9ucyBhcyBFeHRlbnNpb25PcHRpb25zXG4gICAgcGFydGljaXBhbnQgdHJhY2tlciBhcyBUYWJUcmFja2VyXG4gICAgcGFydGljaXBhbnQgbGlzdCBhcyBMaXN0RXhwZXJ0XG5cbiAgICB0YWJzLT4-K2V4dGVuc2lvbjogY2FsbCB0YWJzLm9uVXBkYXRlZCBsaXN0ZW5lclxuICAgIGV4dGVuc2lvbi0-Pit0cmFja2VyOiBvblRhYlVybENoYW5nZWQodGFiSWQsIHVybClcbiAgICBkZWFjdGl2YXRlIGV4dGVuc2lvblxuICAgIHRyYWNrZXItPj4rdGFiczogZ2V0KHRhYklkKVxuICAgIHRhYnMtLT4-LXRyYWNrZXI6IGNhbGxiYWNrKHRhYilcbiAgICB0cmFja2VyLT4-K2xpc3Q6IGdldExpc3RJbmZvKClcbiAgICBsaXN0LT4-K2VPcHRpb25zOiBnZXRVc2luZ1Nob3VsZE5vdE11dGVMaXN0KClcbiAgICBlT3B0aW9ucy0-PitzdG9yYWdlOiBnZXQoKVxuICAgIHN0b3JhZ2UtLT4-LWVPcHRpb25zOiBjYWxsYmFjayh0cnVlKVxuICAgIGVPcHRpb25zLS0-Pi1saXN0OiB0cnVlXG4gICAgbGlzdC0-PitlT3B0aW9uczogZ2V0U2hvdWxkTm90TXV0ZUxpc3QoKVxuICAgIGVPcHRpb25zLT4-K3N0b3JhZ2U6IGdldCgpXG4gICAgc3RvcmFnZS0tPj4tZU9wdGlvbnM6IGNhbGxiYWNrKHVybHMpXG4gICAgZU9wdGlvbnMtLT4-LWxpc3Q6IHVybHNcbiAgICBsaXN0LS0-Pi10cmFja2VyOiBsaXN0SW5mb1xuICAgIHRyYWNrZXItPj4rbGlzdDogaXNJbkxpc3QobGlzdEluZm8sIHVybClcbiAgICBsaXN0LS0-Pi10cmFja2VyOiBmYWxzZVxuICAgIHRyYWNrZXItPj4rZU9wdGlvbnM6IGdldEVuYWJsZWQoKVxuICAgIGVPcHRpb25zLT4-K3N0b3JhZ2U6IGdldCgpXG4gICAgc3RvcmFnZS0tPj4tZU9wdGlvbnM6IGNhbGxiYWNrKHRydWUpXG4gICAgZU9wdGlvbnMtLT4-LXRyYWNrZXI6IHRydWVcbiAgICB0cmFja2VyLT4-dGFiczogdXBkYXRlKHRhYi5pZCwgeyBtdXRlZDogdHJ1ZSB9KSIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)

![User changes tab URL sequence diagram](images/mermaid-diagram-tab-url-changed.svg)
