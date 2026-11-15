const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class Node {
  constructor(tag, attrs = {}, children = []) {
    this.tag = tag;
    this.attrs = attrs;
    this.children = [].concat(children).filter(Boolean);
    this.listeners = {};
    if (attrs.onclick) this.listeners.click = attrs.onclick;
    this.text = attrs.text || '';
    this.classes = new Set((attrs.class || '').split(' '));
    this.classList = { add: name => this.classes.add(name) };
  }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(' '); }
  appendChild(child) { this.children.push(child); return child; }
  insertBefore(child) { return this.appendChild(child); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  click() { assert(!this.hidden); this.listeners.click(); }
  scrollIntoView() {}
}

function descendants(node) {
  return [node].concat(node.children.flatMap(descendants));
}

function quiz() {
  let now = 0;
  let result;
  let bonusExplanations = 0;
  let bonusAnswers = 0;
  const context = { window: { scrollTo() {} }, performance: { now: () => now } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/common.js'), 'utf8'), context);
  const app = context.window.App;
  app.el = (tag, attrs, children) => new Node(tag, attrs, children);
  app.modeHeader = () => {};
  app.scrollTo = () => {};
  app.renderResultHeader = (container, score, total) => {
    result = { score, total };
    return container.appendChild(new Node('div', { text: 'Result' }));
  };
  const container = new Node('main');
  app.runQuiz({
    container,
    title: 'Test',
    questions: [
      { prompt: 'Regular', options: [{ text: 'Regular correct', correct: true }, { text: 'Regular wrong', correct: false }] },
      {
        prompt: 'Bonus', bonus: { points: 2 },
        options: [{ text: 'Bonus correct', correct: true }, { text: 'Bonus wrong', correct: false }],
        explain: () => { bonusExplanations++; return new Node('p', { text: 'Secret explanation' }); },
        onAnswer: () => { bonusAnswers++; }
      }
    ],
    restart() {}
  });
  const findButton = text => descendants(container).find(node => node.tag === 'button' && node.text === text);
  return {
    container,
    app,
    setTime: value => { now = value; },
    click: text => { const button = findButton(text); assert(button, text); button.click(); },
    get result() { return result; },
    get bonusExplanations() { return bonusExplanations; },
    get bonusAnswers() { return bonusAnswers; }
  };
}

for (const answer of ['Bonus correct', 'Bonus wrong']) {
  for (const elapsed of [0, 12500, 19999]) {
    test(`early ${answer} at ${elapsed} ms stays ungraded and hidden through results`, () => {
      const q = quiz();
      q.click('Regular correct');
      q.click('Далее');
      // Time spent reading the introduction does not count toward solving the task.
      q.setTime(60000);
      q.click('Решать');
      q.setTime(60000 + elapsed);
      q.click(answer);
      const seconds = (Math.floor(elapsed / 100) / 10).toFixed(1).replace('.', ',');
      assert(q.container.textContent.includes('прошло ' + seconds + ' с.'));
      assert(q.container.textContent.includes('Вряд ли за такое время можно честно решить эту задачу.'));
      assert(q.container.textContent.includes('Ответ не засчитан'));
      assert(!descendants(q.container).some(node => node.classes.has('correct') || node.classes.has('wrong')));
      assert.equal(q.bonusExplanations, 0);
      assert.equal(q.bonusAnswers, 0);
      // Waiting and choosing again cannot turn the rejected response into a scored one.
      q.setTime(120000);
      q.click('Bonus correct');
      assert.equal(q.bonusAnswers, 0);
      q.click('Результат');
      assert.deepEqual(q.result, { score: 1, total: 1 });
      assert(q.container.textContent.includes('Ответ не засчитан'));
      assert(!/Bonus correct|Bonus wrong|Secret explanation|Правильно:|Бонусная задача (не решена|решена)/.test(q.container.textContent));
      assert.equal(q.bonusExplanations, 0);
    });
  }
}

for (const elapsed of [20000, 25000]) {
  for (const correct of [true, false]) {
    test(`${correct ? 'correct' : 'wrong'} bonus at ${elapsed} ms is graded normally`, () => {
      const q = quiz();
      q.click('Regular correct');
      q.click('Далее');
      q.click('Решать');
      q.setTime(elapsed);
      q.click(correct ? 'Bonus correct' : 'Bonus wrong');
      assert.equal(q.bonusExplanations, 1);
      assert.equal(q.bonusAnswers, 1);
      assert(descendants(q.container).some(node => node.classes.has('correct')));
      assert.equal(descendants(q.container).some(node => node.classes.has('wrong')), !correct);
      q.click('Результат');
      assert.deepEqual(q.result, { score: correct ? 3 : 1, total: 1 });
      assert(!q.container.textContent.includes('Ответ не засчитан'));
      if (!correct) assert(q.container.textContent.includes('Правильно: Bonus correct'));
    });
  }
}

test('regular responses remain graded immediately', () => {
  const q = quiz();
  q.click('Regular wrong');
  assert(descendants(q.container).some(node => node.classes.has('wrong')));
  q.click('Далее');
  q.click('Решать');
  q.setTime(20000);
  q.click('Bonus correct');
  q.click('Результат');
  assert.deepEqual(q.result, { score: 2, total: 1 });
  assert(q.container.textContent.includes('Правильно: Regular correct'));
});
