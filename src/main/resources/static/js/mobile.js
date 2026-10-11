/* Aplica rótulos também às linhas geradas pelo armazenamento do navegador. */
(function () {
  function start() {
    document.querySelectorAll('.lot-table').forEach(function (table) {
      function label() {
        var headings = Array.from(table.querySelectorAll('thead th')).map(function (h) { return h.textContent.trim(); });
        if (!headings.length) return;
        table.classList.add('mobile-records');
        table.querySelectorAll('tbody tr').forEach(function (row) {
          Array.from(row.children).forEach(function (cell, index) {
            var value = headings[index] || '';
            if (cell.dataset.label !== value) cell.dataset.label = value;
          });
        });
      }
      label();
      var body = table.querySelector('tbody');
      if (body) new MutationObserver(label).observe(body, { childList:true, subtree:true });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
/* Dica fora da tabela para não ser cortada por overflow. */
(function () {
  var tooltip = null, current = null;
  function hide() { if (tooltip) tooltip.remove(); tooltip = null; current = null; }
  function show(button) {
    if (!window.matchMedia('(max-width:900px)').matches) return;
    hide(); current = button;
    tooltip = document.createElement('div');
    tooltip.className = 'mobile-action-tooltip';
    tooltip.textContent = button.dataset.tooltip;
    document.body.appendChild(tooltip);
    var rect = button.getBoundingClientRect();
    tooltip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - tooltip.offsetWidth - 8)) + 'px';
    tooltip.style.top = Math.max(8, rect.top - tooltip.offsetHeight - 7) + 'px';
  }
  document.addEventListener('focusin', function (e) {
    var button = e.target.closest('.tc-icon-action[data-tooltip]');
    if (button) show(button); else hide();
  });
  document.addEventListener('click', function (e) {
    var button = e.target.closest('.tc-icon-action[data-tooltip]');
    if (button) show(button); else hide();
  });
  document.addEventListener('pointerover', function (e) {
    var button = e.target.closest('.tc-icon-action[data-tooltip]');
    if (button && current !== button) show(button);
  });
  document.addEventListener('pointerout', function (e) {
    if (current && e.target.closest('.tc-icon-action[data-tooltip]') === current && !current.contains(e.relatedTarget)) hide();
  });
  document.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
})();
