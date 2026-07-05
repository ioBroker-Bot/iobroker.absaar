/* global $, M */
"use strict";

let changedCallback = null;

function load(settings, onChange) {
  changedCallback = onChange;
  settings = settings || {};
  $("#enabled").prop("checked", settings.enabled !== false);
  $("#username").val(settings.username || "");
  $("#password").val(settings.password || "");
  $("#pollInterval").val(settings.pollInterval || 120);
  $("#baseUrl").val(settings.baseUrl || "https://mini-ems.com:8081");
  $("#writeRawJson").prop("checked", !!settings.writeRawJson);
  if (typeof M !== "undefined" && M.updateTextFields) M.updateTextFields();
  $("input").off("change keyup").on("change keyup", () => changedCallback(true));
  onChange(false);
}

function save(callback) {
  callback({
    enabled: $("#enabled").prop("checked"),
    username: $("#username").val(),
    password: $("#password").val(),
    pollInterval: Number($("#pollInterval").val() || 120),
    baseUrl: $("#baseUrl").val() || "https://mini-ems.com:8081",
    writeRawJson: $("#writeRawJson").prop("checked")
  });
}
