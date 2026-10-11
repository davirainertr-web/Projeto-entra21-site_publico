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
