const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const menuButton = $('.menu-button');
const navigation = $('#primary-nav');
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
$$('a', navigation).forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.focus();
  }
});

const sectionLinks = $$('a[href^="#"]', navigation).filter(link => !link.classList.contains('nav-cta'));
const linkedSections = sectionLinks.map(link => document.querySelector(link.hash)).filter(Boolean);
if ('IntersectionObserver' in window) {
  const navigationObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach(link => {
      const current = link.hash === `#${visible.target.id}`;
      link.classList.toggle('active', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -65%', threshold: [0, .2, .5] });
  linkedSections.forEach(section => navigationObserver.observe(section));
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = $$('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('visible'));
else {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: .1 });
  reveals.forEach(el => observer.observe(el));
}

const crackSamples = [
  { masked: '••••••••••', clear: 'Password1', guesses: '2,410', time: '0.1 s', reason: 'Common word + digit' },
  { masked: '••••••••••••', clear: 'Bakery2024!', guesses: '18,320', time: '0.4 s', reason: 'Word + year + symbol' },
  { masked: '•••••••••••', clear: 'Tr0ub4dor&3', guesses: '9.7 billion', time: 'Minutes*', reason: 'Known substitution pattern' },
  { masked: '••••••••••••••••••••••••', clear: 'coral tractor velvet mango', guesses: 'Very large', time: 'Much longer*', reason: 'Four unrelated words' }
];
let crackIndex = 0;
let crackTimer;
function loadCrackSample() {
  clearInterval(crackTimer);
  const sample = crackSamples[crackIndex];
  $('#sample-count').textContent = `Sample ${crackIndex + 1} of ${crackSamples.length}`;
  $('#crack-password').textContent = sample.masked;
  $('#guess-count').textContent = '0';
  $('#time-count').textContent = '0.0 s';
  $('#fall-reason').textContent = '—';
  $('#terminal-status').innerHTML = '<span></span> Standing by…';
  $('#run-crack').disabled = false;
}
$('#next-sample').addEventListener('click', () => { crackIndex = (crackIndex + 1) % crackSamples.length; loadCrackSample(); });
$('#run-crack').addEventListener('click', () => {
  const sample = crackSamples[crackIndex];
  $('#run-crack').disabled = true;
  $('#terminal-status').innerHTML = '<span></span> Testing candidate lists…';
  let frame = 0;
  crackTimer = setInterval(() => {
    frame += 1;
    $('#guess-count').textContent = Math.floor(Math.random() * 900000 + 100000).toLocaleString();
    $('#time-count').textContent = `${(frame / 10).toFixed(1)} s`;
    if (frame >= 12) {
      clearInterval(crackTimer);
      $('#crack-password').textContent = sample.clear;
      $('#guess-count').textContent = sample.guesses;
      $('#time-count').textContent = sample.time;
      $('#fall-reason').textContent = sample.reason;
      $('#terminal-status').innerHTML = crackIndex === 3 ? '<span class="safe"></span> Resisted simple lists' : '<span class="danger"></span> Password identified';
      $('#run-crack').disabled = false;
    }
  }, 80);
});

const autopsy = {
  word: ['Dictionary word', '“Bakery” may relate to the business and appears in ordinary language lists. Attackers test meaningful words early.'],
  year: ['Predictable year', 'Recent years, birthdays and opening dates are tested as common suffixes—not treated as random digits.'],
  symbol: ['Expected ending', 'An exclamation mark at the end is one of the first substitutions cracking rules try.']
};
$$('[data-autopsy]').forEach(button => button.addEventListener('click', () => {
  $$('[data-autopsy]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const [label, copy] = autopsy[button.dataset.autopsy];
  $('#autopsy-label').textContent = label;
  $('#autopsy-copy').textContent = copy;
}));

const passwordInput = $('#password-input');
$('#toggle-password').addEventListener('click', event => {
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});
const commonPattern = /(password|qwerty|letmein|welcome|admin|bakery|melbourne|deakin)/i;
function updateLab() {
  const value = passwordInput.value;
  const words = value.trim().split(/[\s._-]+/).filter(Boolean);
  const checks = {
    length: value.length >= 15,
    chunks: words.length >= 4,
    known: value.length > 0 && !commonPattern.test(value),
    pattern: value.length > 0 && !/(19|20)\d{2}|123|abc|!$|(.)\1{2}/i.test(value)
  };
  Object.entries(checks).forEach(([key, passed]) => $(`#${key}-check`).classList.toggle('met', passed));
  const score = value ? Object.values(checks).filter(Boolean).length : 0;
  $('.strength-bars').className = `strength-bars score-${score}`;
  $('#strength-score').textContent = `${score} / 4 checks`;
  $('#strength-label').textContent = value ? ['Very weak', 'Very weak', 'Needs work', 'Better', 'Strong habits'][score] : 'Waiting for input';
  $('#length-value').textContent = value.length;
  if (!value) { $('#crack-time').textContent = '—'; $('#guess-estimate').textContent = '—'; return; }
  const pool = (/[a-z]/.test(value) ? 26 : 0) + (/[A-Z]/.test(value) ? 26 : 0) + (/\d/.test(value) ? 10 : 0) + (/[^\w\s]/.test(value) ? 20 : 0) + (/\s/.test(value) ? 1 : 0);
  const logGuesses = Math.max(0, value.length * Math.log10(Math.max(pool, 1)));
  $('#guess-estimate').textContent = logGuesses > 15 ? `10^${Math.round(logGuesses)}` : Math.round(10 ** Math.min(logGuesses, 12)).toLocaleString();
  $('#crack-time').textContent = score <= 1 ? 'Very quickly' : score === 2 ? 'Potentially short' : score === 3 ? 'Substantially longer' : 'Strong against simple guessing';
}
passwordInput.addEventListener('input', updateLab);
$$('.sample-row button').forEach(button => button.addEventListener('click', () => { passwordInput.value = button.textContent; updateLab(); passwordInput.focus(); }));

const wordBank = [['cobalt','lantern','meadow','piano'],['otter','cactus','harbour','violet'],['pepper','comet','window','forest'],['tulip','anchor','silver','kettle'],['mango','ribbon','planet','creek']];
$('#generate-passphrase').addEventListener('click', () => {
  const words = wordBank[Math.floor(Math.random() * wordBank.length)];
  $('#generated-passphrase').textContent = words.join(' · ');
  $('#phrase-estimate').textContent = `${words.join(' ').length} characters, four unrelated words`;
});

const accounts = $$('#account-map div');
let attackTimers = [];
function resetAttack() {
  attackTimers.forEach(clearTimeout); attackTimers = [];
  accounts.forEach((account, index) => { account.className = index === 0 ? 'breached' : ''; });
  $('#attack-status').textContent = 'Ready.';
  $('#run-attack').disabled = false;
}
$('#run-attack').addEventListener('click', () => {
  resetAttack();
  $('#run-attack').disabled = true;
  const reuse = $('#reuse-toggle').checked;
  $('#attack-status').textContent = 'Bots are replaying Sam’s stolen login…';
  accounts.slice(1).forEach((account, index) => attackTimers.push(setTimeout(() => {
    account.classList.add(reuse ? 'compromised' : 'blocked');
    if (index === accounts.length - 2) {
      $('#attack-status').textContent = reuse ? 'Seven more accounts compromised. One breach became eight.' : 'Seven attempts blocked. Unique passwords contained the breach.';
      $('#run-attack').disabled = false;
    }
  }, 450 * (index + 1))));
});
$('#reset-attack').addEventListener('click', resetAttack);
$('#reuse-toggle').addEventListener('change', resetAttack);
resetAttack();

const questions = [
  { q: 'Which is the safest choice for a new work account?', a: ['Bakery2026!', 'The same strong password used for banking', 'A unique password generated by an approved manager'], c: 2, why: 'A manager makes length and uniqueness practical.' },
  { q: 'Why is “Spring2026!” risky across a team?', a: ['It is too long', 'Attackers can spray it across every staff account', 'Symbols are never allowed'], c: 1, why: 'Password spraying tests one common choice against many accounts.' },
  { q: 'A shopping site reports a breach and you reused its password for work email. What now?', a: ['Wait for an alert', 'Add another symbol', 'Report it and replace every reused copy with unique passwords'], c: 2, why: 'Fast reporting and removing every reused copy contains the blast radius.' },
  { q: 'What best describes credential stuffing?', a: ['Testing stolen login pairs on other services', 'Sending invoice phishing emails', 'Guessing Wi-Fi passwords manually'], c: 0, why: 'Credential stuffing replays credentials stolen somewhere else.' },
  { q: 'What should protect business email in addition to a unique password?', a: ['A shared staff login', 'Multi-factor authentication', 'A 90-day password calendar'], c: 1, why: 'MFA adds a second check when a password is stolen.' }
];
let qIndex = 0, quizScore = 0, answered = false;
function renderQuestion() {
  const item = questions[qIndex]; answered = false;
  $('#quiz-number').textContent = String(qIndex + 1).padStart(2, '0');
  $('#quiz-question').textContent = item.q;
  $('#quiz-options').replaceChildren();
  item.a.forEach((answer, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'quiz-option'; button.textContent = answer;
    button.addEventListener('click', () => chooseAnswer(index, button)); $('#quiz-options').append(button);
  });
  $('#quiz-feedback').textContent = ''; $('#quiz-next').disabled = true;
  $('#progress-text').textContent = `Question ${qIndex + 1} of ${questions.length}`;
  $('#progress-bar').style.width = `${((qIndex + 1) / questions.length) * 100}%`;
  $('#quiz-next').textContent = qIndex === questions.length - 1 ? 'See my result' : 'Next question';
}
function chooseAnswer(index, button) {
  if (answered) return; answered = true;
  const item = questions[qIndex], correct = index === item.c;
  if (correct) quizScore += 1;
  $$('.quiz-option').forEach((option, optionIndex) => { option.disabled = true; if (optionIndex === item.c) option.classList.add('selected','correct'); });
  if (!correct) button.classList.add('selected','wrong');
  $('#quiz-feedback').textContent = `${correct ? 'Correct.' : 'Not quite.'} ${item.why}`;
  $('#quiz-feedback').style.color = correct ? 'var(--lime)' : 'var(--red)'; $('#quiz-next').disabled = false;
}
$('#quiz-next').addEventListener('click', () => {
  if (qIndex < questions.length - 1) { qIndex += 1; renderQuestion(); return; }
  $('#quiz-content').hidden = true; $('#quiz-result').hidden = false; $('#result-score').textContent = `${quizScore}/5`;
  $('#result-title').textContent = quizScore === 5 ? 'Ready to brief the team' : quizScore >= 3 ? 'Good instincts' : 'Take another look';
  $('#result-message').textContent = quizScore === 5 ? 'You can recognise the risks and the practical fixes.' : 'Review the highlighted sections and try once more.';
});
$('#quiz-restart').addEventListener('click', () => { qIndex = 0; quizScore = 0; $('#quiz-content').hidden = false; $('#quiz-result').hidden = true; renderQuestion(); });
renderQuestion();

const checklistInputs = $$('#action-checklist input');
function saveChecklist() {
  const values = checklistInputs.map(input => input.checked);
  try { localStorage.setItem('passwordPulseChecklist', JSON.stringify(values)); } catch (_) {}
  $('#checklist-count').textContent = `${values.filter(Boolean).length} of ${values.length} complete`;
}
try {
  const saved = JSON.parse(localStorage.getItem('passwordPulseChecklist') || '[]');
  checklistInputs.forEach((input, index) => { input.checked = Boolean(saved[index]); });
} catch (_) {}
checklistInputs.forEach(input => input.addEventListener('change', saveChecklist));
$('#reset-checklist').addEventListener('click', () => { checklistInputs.forEach(input => { input.checked = false; }); saveChecklist(); });
saveChecklist();
