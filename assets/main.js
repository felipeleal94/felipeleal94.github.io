/* Neon Noir · Luis Leal */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function store(key, val) {
    try {
      if (val === undefined) return sessionStorage.getItem(key);
      sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function type(el, text, speed, done) {
    if (reduce) { el.textContent = text; if (done) done(); return; }
    var i = 0;
    el.textContent = '';
    (function step() {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, speed);
      else if (done) done();
    })();
  }

  /* ---------- boot sequence: uma vez por sessão ---------- */
  var whoami = document.getElementById('whoami');
  var whoamiText = whoami ? whoami.textContent : '';
  if (whoami && !reduce) whoami.textContent = '';

  function startHero() {
    if (whoami) type(whoami, whoamiText, 30);
  }

  var booted = false;
  function boot(next) {
    if (reduce || store('ll-boot')) return next();
    store('ll-boot', '1');
    booted = true;
    var lines = [
      ['[ <span class="ok">OK</span> ] inicializando kernel neon-noir v1.0', 160],
      ['[ <span class="ok">OK</span> ] carregando regras de detecção · 11 SIEM/SOAR', 220],
      ['[ <span class="ok">OK</span> ] sincronizando feed de CTI', 200],
      ['[ <span class="ok">OK</span> ] mapeando TTPs · MITRE ATT&amp;CK', 200],
      ['[ <span class="ok">OK</span> ] montando /home/luis_leal', 180],
      ['<span class="go">&gt;&gt; acesso concedido</span>', 420]
    ];
    var wrap = document.createElement('div');
    wrap.className = 'boot';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<pre></pre><small>clique ou tecle para pular</small>';
    document.body.appendChild(wrap);
    var pre = wrap.firstChild, i = 0, finished = false, timer;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      wrap.classList.add('out');
      setTimeout(function () { wrap.remove(); }, 500);
      window.removeEventListener('keydown', finish);
      next();
    }
    (function line() {
      if (i >= lines.length) { timer = setTimeout(finish, 120); return; }
      pre.innerHTML += (i ? '\n' : '') + lines[i][0];
      timer = setTimeout(line, lines[i++][1]);
    })();
    wrap.addEventListener('click', finish);
    window.addEventListener('keydown', finish);
  }
  boot(startHero);

  /* ---------- contadores ---------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = +el.getAttribute('data-count');
    if (reduce) return;
    var t0 = null, dur = 1400;
    el.textContent = '0';
    function tick(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    }
    setTimeout(function () { requestAnimationFrame(tick); }, booted ? 1700 : 300);
  });

  /* ---------- nav: fundo ao rolar, grid some, menu mobile ---------- */
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    nav.classList.toggle('solid', y > 24);
    if (hero) hero.style.setProperty('--floor-o', Math.max(0, 1 - y / (hero.offsetHeight * 0.7)).toFixed(3));
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  var btn = document.querySelector('.menu-btn');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.sr').textContent = open ? 'Fechar menu' : 'Abrir menu';
    links.classList.toggle('open', open);
    nav.classList.toggle('open', open);
  }
  btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- seções: comando digitado, varredura, link ativo ---------- */
  var navLinks = {};
  document.querySelectorAll('.nav-links a').forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });

  if (hasIO) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var sec = en.target;
        seen.unobserve(sec);
        sec.classList.add('scan');
        var cmd = sec.querySelector('.cmd');
        var t = cmd && cmd.querySelector('[data-type]');
        if (t && !reduce) {
          cmd.classList.add('typing');
          type(t, t.getAttribute('data-full'), 38, function () {
            setTimeout(function () { cmd.classList.remove('typing'); }, 900);
          });
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.sec').forEach(function (sec) {
      var t = sec.querySelector('[data-type]');
      if (t) { t.setAttribute('data-full', t.textContent); if (!reduce) t.textContent = ''; }
      seen.observe(sec);
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = navLinks[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.remove('on'); });
          a.classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.sec, .hero').forEach(function (s) { spy.observe(s); });

    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rev.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) % 7) * 60 + 'ms';
      rev.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- copiar e-mail ---------- */
  var toast = document.querySelector('.toast'), toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('on'); }, 2200);
  }
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(v).then(function () { say('e-mail copiado'); }, function () { say(v); });
      } else { say(v); }
    });
  });
})();
