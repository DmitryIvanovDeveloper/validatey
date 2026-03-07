(function () {
  function scrollToJoin() {
    var el = document.getElementById('join');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var heroCtaBtn = document.getElementById('hero-cta-btn');
  if (heroCtaBtn) heroCtaBtn.addEventListener('click', scrollToJoin);

  var showSampleBtn = document.getElementById('show-sample-btn');
  var modal = document.getElementById('sample-modal');
  var modalBackdrop = document.getElementById('modal-backdrop');
  var modalClose = document.getElementById('modal-close');
  var modalJoinBtn = document.getElementById('modal-join-btn');

  function openModal() {
    if (modal) {
      modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modal) {
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  }

  if (showSampleBtn) showSampleBtn.addEventListener('click', openModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalJoinBtn) {
    modalJoinBtn.addEventListener('click', function () {
      closeModal();
      scrollToJoin();
    });
  }

  document.querySelectorAll('.scroll-to-join').forEach(function (btn) {
    btn.addEventListener('click', scrollToJoin);
  });
})();
