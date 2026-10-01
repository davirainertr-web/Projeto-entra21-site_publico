/* ============================================================
<<<<<<< HEAD
   TEXCICLO — DEMONSTRAÇÃO PÚBLICA LOCAL
   Interface igual à demonstração do projeto completo.
   Os dados criados durante a demonstração ficam somente no
   localStorage deste navegador.
=======
   TEXCICLO — DEMONSTRAÇÃO PÚBLICA
   Mantém a interface do projeto completo e guarda somente o
   estado da demonstração no localStorage do navegador.
>>>>>>> 109b87d92833991d475d4ee1ac420279fa3caab4
   ============================================================ */
(function () {
    "use strict";

<<<<<<< HEAD
    const STORAGE_KEY = "texciclo_demo_public_v3";
    const SIGNATURE_KEY = "texciclo_demo_public_signature_v1";
    const TAXA = 0.10;
    const perfil = () => (document.body.dataset.demoPerfil || "").toUpperCase();
=======
    const KEY = "texciclo_demo_publico_v3";
    const SIGN_KEY = "texciclo_demo_assinatura_v2";
    const TAXA = 0.10;
    const perfil = (document.body.dataset.demoPerfil || "").toUpperCase();
>>>>>>> 109b87d92833991d475d4ee1ac420279fa3caab4

    const nomes = {
        INDUSTRIA: "Vale Verde Têxtil — Demonstração",
        ONG: "Instituto Retomada — Demonstração",
        MICROEMPRESA: "Ateliê Boa Costura — Demonstração"
    };

<<<<<<< HEAD
    function state() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                if (s && Array.isArray(s.lotes) && Array.isArray(s.solicitacoes)) return s;
            }
        } catch (e) { console.warn("TexCiclo demo localStorage:", e); }
=======
    const esc = v => String(v ?? "")
        .replaceAll("&","&amp;").replaceAll("<","&lt;")
        .replaceAll(">","&gt;").replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

    const money = v => Number(v || 0).toLocaleString("pt-BR", {
        style:"currency", currency:"BRL"
    });

    const uid = p => p + "_" + Date.now() + "_" + Math.random().toString(36).slice(2,9);

    function state() {
        try {
            const s = JSON.parse(localStorage.getItem(KEY) || "null");
            if (s && Array.isArray(s.lotes) && Array.isArray(s.solicitacoes)) return s;
        } catch (_) {}
>>>>>>> 109b87d92833991d475d4ee1ac420279fa3caab4
        return { lotes: [], solicitacoes: [] };
    }
    function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

