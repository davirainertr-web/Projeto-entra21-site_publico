/* Indicadores da demonstração usam as retiradas confirmadas neste navegador. */
(function () {
    'use strict';
    function update() {
        var items = document.querySelectorAll('.impacto-coletivo .impacto-num');
        if (items.length < 2) return;
        var data;
        try { data = JSON.parse(localStorage.getItem('texciclo_demo_public_v3') || 'null'); }
        catch (_) { return; }
        if (!data || !Array.isArray(data.solicitacoes)) return;
        var delivered = data.solicitacoes.filter(function (r) {
            return r.industriaPerfil === 'INDUSTRIA' && r.status === 'RETIRADA';
        });
        var kg = delivered.reduce(function (total, r) {
            var quantity = Number(r.quantidade || 0);
            return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
        }, 0);
        items[0].textContent = kg.toLocaleString('pt-BR', { minimumFractionDigits:1, maximumFractionDigits:1 }) + ' kg';
        items[1].textContent = String(delivered.length);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update); else update();
    window.addEventListener('pageshow', update);
    window.addEventListener('storage', function (e) {
        if (e.key === 'texciclo_demo_public_v3' || e.key === null) update();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) update(); });
})();
