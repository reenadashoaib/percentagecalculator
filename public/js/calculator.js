(function () {
  "use strict";

  var fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
  var money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function f(n) {
    return fmt.format(n);
  }

  function parse(raw) {
    var clean = String(raw).replace(/[,\s%$€£]/g, "");
    if (clean === "" || clean === "-" || clean === ".") return null;
    var n = Number(clean);
    return Number.isFinite(n) ? n : NaN;
  }

  // Each mode returns { value, caption, extra, formula, bar } or { error }.
  var MODES = {
    of: function (v) {
      var r = (v.p / 100) * v.y;
      return {
        value: f(r),
        caption: f(v.p) + "% of " + f(v.y),
        formula: f(v.p) + " ÷ 100 × " + f(v.y) + " = " + f(r),
        bar: v.p
      };
    },
    what: function (v) {
      if (v.y === 0) return { error: "The second number can't be 0 — there's nothing to take a percentage of." };
      var r = (v.x / v.y) * 100;
      return {
        value: f(r) + "%",
        caption: f(v.x) + " out of " + f(v.y),
        formula: f(v.x) + " ÷ " + f(v.y) + " × 100 = " + f(r) + "%",
        bar: r
      };
    },
    change: function (v) {
      if (v.a === 0) return { error: "The starting value can't be 0 — percent change is measured against it." };
      var r = ((v.b - v.a) / Math.abs(v.a)) * 100;
      var word = r > 0 ? "increase" : r < 0 ? "decrease" : "no change";
      return {
        value: (r > 0 ? "+" : "") + f(r) + "%",
        caption: word === "no change" ? "No change" : "A " + f(Math.abs(r)) + "% " + word,
        extra: "Difference: " + (v.b - v.a > 0 ? "+" : "") + f(v.b - v.a),
        formula: "(" + f(v.b) + " − " + f(v.a) + ") ÷ " + f(Math.abs(v.a)) + " × 100 = " + f(r) + "%",
        bar: Math.abs(r)
      };
    },
    adjust: function (v) {
      var sign = v.dir === "decrease" ? -1 : 1;
      var r = v.y * (1 + (sign * v.p) / 100);
      var op = sign > 0 ? "+" : "−";
      return {
        value: f(r),
        caption: f(v.y) + " " + (sign > 0 ? "increased" : "decreased") + " by " + f(v.p) + "%",
        extra: "Change: " + op + f(Math.abs(r - v.y)),
        formula: f(v.y) + " × (1 " + op + " " + f(v.p) + " ÷ 100) = " + f(r),
        bar: v.p
      };
    },
    discount: function (v) {
      var saved = (v.price * v.p) / 100;
      var final = v.price - saved;
      return {
        value: money.format(final),
        caption: "Price after " + f(v.p) + "% off",
        extra: "You save " + money.format(saved),
        formula: f(v.price) + " − (" + f(v.price) + " × " + f(v.p) + " ÷ 100) = " + money.format(final),
        bar: v.p
      };
    },
    reverse: function (v) {
      if (v.p === 0) return { error: "The percentage can't be 0 — every number has 0% equal to 0." };
      var r = v.x / (v.p / 100);
      return {
        value: f(r),
        caption: f(v.x) + " is " + f(v.p) + "% of this number",
        formula: f(v.x) + " ÷ (" + f(v.p) + " ÷ 100) = " + f(r),
        bar: v.p
      };
    }
  };

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".calc-panel"));
  var out = {
    value: document.getElementById("result-value"),
    caption: document.getElementById("result-caption"),
    extra: document.getElementById("result-extra"),
    formula: document.getElementById("result-formula"),
    hint: document.getElementById("result-hint"),
    fill: document.getElementById("bar-fill"),
    max: document.getElementById("bar-max"),
    copy: document.getElementById("copy-result"),
    reset: document.getElementById("reset-calc")
  };
  var current = null;
  var doneTimer = null;

  function sizeInput(input) {
    input.style.setProperty("--chars", Math.max(2, input.value.length));
  }

  function activePanel() {
    return document.getElementById("panel-" + current);
  }

  function compute() {
    var panel = activePanel();
    var values = {};
    var missing = false;
    var bad = false;

    panel.querySelectorAll("input, select").forEach(function (el) {
      if (el.tagName === "SELECT") {
        values[el.name] = el.value;
        return;
      }
      var n = parse(el.value);
      el.setAttribute("aria-invalid", Number.isNaN(n) ? "true" : "false");
      if (n === null) missing = true;
      else if (Number.isNaN(n)) bad = true;
      values[el.name] = n;
    });

    out.extra.textContent = "";
    if (bad || missing) {
      out.value.textContent = "—";
      out.caption.textContent = "";
      out.formula.textContent = "";
      out.fill.style.width = "0";
      out.hint.textContent = bad ? "Use digits only, like 12.5 or 1,200." : "Fill in every box to see the answer.";
      out.hint.hidden = false;
      return;
    }

    var r = MODES[current](values);
    if (r.error) {
      out.value.textContent = "—";
      out.caption.textContent = "";
      out.formula.textContent = "";
      out.fill.style.width = "0";
      out.hint.textContent = r.error;
      out.hint.hidden = false;
      return;
    }

    out.hint.hidden = true;
    out.value.textContent = r.value;
    out.caption.textContent = r.caption;
    out.extra.textContent = r.extra || "";
    out.formula.innerHTML = "";
    var code = document.createElement("code");
    code.textContent = r.formula;
    out.formula.append("How it's worked out: ", code);

    // Bar scales to 100%, or to the next 100 above the value when it overflows.
    var pct = Math.abs(r.bar);
    var scale = pct > 100 ? Math.ceil(pct / 100) * 100 : 100;
    out.fill.style.width = Math.min(100, (pct / scale) * 100) + "%";
    out.max.textContent = scale + "%";

    window.clearTimeout(doneTimer);
    doneTimer = window.setTimeout(function () {
      document.dispatchEvent(new CustomEvent("calc:done", { detail: { mode: current } }));
    }, 1200);
  }

  function select(mode, focusTab) {
    if (!MODES[mode]) mode = "of";
    current = mode;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-mode") === mode;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      if (on && focusTab) tab.focus();
    });
    panels.forEach(function (p) {
      p.hidden = p.id !== "panel-" + mode;
    });
    if (window.history.replaceState) {
      window.history.replaceState(null, "", "#" + mode);
    }
    compute();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      select(tab.getAttribute("data-mode"));
    });
    tab.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      select(next.getAttribute("data-mode"), true);
    });
  });

  panels.forEach(function (panel) {
    panel.querySelectorAll("input").forEach(function (input) {
      sizeInput(input);
      input.addEventListener("input", function () {
        sizeInput(input);
        compute();
      });
    });
    panel.querySelectorAll("select").forEach(function (s) {
      s.addEventListener("change", compute);
    });
    panel.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  });

  out.copy.addEventListener("click", function () {
    var text = out.value.textContent;
    if (!text || text === "—") return;
    var done = function () {
      out.copy.textContent = "Copied";
      window.setTimeout(function () {
        out.copy.textContent = "Copy answer";
      }, 1500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  });

  out.reset.addEventListener("click", function () {
    activePanel().querySelectorAll("input").forEach(function (input) {
      input.value = "";
      sizeInput(input);
    });
    var first = activePanel().querySelector("input");
    if (first) first.focus();
    compute();
  });

  // Links in the guide like <a href="#change"> switch the calculator.
  document.querySelectorAll("a[data-mode-link]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      select(a.getAttribute("data-mode-link"));
      document.getElementById("calculator").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  select(window.location.hash.slice(1));
})();
