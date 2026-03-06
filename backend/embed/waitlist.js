(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[src*="waitlist.js"][data-project-id]') || document.querySelector('script[src*="waitlist.js"]');
  var apiBase = (script && script.getAttribute('data-api')) || '';
  if (!apiBase) apiBase = typeof location !== 'undefined' && location.origin ? location.origin : '';
  var targetId = (script && script.getAttribute('data-target')) || 'validatey-waitlist';
  if (!apiBase) return;
  var api = apiBase.replace(/\/$/, '');
  var projectId = (script && script.getAttribute('data-project-id')) || null;

  function run() {
    var container = document.getElementById(targetId);
    if (!container) return;

  var form = document.createElement('form');
  form.className = 'validatey-waitlist-embed';
  form.innerHTML = '<input id="validatey-waitlist-email" name="email" type="email" placeholder="Enter your email to join the waitlist" required class="validatey-waitlist-input">' +
    '<button type="submit" class="validatey-waitlist-btn">Join waitlist</button>' +
    '<div class="validatey-waitlist-msg" role="status" aria-live="polite"></div>';

  var style = document.createElement('style');
  style.textContent = '.validatey-waitlist-embed{display:flex;flex-direction:column;gap:.75rem;width:100%;max-width:400px;}' +
    '.validatey-waitlist-input{width:100%;padding:.875rem 1rem;border:1px solid #d1d5db;border-radius:.5rem;font-size:1rem;}' +
    '.validatey-waitlist-input:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1);}' +
    '.validatey-waitlist-btn{padding:.875rem 1.5rem;background:#0d9488;color:#fff;border:none;border-radius:.5rem;font-size:1rem;font-weight:600;cursor:pointer;}' +
    '.validatey-waitlist-btn:hover:not(:disabled){background:#0f766e;}' +
    '.validatey-waitlist-btn:disabled{opacity:.6;cursor:not-allowed;}' +
    '.validatey-waitlist-msg{padding:.75rem 1rem;border-radius:.5rem;font-size:.875rem;}' +
    '.validatey-waitlist-msg.success{background:#d1fae5;color:#065f46;}' +
    '.validatey-waitlist-msg.error{background:#fee2e2;color:#991b1b;}';
  document.head.appendChild(style);

  var input = form.querySelector('.validatey-waitlist-input');
  var btn = form.querySelector('button');
  var msg = form.querySelector('.validatey-waitlist-msg');

  function showMessage(text, isError) {
    msg.textContent = text;
    msg.className = 'validatey-waitlist-msg ' + (isError ? 'error' : 'success');
    msg.style.display = 'block';
  }

  form.onsubmit = function (e) {
    e.preventDefault();
    var email = (input.value || '').trim();
    if (!email) return;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address.', true);
      return;
    }
    btn.disabled = true;
    msg.style.display = 'none';

    var body = { email: email };
    if (projectId) body.projectId = projectId;

    fetch(api + '/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (res.ok) {
            showMessage("Thanks! We'll notify you when we're ready.");
            input.value = '';
          } else {
            showMessage(data.error || 'Something went wrong. Please try again.', true);
          }
        });
      })
      .catch(function () {
        showMessage('Network error. Please try again.', true);
      })
      .then(function () {
        btn.disabled = false;
      });
  };

  container.appendChild(form);
  }

  // Scroll landing CTA buttons/links (e.g. "Join the Waitlist") to this section; skip our own form button
  var section = document.getElementById('validatey-waitlist-section');
  if (section) {
    var joinPattern = /join\s*(the\s*)?waitlist/i;
    document.querySelectorAll('button, a[href="#"], a[href="#validatey-waitlist-section"]').forEach(function (el) {
      if (el.closest && el.closest('.validatey-waitlist-embed')) return;
      if (!joinPattern.test(el.textContent || '')) return;
      el.addEventListener('click', function (e) {
        if (el.tagName === 'A' && el.getAttribute('href') === '#validatey-waitlist-section') return;
        e.preventDefault();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    setTimeout(run, 0);
  }
})();
