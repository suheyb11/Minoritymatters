// Movement and small interactions for the Minority Matters theme.
// The old website did these with React and Framer Motion (components/Motion.tsx); this is the same in plain JavaScript.
// Every page works without this file: content is in the HTML, and forms post normally.
// All animations respect the visitor's "reduce motion" setting.

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function belowScreen(el) {
    return el.getBoundingClientRect().top > window.innerHeight;
  }

  // Runs "callback" once, the first time the element scrolls into view
  function onceInView(el, callback, margin) {
    if (!("IntersectionObserver" in window)) return callback();
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.disconnect();
            callback();
          }
        });
      },
      { rootMargin: margin || "0px" }
    );
    observer.observe(el);
  }

  // ---------- Header: a thin line when the page is scrolled, and the mobile menu ----------
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("shadow-[0_1px_0_#e5e3e8]", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var button = header.querySelector("[data-menu-button]");
    var menu = document.getElementById("mobile-menu");
    var bars = header.querySelectorAll("[data-bar]");
    if (button && menu) {
      button.addEventListener("click", function () {
        var open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        // The two bars turn into a cross
        bars[0].classList.toggle("top-0", !open);
        bars[0].classList.toggle("top-1.5", open);
        bars[0].classList.toggle("rotate-45", open);
        bars[1].classList.toggle("top-3", !open);
        bars[1].classList.toggle("top-1.5", open);
        bars[1].classList.toggle("-rotate-45", open);
        if (open) {
          menu.hidden = false;
          requestAnimationFrame(function () {
            menu.classList.add("is-open");
          });
        } else {
          menu.classList.remove("is-open");
          setTimeout(function () {
            if (button.getAttribute("aria-expanded") !== "true") menu.hidden = true;
          }, reduce ? 0 : 300);
        }
      });
    }
  }

  // ---------- Donate: the buttons open the "choose how to donate" window ----------
  var donate = document.getElementById("donate-dialog");
  if (donate && typeof donate.showModal === "function") {
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-donate]")) {
        e.preventDefault();
        donate.showModal();
      } else if (e.target.closest("[data-donate-close]") || e.target === donate) {
        donate.close(); // the close button, or a click on the dark background
      }
    });
    // A shared link ending in #donate (for example on social media) opens the window straight away
    if (window.location.hash === "#donate") donate.showModal();
  }

  // ---------- Reveal: blocks further down the page fade up when they scroll into view ----------
  // (Blocks on screen when the page opens already rose with the CSS animation .reveal-rise.)
  if (!reduce) {
    all("[data-reveal]").forEach(function (el) {
      if (!belowScreen(el)) return;
      var x = Number(el.getAttribute("data-x") || 0);
      var y = Number(el.getAttribute("data-y") || 28);
      var scale = Number(el.getAttribute("data-scale") || 1);
      var delay = Number(el.getAttribute("data-delay") || 0);
      var duration = Number(el.getAttribute("data-duration") || 0.6);
      el.style.animation = "none";
      el.style.transition = "none";
      el.style.opacity = "0";
      el.style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
      onceInView(
        el,
        function () {
          el.style.transition = "opacity " + duration + "s " + ease + " " + delay + "s, transform " + duration + "s " + ease + " " + delay + "s";
          el.style.opacity = "1";
          el.style.transform = "none";
        },
        "0px 0px -80px 0px"
      );
    });

    // Rings that draw when they scroll into view (the 5 service areas)
    all("[data-ring-on-view]").forEach(function (svg) {
      if (!belowScreen(svg)) return;
      svg.classList.add("ring-wait");
      onceInView(svg, function () {
        svg.classList.remove("ring-wait");
      });
    });

    // The thin pink line on the big photo grows to 80px
    all("[data-grow-line]").forEach(function (line) {
      if (!belowScreen(line)) return;
      line.style.width = "0px";
      onceInView(line, function () {
        line.style.transition = "width 0.8s " + ease + " 0.3s";
        line.style.width = "80px";
      });
    });
  }

  // ---------- CountUp: numbers count up from 0 when they come into view ----------
  function countUp(el) {
    var to = Number(el.getAttribute("data-count-to")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce || to === 0) return;
    var start = null;
    var duration = 1600;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 2.2); // ease-out
      el.textContent = Math.round(to * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function watchCount(el) {
    if (reduce) return;
    var to = el.getAttribute("data-count-to");
    if (belowScreen(el)) {
      el.textContent = "0" + (el.getAttribute("data-suffix") || "");
      // Safety net: when someone scrolls past very fast, show the real number
      var onPast = function () {
        if (el.getBoundingClientRect().bottom < 0) {
          el.textContent = to + (el.getAttribute("data-suffix") || "");
          window.removeEventListener("scroll", onPast);
        }
      };
      window.addEventListener("scroll", onPast, { passive: true });
    }
    onceInView(el, function () {
      countUp(el);
    });
  }
  all("[data-count-to]").forEach(function (el) {
    if (el.offsetParent !== null) watchCount(el); // numbers in a hidden year start when that year is shown
  });

  // ---------- HeroRing: the charity's values change in the middle of the big ring ----------
  all("[data-words]").forEach(function (el) {
    var words = [];
    try {
      words = JSON.parse(el.getAttribute("data-words")) || [];
    } catch (e) {}
    if (reduce || words.length < 2) return;
    var index = 0;
    setInterval(function () {
      el.classList.add("is-out");
      setTimeout(function () {
        index = (index + 1) % words.length;
        el.textContent = words[index];
        el.classList.remove("is-out");
        el.classList.add("is-in");
        void el.offsetWidth; // start the "in" movement from below
        el.classList.remove("is-in");
      }, 450);
    }, 2600);
  });

  // ---------- Panels that open and close (programmes, transcript) ----------
  function setOpen(button, panel, open) {
    button.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    if (open) panel.removeAttribute("inert");
    else panel.setAttribute("inert", "");
    var label = button.getAttribute(open ? "data-open-label" : "data-closed-label");
    if (label) button.textContent = label;
  }

  // Programmes: one open at a time; /our-work#<programme> opens that one
  all("[data-accordion]").forEach(function (list) {
    var items = all(":scope > li", list);
    function buttonOf(li) {
      return li.querySelector("button[aria-controls]");
    }
    function panelOf(li) {
      return document.getElementById(buttonOf(li).getAttribute("aria-controls"));
    }
    items.forEach(function (li) {
      buttonOf(li).addEventListener("click", function () {
        var opening = buttonOf(li).getAttribute("aria-expanded") !== "true";
        items.forEach(function (other) {
          setOpen(buttonOf(other), panelOf(other), other === li && opening);
        });
      });
    });
    var hash = decodeURIComponent(window.location.hash.replace("#", ""));
    var target = hash && items.filter(function (li) { return li.id === hash; })[0];
    if (target) {
      items.forEach(function (other) {
        setOpen(buttonOf(other), panelOf(other), other === target);
      });
      setTimeout(function () {
        target.scrollIntoView({ block: "start" });
      }, 50);
    }
  });

  // "Read full transcript"
  all("[data-toggle]").forEach(function (button) {
    var panel = document.getElementById(button.getAttribute("data-toggle"));
    if (!panel) return;
    button.addEventListener("click", function () {
      setOpen(button, panel, button.getAttribute("aria-expanded") !== "true");
    });
  });

  // ---------- Our work: the pink dot follows the service area you are reading ----------
  all("[data-area-spy]").forEach(function (box) {
    var links = all("[data-area-link]", box);
    var dot = box.querySelector("[data-area-dot]");
    function activate(slug) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-area-link") === slug;
        if (on) {
          a.setAttribute("aria-current", "true");
          if (dot) dot.style.transform = "translateY(" + a.offsetTop + "px)";
        } else {
          a.removeAttribute("aria-current");
        }
      });
    }
    links.forEach(function (a) {
      a.addEventListener("click", function () {
        activate(a.getAttribute("data-area-link"));
      });
    });
    if (!("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activate(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    links.forEach(function (a) {
      var area = document.getElementById(a.getAttribute("data-area-link"));
      if (area) observer.observe(area);
    });
  });

  // ---------- The big photo on Our work moves a little as you scroll ----------
  if (!reduce) {
    all("[data-parallax]").forEach(function (section) {
      var photo = section.querySelector("[data-parallax-photo]");
      if (!photo) return;
      var ticking = false;
      function update() {
        ticking = false;
        var rect = section.getBoundingClientRect();
        var progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
        photo.style.transform = "translateY(" + (-6 + 12 * progress) + "%) scale(" + (1.08 - 0.08 * progress) + ")";
      }
      update();
      window.addEventListener(
        "scroll",
        function () {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        },
        { passive: true }
      );
    });
  }

  // ---------- Founder video: the real player only loads after clicking play ----------
  all("[data-video]").forEach(function (box) {
    var play = box.querySelector("[data-video-play]");
    var kind = box.getAttribute("data-kind");
    if (!play || kind === "none") return;
    play.addEventListener("click", function () {
      var src = box.getAttribute("data-src");
      var title = box.getAttribute("data-title");
      var player;
      if (kind === "file") {
        player = document.createElement("video");
        player.src = src;
        player.controls = true;
        player.autoplay = true;
        player.playsInline = true;
        player.className = "h-full w-full bg-black";
      } else {
        player = document.createElement("iframe");
        player.src = src;
        player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        player.allowFullscreen = true;
        player.className = "h-full w-full border-0";
      }
      player.title = title;
      var wrap = document.createElement("div");
      wrap.className = "card-in absolute inset-0";
      wrap.appendChild(player);
      box.querySelector("[data-video-poster]").remove();
      box.classList.add("overflow-hidden", "rounded-3xl", "bg-black");
      box.appendChild(wrap);
      player.focus();
    });
  });

  // ---------- "Share this video": copies the page address ----------
  all("[data-share]").forEach(function (button) {
    var label = button.querySelector("span");
    button.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () {
            label.textContent = "Link copied";
            setTimeout(function () {
              label.textContent = "Share this video";
            }, 2000);
          },
          function () {
            window.prompt("Copy this link:", url);
          }
        );
      } else {
        // Some browsers block the clipboard: show the link so it can be copied by hand
        window.prompt("Copy this link:", url);
      }
    });
  });

  // ---------- Filter chips: show the matching cards and let them grow in ----------
  function showCards(items, isShown) {
    var count = 0;
    items.forEach(function (li) {
      var on = isShown(li);
      li.hidden = !on;
      if (on) {
        count++;
        li.style.opacity = "";
        li.style.transform = "";
        li.classList.remove("card-in", "reveal-rise");
        void li.offsetWidth;
        li.classList.add("card-in");
      }
    });
    return count;
  }

  // Impact: year switcher and category filter
  all("[data-impact]").forEach(function (box) {
    var periods = all("[data-period]", box);
    var buttons = all("[data-period-button]", box);

    buttons.forEach(function (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        var period = button.getAttribute("data-period-button");
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === button));
        });
        periods.forEach(function (p) {
          var on = p.getAttribute("data-period") === period;
          p.hidden = !on;
          if (on) {
            var all_ = p.querySelector('[data-filter="All"]');
            if (all_) all_.click();
            all("[data-count-to]", p).forEach(function (el) {
              countUp(el);
            });
          }
        });
        window.history.replaceState(null, "", "?period=" + encodeURIComponent(period));
      });
    });

    periods.forEach(function (p) {
      var chips = all("[data-filter]", p);
      var items = all("li[data-category]", p);
      var status = p.querySelector("[data-filter-status]");
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          var category = chip.getAttribute("data-filter");
          chips.forEach(function (c) {
            c.setAttribute("aria-pressed", String(c === chip));
          });
          var count = showCards(items, function (li) {
            return category === "All" || li.getAttribute("data-category") === category;
          });
          if (status) status.textContent = count + (count === 1 ? " project" : " projects") + " shown";
        });
      });
    });
  });

  // Events: audience filter. Events for "Everyone" are shown under every filter.
  all("[data-events]").forEach(function (box) {
    var chips = all("[data-audience]", box);
    var items = all("li[data-event-audience]", box);
    var months = all("[data-month]", box);
    var status = box.querySelector("[data-filter-status]");
    var none = box.querySelector("[data-no-events]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        e.preventDefault();
        var audience = chip.getAttribute("data-audience");
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", String(c === chip));
        });
        var count = showCards(items, function (li) {
          var a = li.getAttribute("data-event-audience");
          return audience === "All" || a === audience || a === "Everyone";
        });
        months.forEach(function (m) {
          m.hidden = !all("li[data-event-audience]", m).some(function (li) {
            return !li.hidden;
          });
        });
        if (none) {
          none.hidden = count > 0;
          none.querySelector("[data-no-events-name]").textContent = audience.toLowerCase();
        }
        if (status) status.textContent = count + (count === 1 ? " event" : " events") + " shown";
        var slug = chip.getAttribute("data-audience-slug");
        window.history.replaceState(null, "", audience === "All" ? window.location.pathname : "?for=" + slug);
      });
    });
  });

  // ---------- Project photos: clicking one opens it big (a "lightbox") ----------
  // Arrow keys or the buttons go to the next/previous photo, Esc closes it, Tab stays inside,
  // and on close the focus goes back to the photo you clicked.
  all("[data-gallery]").forEach(function (gallery) {
    var triggers = all("button[data-src]", gallery);
    var count = triggers.length;
    var index = 0;
    var openedFrom = 0;
    var dialog = null;
    var oldOverflow = "";

    function render() {
      var t = triggers[index];
      dialog.setAttribute("aria-label", "Photo " + (index + 1) + " of " + count);
      var img = dialog.querySelector("img");
      img.src = t.getAttribute("data-src");
      img.alt = t.getAttribute("data-alt");
      img.parentNode.classList.remove("card-in");
      void img.offsetWidth;
      img.parentNode.classList.add("card-in");
      dialog.querySelector("[data-caption]").textContent = t.getAttribute("data-alt");
      dialog.querySelector("[data-counter]").textContent = " · " + (index + 1) + " / " + count;
    }

    function close() {
      if (!dialog) return;
      dialog.remove();
      dialog = null;
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKey);
      triggers[openedFrom].focus();
    }

    function step(direction) {
      index = (index + direction + count) % count;
      render();
    }

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        step(1);
      } else if (e.key === "ArrowLeft") {
        step(-1);
      } else if (e.key === "Tab") {
        var buttons = all("button", dialog);
        var first = buttons[0];
        var last = buttons[buttons.length - 1];
        if (!dialog.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    var round = "flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl transition-colors hover:bg-pink focus-visible:outline-white";

    function open(i) {
      index = i;
      openedFrom = i;
      dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.className = "card-in fixed inset-0 z-[60] flex flex-col items-center justify-center bg-plum/95 px-4 py-16 text-white";
      dialog.innerHTML =
        '<button type="button" data-close aria-label="Close" class="absolute right-4 top-4 ' + round + '">×</button>' +
        '<div class="relative h-[70vh] w-full max-w-5xl"><img class="absolute inset-0 h-full w-full object-contain" alt=""></div>' +
        '<p class="mt-4 max-w-3xl text-center text-white/85"><span data-caption></span><span class="text-white/60" data-counter></span></p>' +
        (count > 1
          ? '<button type="button" data-prev aria-label="Previous photo" class="absolute left-3 top-1/2 -translate-y-1/2 sm:left-6 ' + round + '">‹</button>' +
            '<button type="button" data-next aria-label="Next photo" class="absolute right-3 top-1/2 -translate-y-1/2 sm:right-6 ' + round + '">›</button>'
          : "");
      dialog.querySelector("[data-close]").addEventListener("click", close);
      if (count > 1) {
        dialog.querySelector("[data-prev]").addEventListener("click", function () {
          step(-1);
        });
        dialog.querySelector("[data-next]").addEventListener("click", function () {
          step(1);
        });
      }
      // A click on the dark background closes it
      dialog.addEventListener("click", function (e) {
        if (e.target === dialog) close();
      });
      document.body.appendChild(dialog);
      render();
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
      dialog.querySelector("[data-close]").focus();
    }

    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () {
        open(i);
      });
    });
  });

  // ---------- Forms: sent in the background, the answer replaces the form ----------
  // Without JavaScript they post normally and the page comes back with the answer.
  function sendForm(form, onDone) {
    var button = form.querySelector('button[type="submit"]');
    var error = form.querySelector('[role="alert"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      data.append("ajax", "1");
      button.disabled = true;
      var label = button.textContent;
      button.textContent = "Sending…";
      // (getAttribute: the hidden input named "action" hides form.action)
      fetch(form.getAttribute("action"), { method: "POST", body: data, credentials: "same-origin" })
        .then(function (response) {
          return response.json();
        })
        .then(function (answer) {
          if (answer.ok) {
            onDone(answer);
          } else {
            error.textContent = answer.error;
            error.hidden = false;
            button.disabled = false;
            button.textContent = label;
          }
        })
        .catch(function () {
          // Something went wrong in the background: send the form the normal way instead
          HTMLFormElement.prototype.submit.call(form);
        });
    });
  }

  // Contact form
  all("[data-contact-form]").forEach(function (form) {
    sendForm(form, function () {
      form.parentNode.innerHTML =
        '<div class="card-in rounded-3xl bg-pink-soft p-10 text-center" role="status">' +
        '<p class="font-display text-3xl font-bold text-pink">Message sent</p>' +
        "<p class=\"mt-3 text-muted\">Thank you for getting in touch. We'll reply as soon as we can.</p></div>";
    });
  });

  // Booking form: "Children's ages" only shows when children are booked
  all("[data-booking-form]").forEach(function (form) {
    var children = form.querySelector("[data-children]");
    var ages = form.querySelector("[data-child-ages]");
    function toggleAges() {
      ages.hidden = !(Number(children.value) > 0);
    }
    children.addEventListener("input", toggleAges);
    toggleAges();

    sendForm(form, function (answer) {
      var box = document.createElement("div");
      box.className = "card-in mt-5 rounded-2xl bg-white p-6";
      var title = document.createElement("p");
      title.className = "font-display text-2xl font-bold text-pink";
      title.textContent = answer.waitlist ? "You're on the waiting list" : "You're booked!";
      var text = document.createElement("p");
      text.className = "mt-2 text-ink";
      text.textContent = answer.message;
      box.appendChild(title);
      box.appendChild(text);
      form.parentNode.replaceChild(box, form);
    });
  });
})();