<<<<<<< HEAD
    function save(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
    function uid(prefix) { return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8); }
    function money(v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
    function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

=======
>>>>>>> 109b87d92833991d475d4ee1ac420279fa3caab4
    function toast(msg) {
        let el = document.getElementById("texciclo-demo-toast");
        if (!el) {
            el = document.createElement("div");
            el.id = "texciclo-demo-toast";
<<<<<<< HEAD
            el.style.cssText = "position:fixed;right:24px;bottom:24px;z-index:500;background:#151d19;color:#efe9d8;padding:13px 16px;border-radius:6px;font:600 12px/1.4 'Manrope',sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.2);opacity:0;transform:translateY(8px);transition:.2s;pointer-events:none;max-width:360px";
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        clearTimeout(el._timer);
        el._timer = setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; }, 3000);
    }

    function signatureData() {
        try { return localStorage.getItem(SIGNATURE_KEY) || ""; } catch (_) { return ""; }
    }

    function updateSignatureUI() {
        const button = document.getElementById("btnAssinatura");
        if (!button) return;
        const has = !!signatureData();
        button.dataset.possuiAssinatura = String(has);
        button.classList.toggle("signature-button--saved", has);
        button.textContent = has ? "Assinatura cadastrada · Alterar" : "Criar assinatura digital";
        const preview = document.querySelector(".signature-preview-box");
        const empty = document.querySelector(".signature-empty");
        if (preview) {
            preview.hidden = !has;
            if (has) preview.innerHTML = '<img src="' + signatureData() + '" alt="Sua assinatura digital"><span>Assinatura cadastrada</span>';
        }
        if (empty) empty.hidden = has;
    }

    function initSignatureLocal() {
        const form = document.getElementById("assinaturaForm");
        const input = document.getElementById("assinaturaData");
        if (!form || !input || form.dataset.demoLocalBound === "true") return;
        form.dataset.demoLocalBound = "true";
        form.addEventListener("submit", function (e) {
            if (document.body.dataset.demoMode !== "true") return;
            if (!input.value || !input.value.startsWith("data:image/png;base64,")) return;
            e.preventDefault();
            try { localStorage.setItem(SIGNATURE_KEY, input.value); } catch (_) {}
            const modal = document.getElementById("assinaturaModal");
            if (modal) modal.hidden = true;
            document.body.classList.remove("modal-open");
            updateSignatureUI();
            window.dispatchEvent(new Event("texciclo:assinatura-demo-salva"));
            toast("Assinatura digital cadastrada para esta demonstração.");
        });
        updateSignatureUI();
    }

    function imageFromFile(file, cb) {
        if (!file) return cb("");
        if (file.size > 2.5 * 1024 * 1024) { toast("Escolha uma imagem de até 2,5 MB."); return cb(""); }
        const reader = new FileReader();
        reader.onload = () => cb(reader.result || "");
        reader.readAsDataURL(file);
    }

    function initIndustryForm() {
        const form = document.querySelector("#painel-novo-lote form");
        if (!form || form.dataset.demoLocalBound === "true") return;
        form.dataset.demoLocalBound = "true";
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const tipo = document.getElementById("tipoTecido")?.value.trim();
            const peso = Number(document.getElementById("peso")?.value);
            const finalidade = document.querySelector('#painel-novo-lote input[name="finalidade"]:checked')?.value;
            const precoBase = finalidade === "venda" ? Number(document.getElementById("preco")?.value) : 0;
            const marca = !!document.querySelector('#painel-novo-lote input[name="temMarca"]')?.checked;
            const file = document.getElementById("arquivoImagem")?.files?.[0];
            if (!tipo || peso <= 0 || !finalidade || (finalidade === "venda" && precoBase <= 0)) {
                toast("Preencha os campos obrigatórios."); return;
            }
            imageFromFile(file, function (imagem) {
                const s = state();
                const taxa = finalidade === "venda" ? precoBase * TAXA : 0;
                s.lotes.push({
                    id: uid("lote"), industriaPerfil: "INDUSTRIA", industriaNome: nomes.INDUSTRIA,
                    tipoTecido: tipo, peso, pesoOriginal: peso, finalidade, temMarca: marca, imagem,
                    precoBase, taxaPlataforma: taxa, precoFinal: precoBase + taxa,
                    status: "Disponível", criadoEm: new Date().toISOString()
                });
                save(s);
                form.reset();
                const preview = document.getElementById("previewImagem");
                if (preview) preview.hidden = true;
                const precoBox = document.getElementById("campoPreco");
                if (precoBox) precoBox.hidden = true;
                toast("Lote cadastrado na demonstração.");
                renderAll();
                activateTab("painel-lotes");
=======
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add("show");
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.remove("show"), 3000);
    }

    function renderIndustry() {
        const s = state();
        const lots = s.lotes.filter(l => l.industriaPerfil === "INDUSTRIA");
        const tbody = document.querySelector("#painel-lotes tbody");
        if (tbody) {
            tbody.innerHTML = lots.length ? lots.map(l => `
                <tr>
                    <td>
                        <div class="lote-material-cell">
                            ${l.imagem ? `<img src="${l.imagem}" alt="Imagem do lote" class="lote-thumb">` : `<span class="lote-thumb lote-thumb--empty">—</span>`}
                            <strong>${esc(l.tipoTecido)}</strong>
                        </div>
                    </td>
                    <td>${Number(l.peso).toLocaleString("pt-BR")} kg</td>
                    <td>${l.finalidade === "venda" ? "Venda" : "Doação"}</td>
                    <td>${l.finalidade === "venda" ? money(l.precoFinal) : "Gratuito"}</td>
                    <td><span class="chip chip--disponivel">${esc(l.status)}</span></td>
                    <td>${l.temMarca ? "Sim" : "Não"}</td>
                </tr>`).join("") : `<tr><td colspan="6"><p class="empty-note">Nenhum lote cadastrado neste perfil de demonstração.</p></td></tr>`;
        }

        const reqBody = document.querySelector("#painel-solicitacoes tbody");
        if (reqBody) {
            const reqs = s.solicitacoes.filter(r => {
                const l = s.lotes.find(x => x.id === r.loteId);
                return l && l.industriaPerfil === "INDUSTRIA";
            });
            reqBody.innerHTML = reqs.length ? reqs.map(r => {
                const l = s.lotes.find(x => x.id === r.loteId);
                const pago = r.pagamentoStatus === "PAGO";
                return `<tr>
                    <td>${esc(l.tipoTecido)}</td>
                    <td>${esc(r.nome)}</td>
                    <td>${l.finalidade === "venda" ? "Venda" : "Doação"}</td>
                    <td><span class="chip chip--disponivel">${esc(r.status)}</span></td>
                    <td>${l.finalidade === "venda" ? (pago ? "Pago" : "Aguardando") : "—"}</td>
                    <td class="solicitacoes-industria-acoes">
                        ${r.status === "PENDENTE" ? `
                            <button type="button" class="btn btn-primary btn-sm" data-demo-accept="${r.id}">Aceitar</button>
                            <button type="button" class="btn btn-recusar btn-sm" data-demo-reject="${r.id}">Recusar</button>` : ""}
                        ${r.status === "ACEITA" && (l.finalidade === "doacao" || pago) ? `
                            <button type="button" class="btn btn-primary btn-sm" data-demo-deliver="${r.id}">Confirmar retirada</button>` : ""}
                        ${r.status === "RETIRADA" ? "Retirada confirmada." : ""}
                    </td>
                </tr>`;
            }).join("") : `<tr><td colspan="6"><p class="empty-note">Nenhuma solicitação recebida ainda.</p></td></tr>`;

            reqBody.querySelectorAll("[data-demo-accept]").forEach(b => b.onclick = () => {
                const ss = state(), r = ss.solicitacoes.find(x => x.id === b.dataset.demoAccept);
                if (!r) return;
                r.status = "ACEITA";
                r.pin = String(Math.floor(1000 + Math.random() * 9000));
                save(ss); renderIndustry(); renderBuyers(); toast("Solicitação aceita.");
            });
            reqBody.querySelectorAll("[data-demo-reject]").forEach(b => b.onclick = () => {
                const ss = state(), r = ss.solicitacoes.find(x => x.id === b.dataset.demoReject);
                if (!r) return;
                r.status = "RECUSADA";
                save(ss); renderIndustry(); renderBuyers(); toast("Solicitação recusada.");
            });
            reqBody.querySelectorAll("[data-demo-deliver]").forEach(b => b.onclick = () => {
                const ss = state(), r = ss.solicitacoes.find(x => x.id === b.dataset.demoDeliver);
                const l = r && ss.lotes.find(x => x.id === r.loteId);
                if (!r || !l) return;
                r.status = "RETIRADA";
                l.peso = Math.max(0, Number(l.peso) - Number(r.quantidade));
                if (l.peso <= 0) l.status = "Encerrado";
                save(ss); renderIndustry(); renderBuyers(); updateImpact(); toast("Retirada confirmada.");
            });
        }

        updateImpact();
        bindIndustryForm();
    }

    function bindIndustryForm() {
        const form = document.querySelector('#painel-novo-lote form[action="/lotes"]');
        if (!form || form.dataset.demoBound === "1") return;
        form.dataset.demoBound = "1";
        form.addEventListener("submit", e => {
            e.preventDefault();
            const tipo = form.querySelector("#tipoTecido")?.value.trim();
            const peso = Number(form.querySelector("#peso")?.value);
            const finalidade = form.querySelector('input[name="finalidade"]:checked')?.value;
            const precoBase = finalidade === "venda" ? Number(form.querySelector("#preco")?.value) : 0;
            const marca = !!form.querySelector('input[name="temMarca"]')?.checked;
            const img = form.querySelector("#imagemPreview")?.src || "";

            if (!tipo || !peso || peso <= 0 || !finalidade || (finalidade === "venda" && precoBase <= 0)) {
                toast("Preencha os campos obrigatórios.");
                return;
            }

            const s = state();
            const taxa = finalidade === "venda" ? precoBase * TAXA : 0;
            s.lotes.push({
                id: uid("lote"), industriaPerfil:"INDUSTRIA", industriaNome:nomes.INDUSTRIA,
                tipoTecido:tipo, peso, pesoOriginal:peso, finalidade, temMarca:marca,
                imagem:img, precoBase, taxaPlataforma:taxa, precoFinal:precoBase+taxa,
                status:"Disponível", criadoEm:new Date().toISOString()
>>>>>>> 109b87d92833991d475d4ee1ac420279fa3caab4
            });
            save(s);
            form.reset();
            const preview = document.getElementById("previewImagem");
            if (preview) preview.hidden = true;
            renderIndustry(); renderBuyers();
            document.querySelector('.dash-tab[data-target="painel-lotes"]')?.click();
            toast("Lote cadastrado na demonstração.");
        });
    }

<<<<<<< HEAD
    function initIndustryFormExtras() {
        document.querySelectorAll('#painel-novo-lote input[name="finalidade"]').forEach(r => {
            if (r.dataset.demoBound) return;
            r.dataset.demoBound = "true";
            r.addEventListener("change", function () {
                const box = document.getElementById("campoPreco");
                if (box) box.hidden = this.value !== "venda";
            });
        });
        const file = document.getElementById("arquivoImagem");
        if (file && !file.dataset.demoBound) {
            file.dataset.demoBound = "true";
            file.addEventListener("change", function () {
                imageFromFile(this.files?.[0], src => {
                    const img = document.getElementById("imagemPreview");
                    const box = document.getElementById("previewImagem");
                    if (img && box && src) { img.src = src; box.hidden = false; }
                });
            });
        }
    }

    function activateTab(id) {
        const tab = document.querySelector('.dash-tab[data-target="' + id + '"]');
        if (tab) tab.click();
    }

    function renderIndustryLots(s) {
        const panel = document.getElementById("painel-lotes");
        if (!panel) return;
        const body = panel.querySelector("tbody");
        const empty = panel.querySelector(".empty-note");
        const lots = s.lotes.filter(l => l.industriaPerfil === "INDUSTRIA");
        if (!body) return;
        body.innerHTML = lots.map(l => `
            <tr>
                <td>${l.imagem ? `<img src="${l.imagem}" alt="Imagem do lote" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` : "Sem imagem"}</td>
                <td>${esc(l.tipoTecido)}</td>
                <td>${Number(l.peso).toLocaleString("pt-BR")} kg</td>
                <td>${l.finalidade === "doacao" ? "Doação" : "Venda"}</td>
                <td><span class="chip chip--disponivel">${esc(l.status)}</span></td>
                <td>${l.temMarca ? "Compromisso necessário" : "Não necessário"}</td>
            </tr>`).join("");
        if (empty) empty.hidden = lots.length > 0;
    }

    function renderIndustryRequests(s) {
        const panel = document.getElementById("painel-solicitacoes");
        if (!panel) return;
        const body = panel.querySelector("tbody");
        const empty = panel.querySelector(".empty-note");
        if (!body) return;
        const reqs = s.solicitacoes.filter(r => r.industriaPerfil === "INDUSTRIA");
        body.innerHTML = reqs.map(r => {
            const l = s.lotes.find(x => x.id === r.loteId);
            if (!l) return "";
            let action = "";
            if (r.status === "PENDENTE") {
                action = `<button type="button" class="btn btn-primary btn-sm" data-demo-accept="${r.id}">Aceitar</button>
                          <button type="button" class="btn btn-recusar btn-sm" data-demo-reject="${r.id}">Recusar</button>`;
            } else if (r.status === "ACEITA" && (l.finalidade === "doacao" || r.pagamentoStatus === "PAGO")) {
                action = `<form class="pin-confirm-form" data-demo-retirada="${r.id}">
                    <input type="text" maxlength="4" inputmode="numeric" placeholder="PIN" required>
                    <button type="submit" class="btn btn-primary btn-sm">Confirmar</button>
                </form>`;
            } else if (r.status === "ACEITA") {
                action = `<span class="status-text">Aguardando pagamento.</span>`;
            } else {
                action = `<span class="status-text">${esc(r.status === "RECUSADA" ? "Solicitação recusada." : "Material retirado.")}</span>`;
            }
            const pagamento = l.finalidade === "venda" ? (r.pagamentoStatus === "PAGO" ? '<span class="pagamento-badge pagamento-badge--confirmado">Confirmado</span>' : '<span class="pagamento-badge pagamento-badge--aguardando">Aguardando</span>') : '<span class="pagamento-badge pagamento-badge--na">—</span>';
            return `<tr><td>${esc(l.tipoTecido)}</td><td>${esc(r.nome || nomes[r.perfil] || "Solicitante")}</td><td>${l.finalidade === "doacao" ? "Doação" : "Venda"}</td><td><span class="chip chip--disponivel">${esc(r.status)}</span></td><td class="solicitacoes-industria-pagamento">${pagamento}</td><td class="solicitacoes-industria-acoes-cell"><div class="solicitacao-acoes">${action}</div></td></tr>`;
        }).join("");
        if (empty) empty.hidden = reqs.length > 0;

        panel.querySelectorAll("[data-demo-accept]").forEach(b => b.onclick = () => {
            const x = state(); const r = x.solicitacoes.find(v => v.id === b.dataset.demoAccept); if (!r) return;
            r.status = "ACEITA"; r.pin = String(Math.floor(1000 + Math.random() * 9000)); save(x); toast("Solicitação aceita. PIN gerado: " + r.pin); renderAll();
        });
        panel.querySelectorAll("[data-demo-reject]").forEach(b => b.onclick = () => {
            const x = state(); const r = x.solicitacoes.find(v => v.id === b.dataset.demoReject); if (!r) return;
            r.status = "RECUSADA"; save(x); toast("Solicitação recusada."); renderAll();
        });
        panel.querySelectorAll("[data-demo-retirada]").forEach(f => f.onsubmit = e => {
            e.preventDefault(); const x = state(); const r = x.solicitacoes.find(v => v.id === f.dataset.demoRetirada); const l = r && x.lotes.find(v => v.id === r.loteId); const pin = f.querySelector("input")?.value;
            if (!r || !l) return;
            if (String(r.pin || "") !== String(pin || "")) { toast("PIN incorreto."); return; }
            r.status = "RETIRADA"; l.peso = Math.max(0, Number(l.peso) - Number(r.quantidade)); if (l.peso <= 0) l.status = "Encerrado"; save(x); toast("Retirada confirmada com sucesso."); renderAll();
        });
    }

    function renderIndustrySustainability(s) {
        const panel = document.getElementById("painel-sustentabilidade");
        if (!panel) return;
        const done = s.solicitacoes.filter(r => r.industriaPerfil === "INDUSTRIA" && r.status === "RETIRADA");
        const kg = done.reduce((sum, r) => sum + Number(r.quantidade || 0), 0);
        const nums = panel.querySelectorAll(".stat-card .num");
        if (nums[0]) nums[0].textContent = kg.toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1}) + " kg";
        if (nums[1]) nums[1].textContent = String(done.length);
    }

    function renderBuyerVitrine(s, profile) {
        const panel = document.getElementById("painel-vitrine");
        if (!panel) return;
        const grid = panel.querySelector(".product-grid");
        const empty = panel.querySelector(".empty-note");
        if (!grid) return;
        const finalidade = profile === "MICROEMPRESA" ? "venda" : "doacao";
        const lots = s.lotes.filter(l => l.finalidade === finalidade && Number(l.peso) > 0 && l.status === "Disponível");
        grid.innerHTML = lots.map(l => {
            const precoKg = l.finalidade === "venda" ? Number(l.precoFinal || 0) / Number(l.pesoOriginal || l.peso || 1) : 0;
            const active = s.solicitacoes.some(r => r.loteId === l.id && r.perfil === profile && ["PENDENTE","ACEITA"].includes(r.status));
            return `<div class="product-card">
                <div class="product-thumb">${l.imagem ? `<img src="${l.imagem}" style="width:100%;height:100%;object-fit:cover;">` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7h18M6 7v13h12V7M9 7V4h6v3"/></svg>`}</div>
                <div class="product-body"><h3>${esc(l.tipoTecido)}</h3><p class="product-source">${profile === "MICROEMPRESA" ? "Vendido por " : "Doado por "}${esc(l.industriaNome)}</p>
                <div class="product-meta"><span>${Number(l.peso).toLocaleString("pt-BR")} kg disponíveis</span></div>
                <div class="product-foot">
                ${profile === "MICROEMPRESA" ? `<div class="product-price-block"><span class="product-price-label">Preço por kg</span><strong class="product-price">${money(precoKg)} / kg</strong></div>` : `<span class="chip chip--gratuito">Gratuito</span>`}
                ${active ? `<div class="lote-solicitado-box"><span class="lote-solicitado-status">✓ Solicitação enviada</span></div>` : `<form class="solicitar-form demo-request-form" data-lote="${l.id}"><label class="quantidade-label">Quantidade desejada</label><div class="quantidade-preco-row"><input type="number" class="input-quantidade" min="0.1" step="0.1" max="${Number(l.peso)}" value="1" required>${profile === "MICROEMPRESA" ? `<div class="valor-dinamico"><span>Total</span><strong class="preco-selecionado">${money(precoKg)}</strong></div>` : ""}</div><button type="submit" class="btn btn-primary btn-sm">${profile === "MICROEMPRESA" ? "Solicitar compra" : "Solicitar lote"}</button></form>`}
                </div></div></div>`;
        }).join("");
        if (empty) empty.hidden = lots.length > 0;

        panel.querySelectorAll(".demo-request-form").forEach(form => {
            const loteId = form.dataset.lote;
            const input = form.querySelector(".input-quantidade");
            const total = form.querySelector(".preco-selecionado");
            const update = () => { const l = state().lotes.find(x => x.id === loteId); if (l && total) total.textContent = money((Number(l.precoFinal || 0) / Number(l.pesoOriginal || l.peso || 1)) * Number(input.value || 0)); };
            input?.addEventListener("input", update); update();
            form.onsubmit = e => {
                e.preventDefault(); const x = state(); const l = x.lotes.find(v => v.id === loteId); const q = Number(input.value);
                if (!l || q <= 0 || q > Number(l.peso)) { toast("Quantidade inválida."); return; }
                if (x.solicitacoes.some(r => r.loteId === loteId && r.perfil === profile && ["PENDENTE","ACEITA"].includes(r.status))) { toast("Você já possui uma solicitação ativa para este lote."); return; }
                const precoKg = profile === "MICROEMPRESA" ? Number(l.precoFinal || 0) / Number(l.pesoOriginal || l.peso || 1) : 0;
                x.solicitacoes.push({ id: uid("sol"), loteId, perfil: profile, nome: nomes[profile], industriaPerfil: "INDUSTRIA", quantidade: q, valor: precoKg * q, status: "PENDENTE", pagamentoStatus: "AGUARDANDO", pin: null, criadoEm: new Date().toISOString() });
                save(x); toast("Solicitação enviada para a indústria."); renderAll();
            };
        });
    }

    function renderBuyerRequests(s, profile) {
        const panel = document.getElementById("painel-minhas");
        if (!panel) return;
        const body = panel.querySelector("tbody");
        const empty = panel.querySelector(".empty-note");
        if (!body) return;
        const reqs = s.solicitacoes.filter(r => r.perfil === profile);
        body.innerHTML = reqs.map(r => {
            const l = s.lotes.find(x => x.id === r.loteId); if (!l) return "";
            let actions = r.status === "PENDENTE" ? `<button type="button" class="btn btn-cancelar-solicitacao" data-demo-cancel="${r.id}">Cancelar solicitação</button>` : "";
            if (r.status === "ACEITA" && l.finalidade === "venda" && r.pagamentoStatus !== "PAGO") actions = `<button type="button" class="btn btn-pagamento-pix" data-demo-pay="${r.id}">Pagar com PIX</button><button type="button" class="btn btn-pagamento-dinheiro" data-demo-pay-money="${r.id}">Pagar em dinheiro</button>`;
            if (r.status === "ACEITA" && (l.finalidade === "doacao" || r.pagamentoStatus === "PAGO")) actions = `<button type="button" class="btn btn-primary btn-sm" data-demo-pickup="${r.id}">Confirmar retirada</button>`;
            if (r.status === "RETIRADA") actions = `<span class="status-text">Material retirado.</span>`;
            return `<tr><td>${esc(l.tipoTecido)}</td><td>${esc(l.industriaNome)}</td><td>${Number(r.quantidade).toLocaleString("pt-BR")} kg</td><td>${l.finalidade === "venda" ? money(r.valor) : "Gratuito"}</td><td><span class="chip chip--disponivel">${esc(r.status)}</span></td><td>${actions}${r.pin ? `<div class="pin-display">PIN: <strong>${esc(r.pin)}</strong></div>` : ""}</td></tr>`;
        }).join("");
        if (empty) empty.hidden = reqs.length > 0;
        panel.querySelectorAll("[data-demo-cancel]").forEach(b => b.onclick = () => { const x = state(); const r = x.solicitacoes.find(v => v.id === b.dataset.demoCancel); if (r) { r.status = "CANCELADA"; save(x); renderAll(); toast("Solicitação cancelada."); } });
        panel.querySelectorAll("[data-demo-pay], [data-demo-pay-money]").forEach(b => b.onclick = () => { const x = state(); const r = x.solicitacoes.find(v => v.id === (b.dataset.demoPay || b.dataset.demoPayMoney)); if (r) { r.pagamentoStatus = "PAGO"; if (!r.pin) r.pin = String(Math.floor(1000 + Math.random()*9000)); save(x); renderAll(); toast("Pagamento simulado confirmado."); } });
        panel.querySelectorAll("[data-demo-pickup]").forEach(b => b.onclick = () => { const x = state(); const r = x.solicitacoes.find(v => v.id === b.dataset.demoPickup); const l = r && x.lotes.find(v => v.id === r.loteId); if (!r || !l) return; r.status = "RETIRADA"; l.peso = Math.max(0, Number(l.peso) - Number(r.quantidade)); if (l.peso <= 0) l.status = "Encerrado"; save(x); renderAll(); toast("Retirada confirmada. O ciclo foi encerrado."); });
    }

    function renderAll() {
        const p = perfil();
        const s = state();
        if (p === "INDUSTRIA") {
            renderIndustryLots(s); renderIndustryRequests(s); renderIndustrySustainability(s); initIndustryForm(); initIndustryFormExtras();
        } else if (p === "ONG" || p === "MICROEMPRESA") {
            renderBuyerVitrine(s, p); renderBuyerRequests(s, p);
        }
        updateSignatureUI();
        if (typeof window.texcicloDemoInfoRefresh === "function") requestAnimationFrame(window.texcicloDemoInfoRefresh);
    }

    function start() {
        if (document.body.dataset.demoMode !== "true") return;
        initSignatureLocal();
        renderAll();
        document.querySelectorAll(".dash-tab").forEach(tab => {
            if (tab.dataset.demoLocalBound === "true") return;
            tab.dataset.demoLocalBound = "true";
            tab.addEventListener("click", () => setTimeout(renderAll, 0));
        });
=======
    function updateImpact() {
        const s = state();
        const kg = s.solicitacoes.filter(r => r.status === "RETIRADA")
            .reduce((n,r) => n + Number(r.quantidade || 0), 0);
        const cards = document.querySelectorAll("#painel-sustentabilidade .stat-card .num");
        if (cards[0]) cards[0].textContent = kg.toLocaleString("pt-BR",{minimumFractionDigits:1}) + " kg";
        if (cards[1]) cards[1].textContent = s.solicitacoes.filter(r => r.status === "RETIRADA").length;
    }

    function renderBuyers() {
        ["ONG","MICROEMPRESA"].forEach(profile => {
            const grid = document.querySelector("#painel-vitrine .product-grid");
            if (!grid) return;
            // Only render the current profile's dashboard.
            if (profile !== perfil) return;

            const s = state();
            const finalidade = profile === "MICROEMPRESA" ? "venda" : "doacao";
            const lots = s.lotes.filter(l => l.finalidade === finalidade && Number(l.peso) > 0 && l.status === "Disponível");

            grid.innerHTML = lots.length ? lots.map(l => {
                const precoKg = l.finalidade === "venda"
                    ? Number(l.precoFinal) / Number(l.pesoOriginal || l.peso) : 0;
                return `<article class="product-card">
                    <div class="product-thumb">
                        ${l.imagem ? `<img src="${l.imagem}" alt="Imagem do material" style="width:100%;height:100%;object-fit:cover;">` :
                        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7h18M6 7v13h12V7M9 7V4h6v3"/></svg>`}
                    </div>
                    <div class="product-body">
                        <h3>${esc(l.tipoTecido)}</h3>
                        <p class="product-source">${profile === "MICROEMPRESA" ? "Vendido por " : "Doado por "}${esc(l.industriaNome)}</p>
                        <div class="product-meta"><span>${Number(l.peso).toLocaleString("pt-BR")} kg disponíveis</span></div>
                        <div class="product-foot">
                            ${profile === "MICROEMPRESA" ? `<div class="product-price-block"><span class="product-price-label">Preço por kg</span><strong class="product-price">${money(precoKg)} / kg</strong></div>` :
                            `<span class="chip chip--gratuito">Gratuito</span>`}
                            <form class="demo-request-form" data-lote="${l.id}">
                                <label class="quantidade-label">Quantidade desejada</label>
                                <div class="quantidade-preco-row">
                                    <input type="number" class="input-quantidade" min="0.1" step="0.1" max="${Number(l.peso)}" value="${Math.min(1,Number(l.peso))}" required>
                                    ${profile === "MICROEMPRESA" ? `<div class="valor-dinamico"><span>Total</span><strong class="preco-selecionado">${money(precoKg)}</strong></div>` : ""}
                                </div>
                                <button type="submit" class="btn btn-primary btn-sm">${profile === "MICROEMPRESA" ? "Solicitar compra" : "Solicitar lote"}</button>
                            </form>
                        </div>
                    </div>
                </article>`;
            }).join("") : `<p class="empty-note">${profile === "MICROEMPRESA" ? "Nenhum lote à venda neste navegador." : "Nenhum lote de doação disponível neste navegador."}</p>`;

            grid.querySelectorAll(".demo-request-form").forEach(form => {
                const l = state().lotes.find(x => x.id === form.dataset.lote);
                const input = form.querySelector("input");
                const total = form.querySelector(".preco-selecionado");
                const update = () => {
                    if (total && l) total.textContent = money((Number(l.precoFinal)/Number(l.pesoOriginal || l.peso))*Number(input.value||0));
                };
                input?.addEventListener("input", update); update();
                form.addEventListener("submit", e => {
                    e.preventDefault();
                    const q = Number(input.value), ss = state();
                    const lot = ss.lotes.find(x => x.id === form.dataset.lote);
                    if (!lot || q <= 0 || q > Number(lot.peso)) return toast("Quantidade inválida.");
                    if (ss.solicitacoes.some(r => r.loteId === lot.id && r.perfil === profile && ["PENDENTE","ACEITA"].includes(r.status)))
                        return toast("Você já possui uma solicitação ativa para este lote.");
                    const precoKg = profile === "MICROEMPRESA" ? Number(lot.precoFinal)/Number(lot.pesoOriginal || lot.peso) : 0;
                    ss.solicitacoes.push({
                        id:uid("sol"), loteId:lot.id, perfil:profile, nome:nomes[profile],
                        quantidade:q, valor:precoKg*q, status:"PENDENTE", pagamentoStatus:"AGUARDANDO", pin:null,
                        criadoEm:new Date().toISOString()
                    });
                    save(ss); renderBuyers(); renderIndustry(); toast("Solicitação enviada para a indústria.");
                });
            });
        });

        renderBuyerRequests();
    }

    function renderBuyerRequests() {
        const panel = document.getElementById("painel-minhas");
        if (!panel) return;
        const s = state();
        const reqs = s.solicitacoes.filter(r => r.perfil === perfil);
        const tbody = panel.querySelector("tbody");
        if (!tbody) return;
        tbody.innerHTML = reqs.length ? reqs.map(r => {
            const l = s.lotes.find(x => x.id === r.loteId);
            if (!l) return "";
            let actions = "";
            if (r.status === "PENDENTE") {
                actions = `<button type="button" class="btn btn-cancelar-solicitacao" data-demo-cancel="${r.id}">Cancelar solicitação</button>`;
            } else if (r.status === "ACEITA" && l.finalidade === "venda" && r.pagamentoStatus !== "PAGO") {
                actions = `<button type="button" class="btn btn-pagamento-pix" data-demo-pix="${r.id}">Pagar com PIX</button>
                           <button type="button" class="btn btn-pagamento-dinheiro" data-demo-money="${r.id}">Pagar em dinheiro</button>`;
            } else if (r.status === "ACEITA" && (l.finalidade === "doacao" || r.pagamentoStatus === "PAGO")) {
                actions = `<span class="pin-display">PIN: <strong>${r.pin || "—"}</strong></span>
                           <button type="button" class="btn btn-primary btn-sm" data-demo-pickup="${r.id}">Confirmar retirada</button>`;
            } else if (r.status === "RETIRADA") {
                actions = `<span class="status-text">Material retirado.</span>`;
            } else if (r.status === "RECUSADA") {
                actions = `<span class="status-text">Solicitação recusada.</span>`;
            }
            return `<tr>
                <td>${esc(l.tipoTecido)}</td>
                <td>${esc(l.industriaNome)}</td>
                <td>${Number(r.quantidade).toLocaleString("pt-BR")} kg</td>
                <td>${l.finalidade === "venda" ? money(r.valor) : "Gratuito"}</td>
                <td><span class="chip chip--disponivel">${esc(r.status)}</span></td>
                <td>${actions}</td>
            </tr>`;
        }).join("") : `<tr><td colspan="6"><p class="empty-note">Você ainda não solicitou nenhum lote neste navegador.</p></td></tr>`;

        tbody.querySelectorAll("[data-demo-cancel]").forEach(b => b.onclick=()=>{
            const ss=state(),r=ss.solicitacoes.find(x=>x.id===b.dataset.demoCancel);
            if(r&&r.status==="PENDENTE"){r.status="CANCELADA";save(ss);renderBuyers();toast("Solicitação cancelada.");}
        });
        tbody.querySelectorAll("[data-demo-pix],[data-demo-money]").forEach(b=>b.onclick=()=>{
            const ss=state(),r=ss.solicitacoes.find(x=>x.id===(b.dataset.demoPix||b.dataset.demoMoney));
            if(!r)return;
            r.pagamentoStatus="PAGO";r.pin=String(Math.floor(1000+Math.random()*9000));
            save(ss);renderBuyers();toast(b.dataset.demoPix?"Pagamento PIX simulado confirmado.":"Pagamento em dinheiro registrado.");
        });
        tbody.querySelectorAll("[data-demo-pickup]").forEach(b=>b.onclick=()=>{
            const ss=state(),r=ss.solicitacoes.find(x=>x.id===b.dataset.demoPickup),l=r&&ss.lotes.find(x=>x.id===r.loteId);
            if(!r||!l)return;
            r.status="RETIRADA";l.peso=Math.max(0,Number(l.peso)-Number(r.quantidade));if(l.peso<=0)l.status="Encerrado";
            save(ss);renderBuyers();renderIndustry();toast("Retirada confirmada.");
        });
    }

    function assinatura() {
        const saved = localStorage.getItem(SIGN_KEY) || "";
        const btn = document.getElementById("btnAssinatura");
        const preview = document.querySelector(".signature-preview-box");
        const empty = document.querySelector(".signature-empty");
        if (btn) {
            btn.dataset.possuiAssinatura = String(!!saved);
            btn.classList.toggle("signature-button--saved", !!saved);
            btn.innerHTML = saved ? "Assinatura cadastrada · Alterar" : "Criar assinatura digital";
        }
        if (preview) {
            preview.hidden = !saved;
            if (saved) preview.innerHTML = `<img src="${saved}" alt="Sua assinatura digital"><span>Assinatura cadastrada</span>`;
        }
        if (empty) empty.hidden = !!saved;

        const form = document.getElementById("assinaturaForm");
        if (form && !form.dataset.demoBound) {
            form.dataset.demoBound="1";
            form.addEventListener("submit", e => {
                e.preventDefault();
                const data = document.getElementById("assinaturaData")?.value;
                if (!data) return toast("Desenhe sua assinatura antes de salvar.");
                localStorage.setItem(SIGN_KEY,data);
                document.getElementById("assinaturaModal")?.setAttribute("hidden","");
                assinatura();
                window.dispatchEvent(new Event("texciclo:assinatura-demo-salva"));
                toast("Assinatura digital cadastrada nesta demonstração.");
            });
        }
    }

    function start() {
        if (document.body.dataset.demoMode !== "true") return;
        if (perfil === "INDUSTRIA") renderIndustry();
        if (perfil === "ONG" || perfil === "MICROEMPRESA") renderBuyers();
        assinatura();

>>>>>>> 109b87d92833991d475d4ee1ac420279fa3caab4
    }

    window.addEventListener("texciclo:assinatura-demo-salva", updateSignatureUI);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
