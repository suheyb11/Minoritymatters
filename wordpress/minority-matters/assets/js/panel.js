// Small helpers for the admin panel (/admin). Every page also works without this file.
(function () {
  "use strict";

  // "Are you sure?" before deleting
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-confirm]");
    if (el && !window.confirm(el.getAttribute("data-confirm"))) e.preventDefault();
  });

  // Image fields: show the chosen file or the typed address as a preview
  document.querySelectorAll("[data-image-field]").forEach(function (box) {
    var preview = box.querySelector("[data-preview]");
    var none = box.querySelector("[data-no-image]");
    function show(src) {
      preview.hidden = !src;
      none.hidden = !!src;
      if (src) preview.src = src;
    }
    box.querySelector("[data-file]").addEventListener("change", function () {
      if (this.files && this.files[0]) show(URL.createObjectURL(this.files[0]));
    });
    box.querySelector("[data-address]").addEventListener("change", function () {
      var v = this.value.trim();
      if (/^https?:\/\//.test(v)) show(v);
    });
  });

  // Messages: show the newest message of a conversation, and "Sending…" while a reply is sent
  document.querySelectorAll("[data-scroll-end]").forEach(function (list) {
    list.scrollTop = list.scrollHeight;
  });
  var send = document.querySelector("[data-send]");
  if (send) {
    send.form.addEventListener("submit", function (e) {
      // The same limits as the website (includes/conversations.php), checked here so the reply is not lost
      var chosen = send.form.querySelector("[data-reply-files]");
      var files = chosen ? Array.prototype.slice.call(chosen.files) : [];
      var total = files.reduce(function (sum, f) { return sum + f.size; }, 0);
      var problem = files.length > 5 ? "Please attach at most 5 files."
        : files.some(function (f) { return f.size > 10485760; }) || total > 20971520 ? "The files are too big: at most 10 MB each, and 20 MB together."
        : "";
      if (problem) {
        e.preventDefault();
        window.alert(problem);
        return;
      }
      send.disabled = true;
      send.textContent = "Sending…";
    });
    // Ctrl+Enter (or Cmd+Enter) sends the reply
    send.form.querySelector("[data-reply-box]").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send.form.requestSubmit();
    });
  }

  // Live updates: every 15 seconds ask whether a message or reply came in. If so, load this page again in the
  // background and swap only the parts marked data-live (the conversation list, the open conversation, the
  // unread number), so a reply being written is never lost.
  var poll = document.body.getAttribute("data-poll");
  var stamp = document.body.getAttribute("data-stamp");
  var busy = false;
  var names = function (doc) {
    return Array.prototype.map.call(doc.querySelectorAll("[data-live]"), function (el) {
      return el.getAttribute("data-live");
    }).join(",");
  };
  var typing = function () {
    var box = document.querySelector("[data-reply-box]");
    var files = document.querySelector("[data-reply-files]");
    return (box && (box.value.trim() !== "" || document.activeElement === box)) || (files && files.files.length > 0);
  };
  var refresh = function () {
    return fetch(window.location.href, { credentials: "same-origin", cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        // The page changed shape (for example the first message arrived): load it again, unless a reply is being written
        if (names(doc) !== names(document)) {
          if (!typing()) window.location.reload();
          return;
        }
        document.querySelectorAll("[data-live]").forEach(function (el) {
          var fresh = doc.querySelector('[data-live="' + el.getAttribute("data-live") + '"]');
          var atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          var top = el.scrollTop;
          el.replaceWith(fresh);
          fresh.scrollTop = fresh.hasAttribute("data-scroll-end") && atEnd ? fresh.scrollHeight : top;
        });
        stamp = doc.body.getAttribute("data-stamp") || stamp;
      });
  };
  var check = function () {
    if (!poll || busy || document.visibilityState !== "visible") return;
    busy = true;
    fetch(poll, { credentials: "same-origin", cache: "no-store" })
      .then(function (r) {
        if (r.status === 403) poll = ""; // logged out, or the page is too old: stop asking
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.stamp && data.stamp !== stamp) return refresh();
      })
      .catch(function () {})
      .then(function () {
        busy = false;
      });
  };
  if (poll) {
    window.setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
  }

  // Booking status: saved as soon as another status is chosen
  document.querySelectorAll("[data-autosubmit]").forEach(function (select) {
    select.addEventListener("change", function () {
      select.form.submit();
    });
  });

  // Events: the booking link is only needed for "Link to another booking page"
  var type = document.querySelector("[data-booking-type]");
  var link = document.querySelector('input[name="fields[bookingUrl]"]');
  if (type && link) {
    var row = link.closest("label");
    var update = function () {
      row.hidden = type.value !== "external";
    };
    type.addEventListener("change", update);
    update();
  }

  // Users: make a strong random password
  var make = document.querySelector("[data-make-password]");
  if (make) {
    make.addEventListener("click", function () {
      var letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      var bytes = new Uint32Array(16);
      window.crypto.getRandomValues(bytes);
      var password = "";
      for (var i = 0; i < bytes.length; i++) password += letters[bytes[i] % letters.length];
      document.querySelector("[data-password]").value = password;
    });
  }
})();
