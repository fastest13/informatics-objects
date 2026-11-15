// Режим 3: реши задачи (круги Эйлера и задачи по информатике).
(function () {
  'use strict';

  var YESNO = ['Верно', 'Неверно', 'Нельзя определить'];

  function build(item, fixed) {
    var texts = fixed ? YESNO.slice() : App.shuffle([item.a].concat(item.wrong));
    return {
      prompt: item.q,
      options: texts.map(function (t) { return { text: t, correct: t === item.a }; }),
      explain: function () {
        return App.el('div', { class: 'explain' }, [
          App.el('p', { class: 'explain-why', text: '💡 ' + item.why }),
          item.euler ? App.drawEuler(item.euler) : null
        ]);
      }
    };
  }

  App.modes.tasks = {
    title: 'Реши задачи',
    start: function (c) {
      var E = window.EULER, T = window.TASKS;
      var count = E.filter(function (e) { return e.euler && e.euler.r; });
      var yesno = E.filter(function (e) { return YESNO.indexOf(e.a) >= 0; });
      var how = E.filter(function (e) {
        return e.euler && e.euler.rel && YESNO.indexOf(e.a) < 0 && /Как связаны эти множества\?$/.test(e.q);
      });
      var qs = [];
      App.sample(count, 2).forEach(function (e) { qs.push(build(e, false)); });
      App.sample(yesno, 1).forEach(function (e) { qs.push(build(e, true)); });
      App.sample(how, 1).forEach(function (e) { qs.push(build(e, false)); });

      var topics = [];
      T.forEach(function (t) { if (topics.indexOf(t.topic) < 0) topics.push(t.topic); });
      App.sample(topics, 6).forEach(function (tp) {
        var pool = T.filter(function (t) { return t.topic === tp; });
        qs.push(build(App.sample(pool, 1)[0], false));
      });

      App.runQuiz({
        container: c,
        title: App.modes.tasks.title,
        questions: App.shuffle(qs),
        restart: function () { App.modes.tasks.start(c); window.scrollTo(0, 0); }
      });
    }
  };
})();
