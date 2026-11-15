// Рисунки кругов Эйлера для разборов задач: App.drawEuler(spec) -> <svg>.
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var BLUE = '#2c4a7a', GREEN = '#22865a', ROSE = '#cf4368', INK = '#1b2232';

  function s(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }

  function circle(svg, cx, cy, r, color, op) {
    return s('circle', { cx: cx, cy: cy, r: r, fill: color, 'fill-opacity': op || 0.2, stroke: color, 'stroke-width': 2 }, svg);
  }

  // Одна строка текста; шрифт уменьшается, чтобы влезть в maxW.
  function line(svg, x, y, str, size, color, anchor, weight, maxW) {
    var fs = size;
    if (maxW) fs = Math.min(size, Math.floor(maxW / (str.length * 0.6) * 10) / 10);
    var t = s('text', {
      x: x, y: y, 'font-size': fs, 'font-weight': weight || 400, fill: color,
      'text-anchor': anchor || 'middle', 'font-family': 'inherit'
    }, svg);
    t.textContent = str;
    return t;
  }

  // Разбивает длинную подпись на две строки по пробелу, ближайшему к середине.
  function wrap(str, limit) {
    if (str.length <= limit || str.indexOf(' ') < 0) return [str];
    var mid = str.length / 2, best = -1, i;
    for (i = 0; i < str.length; i++) {
      if (str.charAt(i) === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    }
    return [str.slice(0, best), str.slice(best + 1)];
  }

  // Подпись над/рядом с кругом; baseY — y последней строки.
  function label(svg, x, baseY, str, color, anchor, maxW, size) {
    var lines = wrap(str, 16), fs = size || 15;
    lines.forEach(function (ln, i) {
      line(svg, x, baseY - (lines.length - 1 - i) * (fs + 3), ln, fs, color, anchor, 700, maxW);
    });
  }

  function num(svg, x, y, v, size) {
    line(svg, x, y + size * 0.35, String(v), size, INK, 'middle', 700);
  }

  function outside(svg, y, n) {
    if (n > 0) line(svg, 180, y, 'вне кругов: ' + n, 14, INK, 'middle', 400);
  }

  function make(h) {
    return s('svg', {
      viewBox: '0 0 360 ' + h, width: '100%', role: 'img',
      style: 'display:block;max-width:360px;margin:12px auto 0'
    });
  }

  function two(spec) {
    var r = spec.r, A = spec.sets[0], B = spec.sets[1];
    var svg = make(r.O > 0 ? 246 : 218);
    circle(svg, 135, 125, 75, BLUE, 0.2);
    circle(svg, 225, 125, 75, GREEN, 0.22);
    label(svg, 172, 28, A, BLUE, 'end', 165);
    label(svg, 188, 28, B, GREEN, 'start', 165);
    num(svg, 100, 125, r.A, 24);
    num(svg, 180, 125, r.AB, 24);
    num(svg, 260, 125, r.B, 24);
    outside(svg, 236, r.O);
    return svg;
  }

  function three(spec) {
    var r = spec.r, S = spec.sets;
    var svg = make(r.O > 0 ? 340 : 312);
    circle(svg, 135, 125, 72, BLUE, 0.2);
    circle(svg, 225, 125, 72, GREEN, 0.22);
    circle(svg, 180, 203, 72, ROSE, 0.22);
    label(svg, 160, 28, S[0], BLUE, 'end', 150);
    label(svg, 200, 28, S[1], GREEN, 'start', 150);
    label(svg, 180, 296, S[2], ROSE, 'middle', 300);
    num(svg, 98, 105, r.A, 20);
    num(svg, 262, 105, r.B, 20);
    num(svg, 180, 252, r.C, 20);
    num(svg, 180, 88, r.AB, 20);
    num(svg, 134, 178, r.AC, 20);
    num(svg, 226, 178, r.BC, 20);
    num(svg, 180, 140, r.ABC, 20);
    outside(svg, 330, r.O);
    return svg;
  }

  // A внутри B слева, C пересекает B справа и не касается A.
  function aInBCrossC(spec) {
    var S = spec.sets, svg = make(232);
    circle(svg, 150, 140, 85, GREEN, 0.2);
    circle(svg, 265, 140, 70, ROSE, 0.22);
    circle(svg, 112, 145, 36, BLUE, 0.28);
    label(svg, 135, 32, S[1], GREEN, 'middle', 150);
    label(svg, 285, 52, S[2], ROSE, 'middle', 120);
    line(svg, 112, 149, S[0], 13, BLUE, 'middle', 700, 58);
    return svg;
  }

  // Три вложенных круга: A внутри B, B внутри C.
  function nested3(spec) {
    var S = spec.sets, svg = make(284);
    circle(svg, 180, 165, 112, ROSE, 0.2);
    circle(svg, 180, 198, 76, GREEN, 0.22);
    circle(svg, 180, 229, 44, BLUE, 0.28);
    label(svg, 180, 38, S[2], ROSE, 'middle', 300);
    line(svg, 180, 156, S[1], 15, GREEN, 'middle', 700, 120);
    line(svg, 180, 232, S[0], 13, BLUE, 'middle', 700, 68);
    return svg;
  }

  function rel(spec) {
    var A = spec.sets[0], B = spec.sets[1], svg = make(224);
    switch (spec.rel) {
      case 'cross':
        circle(svg, 135, 130, 70, BLUE, 0.2);
        circle(svg, 225, 130, 70, GREEN, 0.22);
        label(svg, 172, 40, A, BLUE, 'end', 165);
        label(svg, 188, 40, B, GREEN, 'start', 165);
        break;
      case 'apart':
        circle(svg, 95, 135, 62, BLUE, 0.2);
        circle(svg, 265, 135, 62, GREEN, 0.22);
        label(svg, 95, 45, A, BLUE, 'middle', 160);
        label(svg, 265, 45, B, GREEN, 'middle', 160);
        break;
      case 'AinB':
      case 'BinA':
        var inA = spec.rel === 'BinA';
        var big = inA ? A : B, small = inA ? B : A;
        var bigC = inA ? BLUE : GREEN, smallC = inA ? GREEN : BLUE;
        circle(svg, 180, 132, 82, bigC, 0.2);
        circle(svg, 180, 160, 40, smallC, 0.28);
        label(svg, 180, 32, big, bigC, 'middle', 340);
        var sl = wrap(small, 9);
        sl.forEach(function (ln, i) {
          line(svg, 180, 160 + (i - (sl.length - 1) / 2) * 14 + 4, ln, 13, smallC, 'middle', 700, 56);
        });
        break;
      default: // equal
        circle(svg, 180, 138, 72, BLUE, 0.2);
        circle(svg, 180, 138, 72, GREEN, 0.22);
        line(svg, 180, 22, A, 15, BLUE, 'middle', 700, 340);
        line(svg, 180, 42, '= ' + B, 15, GREEN, 'middle', 700, 340);
        line(svg, 180, 150, '=', 36, INK, 'middle', 700);
    }
    return svg;
  }

  App.drawEuler = function (spec) {
    if (spec.rel === 'AinB_CcrossB') return aInBCrossC(spec);
    if (spec.rel === 'nested3') return nested3(spec);
    if (spec.r) return spec.sets.length === 3 ? three(spec) : two(spec);
    return rel(spec);
  };
})();
