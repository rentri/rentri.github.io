// copy pasta
(function () {
  "use strict";

  function toast(msg) {
    var el = document.querySelector(".cb-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "cb-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove("show");
    }, 1400);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // fallback for older browsers / non-secure contexts
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      // ignore, nothing more we can do here
    }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  
  // code blocks
  document.querySelectorAll(".cb-copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var block = document.getElementById(btn.dataset.target);
      if (!block) return;

      var lines = block.querySelectorAll(".cb-body .line");
      var text = Array.prototype.map
        .call(lines, function (l) {
          var clone = l.cloneNode(true);
          var ln = clone.querySelector(".ln");
          if (ln) ln.remove();
          return clone.textContent.replace(/^\s?/, "");
        })
        .join("\n");

      copyText(text).then(function () {
        btn.textContent = "copied";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = "copy";
          btn.classList.remove("copied");
        }, 1200);
      });
    });
  });

  document.querySelectorAll(".cb-fold-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var block = document.getElementById(btn.dataset.target);
      if (!block) return;

      var open = block.classList.toggle("is-open");
      var lines = block.dataset.lines || "";
      btn.textContent = open ? "collapse" : "show full listing (" + lines + " lines)";
    });
  });

  function scrollToLineHash() {
    var hash = window.location.hash;
    if (!hash) return;

    var m = hash.match(/^#(cb-\d+-L\d+)$/);
    if (!m) return;

    var el = document.getElementById(m[1]);
    if (!el) return;

    el.scrollIntoView({ block: "center" });
    el.classList.add("js-line-target");
  }

 
  // til
  document.querySelectorAll(".til-copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var entry = btn.closest(".til-entry");
      if (!entry) return;

      var url = window.location.href.split("#")[0] + "#" + entry.id;
      copyText(url).then(function () {
        btn.textContent = "copied";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = "copy link";
          btn.classList.remove("copied");
        }, 1200);
      });
    });
  });

  function scrollToTilHash() {
    var hash = window.location.hash;
    if (!hash) return;

    var id = hash.slice(1);
    var el = document.getElementById(id);
    if (!el || !el.classList.contains("til-entry")) return;

    document.querySelectorAll(".js-til-target").forEach(function (n) {
      n.classList.remove("js-til-target");
    });

    el.scrollIntoView({ block: "start" });
    el.classList.add("js-til-target");
  }

  var jumpInput = document.getElementById("til-jump-input");
  if (jumpInput) {
    jumpInput.addEventListener("input", function () {
      var q = jumpInput.value.trim().toLowerCase();
      document.querySelectorAll(".til-entry").forEach(function (entry) {
        var hay = (entry.dataset.search || "").toLowerCase();
        entry.style.display = !q || hay.indexOf(q) !== -1 ? "" : "none";
      });
    });

    jumpInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var visible = document.querySelector('.til-entry:not([style*="display: none"])');
      if (visible) {
        window.location.hash = visible.id;
        scrollToTilHash();
      }
    });
  }

  window.addEventListener("hashchange", function () {
    scrollToTilHash();
    scrollToLineHash();
  });

  scrollToTilHash();
  scrollToLineHash();
})();