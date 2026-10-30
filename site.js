
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.grid > *').forEach(function (n, i) { n.style.setProperty('--i', Math.min(i, 12)); });

  /* count-up numbers (final text is already in the markup and restored by timeout) */
  if (!reduce) {
    document.querySelectorAll('[data-to]').forEach(function (el) {
      var to = +el.getAttribute('data-to'), pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '', t0 = null;
      var fin = pre + to + suf;
      el.textContent = pre + '0' + suf;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / 1100, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(to * e) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      setTimeout(function () { el.textContent = fin; }, 1500);
    });
  }

  /* tile tilt toward the cursor */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.t').forEach(function (t) {
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        var m = r.width > 700 ? 1.4 : 4.5;
        t.style.setProperty('--ry', ((px - 0.5) * 2 * m) + 'deg');
        t.style.setProperty('--rx', (-(py - 0.5) * 2 * m) + 'deg');
        t.style.setProperty('--gx', (px * 100) + '%');
        t.style.setProperty('--gy', (py * 100) + '%');
      });
      t.addEventListener('pointerleave', function () {
        t.style.setProperty('--rx', '0deg');
        t.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* copy email */
  var btn = document.getElementById('copy'), out = document.getElementById('copied'), mail = document.getElementById('mail');
  function selectMail() {
    var range = document.createRange(); range.selectNodeContents(mail);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }
  btn.addEventListener('click', function () {
    function done(msg) { out.textContent = msg; setTimeout(function () { out.textContent = ''; }, 2500); }
    try {
      navigator.clipboard.writeText(mail.textContent.trim()).then(function () { done('Copied'); }, function () { selectMail(); done('Selected, press copy'); });
    } catch (e) { selectMail(); done('Selected, press copy'); }
  });
})();

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* reading progress bar */
  var prog = document.getElementById('prog');
  if (prog) {
    var tick = false;
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* cursor glow */
  var glow = document.querySelector('.glow');
  if (glow && fine && !reduce) {
    window.addEventListener('pointermove', function (e) {
      glow.style.setProperty('--mx', e.clientX + 'px');
      glow.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  /* reveal tiles as they scroll into view */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var el = x.target; io.unobserve(el);
        el.classList.add('in');
        setTimeout(function () { el.classList.remove('rv'); el.classList.remove('in'); }, 800);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.grid > .t, .grid > .marquee, .grid > h2').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.95) { el.classList.add('rv'); io.observe(el); }
    });
  }

  /* project filter */
  var fbs = document.querySelectorAll('.chipbtn');
  fbs.forEach(function (b) {
    b.addEventListener('click', function () {
      fbs.forEach(function (x) { x.classList.toggle('on', x === b); });
      var f = b.getAttribute('data-f');
      var cards = [].slice.call(document.querySelectorAll('[data-cat]')), shown = 0;
      cards.forEach(function (c) {
        c.hidden = !(f === 'all' || c.getAttribute('data-cat').split(' ').indexOf(f) > -1);
        if (!c.hidden) shown++;
      });
      cards.forEach(function (c) {
        c.style.gridColumn = (f === 'all' || c.hidden) ? '' : 'span ' + (shown >= 3 ? 4 : 12 / shown);
      });
    });
  });

  /* step-through diagrams */
  document.querySelectorAll('[data-stepper]').forEach(function (root) {
    var steps = [].slice.call(root.querySelectorAll('.step'));
    var pt = root.querySelector('.ptitle'), pb = root.querySelector('.pbody'), play = root.querySelector('.play');
    var timer = null, cur = 0;
    function show(i) {
      cur = i;
      steps.forEach(function (s, n) { s.classList.toggle('on', n === i); s.classList.toggle('done', n < i); s.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      pt.textContent = (i + 1) + '. ' + steps[i].getAttribute('data-t');
      pb.textContent = steps[i].getAttribute('data-d');
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } play.innerHTML = '&#9654; ' + play.getAttribute('data-label'); }
    play.setAttribute('data-label', play.textContent.replace(/^\s*\S\s*/, '').trim());
    steps.forEach(function (s, n) { s.addEventListener('click', function () { stop(); show(n); }); });
    play.addEventListener('click', function () {
      if (timer) { stop(); return; }
      var i = 0; show(0); play.innerHTML = '&#9632; Stop';
      timer = setInterval(function () {
        i++;
        if (i >= steps.length) { stop(); steps.forEach(function (s) { s.classList.add('done'); }); return; }
        show(i);
      }, reduce ? 2200 : 1300);
    });
    show(0);
  });

  /* colourful circle field in the hero */
  var cv = document.getElementById('dots');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cols = ['#8FD0B0', '#FF7A6B', '#FFD9A3', '#B9A0E6', '#5B4A8F', '#FF9A5B', '#F28CF0'];
    var rot = 0, px = 0, py = 0, tx = 0, ty = 0, raf = 0, vis = true;
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var cx = W * 0.62 + px, cy = H * 0.5 + py, N = 150, sc = Math.min(W, H) / 2 / Math.sqrt(N) * 0.92;
      for (var i = N; i >= 1; i--) {
        var a = i * 2.39996 + rot, rr = sc * Math.sqrt(i);
        var rad = 2 + (i / N) * Math.min(W, H) * 0.044;
        ctx.beginPath();
        ctx.fillStyle = cols[i % cols.length];
        ctx.globalAlpha = 0.25 + 0.75 * (i / N);
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rad, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function loop() {
      rot += 0.0016; px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      draw(); raf = vis && !document.hidden ? requestAnimationFrame(loop) : 0;
    }
    function go() { if (!raf && !reduce) raf = requestAnimationFrame(loop); }
    size(); draw();
    window.addEventListener('resize', function () { size(); draw(); });
    if (!reduce) {
      var hero = cv.parentNode;
      if (fine) hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * -26; ty = ((e.clientY - r.top) / r.height - 0.5) * -26;
      });
      document.addEventListener('visibilitychange', go);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) go(); }).observe(cv);
      go();
    }
  }
})();
