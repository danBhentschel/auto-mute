(function (chrome) {
  function setControlsEnabled(enabled) {
    $("#checkEnabled").prop("disabled", !enabled);
    $("#radioWhite").prop("disabled", !enabled);
    $("#radioBlack").prop("disabled", !enabled);
    $("#whitelist").prop("disabled", !enabled);
    $("#blacklist").prop("disabled", !enabled);
    $("#save").prop("disabled", !enabled);
  }

  function saveOptions() {
    setControlsEnabled(false);

    chrome.storage.sync.set(
      {
        enabled: $("#checkEnabled").prop("checked"),
        whitelist: $("#whitelist")
          .val()
          .split("\n")
          .filter((_) => !!_)
          .join("\n"),
        blacklist: $("#blacklist")
          .val()
          .split("\n")
          .filter((_) => !!_)
          .join("\n"),
        usingWhitelist: $("#radioWhite").prop("checked"),
      },
      function () {
        $("#status").html("Saved");
        setTimeout(function () {
          $("#status").html("");
          setControlsEnabled(true);
          window.close();
          chrome.runtime.sendMessage({ command: "apply-mute" });
        }, 750);
      }
    );
  }

  function initializeOptions() {
    chrome.storage.sync.get(
      {
        enabled: true,
        whitelist: "",
        blacklist: "",
        usingWhitelist: true,
      },
      function (items) {
        $("#checkEnabled").prop("checked", items.enabled);
        $("#whitelist").val(items.whitelist);
        $("#blacklist").val(items.blacklist);
        $("#radioWhite").prop("checked", items.usingWhitelist);
        $("#radioBlack").prop("checked", !items.usingWhitelist);
        setControlsEnabled(true);
      }
    );
  }

  $(document).ready(() => {
    $("#save").click(saveOptions);
    initializeOptions();
  });
})(chrome);
