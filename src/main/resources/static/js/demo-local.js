/* ============================================================
   TEXCICLO — DEMONSTRAÇÃO PÚBLICA LOCAL
   Interface igual à demonstração do projeto completo.
   Os dados criados durante a demonstração ficam somente no
   localStorage deste navegador.
   ============================================================ */
(function () {
    "use strict";

    const STORAGE_KEY = "texciclo_demo_public_v3";
    const SIGNATURE_KEY = "texciclo_demo_public_signature_v1";
    const TAXA = 0.10;
    let closeContact = null;
    const perfil = () => (document.body.dataset.demoPerfil || "").toUpperCase();

    const nomes = {
        INDUSTRIA: "Vale Verde Têxtil — Demonstração",
        ONG: "Instituto Retomada — Demonstração",
        MICROEMPRESA: "Ateliê Boa Costura — Demonstração"
    };

    function state() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                if (s && Array.isArray(s.lotes) && Array.isArray(s.solicitacoes)) return s;
            }
        } catch (e) { console.warn("TexCiclo demo localStorage:", e); }
        return { lotes: [], solicitacoes: [] };
    }

    function save(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
    function uid(prefix) { return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8); }
    function money(v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
    function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

    function toast(msg) {
        let el = document.getElementById("texciclo-demo-toast");
        if (!el) {
            el = document.createElement("div");
            el.id = "texciclo-demo-toast";
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
        const canvas = document.getElementById("assinaturaCanvas");
        if (!form || !input || !canvas || document.documentElement.dataset.demoSignatureBound === "true") {
            updateSignatureUI();
            return;
        }

        // Captura no nível do documento para que a demonstração pública
        // intercepte o envio antes de qualquer listener do platform.js.
        document.documentElement.dataset.demoSignatureBound = "true";
        document.addEventListener("submit", function (e) {
            if (document.body.dataset.demoMode !== "true") return;
            if (e.target !== form) return;

            e.preventDefault();
            e.stopImmediatePropagation();

            if (document.getElementById("salvarAssinatura").disabled) {
                toast("Desenhe sua assinatura antes de salvar.");
                return;
            }
            let data = input.value || "";
            if (!data && canvas) {
                try { data = canvas.toDataURL("image/png"); } catch (_) { data = ""; }
            }

            if (!data || !data.startsWith("data:image/png;base64,")) {
                toast("Desenhe sua assinatura antes de salvar.");
                return;
            }

            try {
                localStorage.setItem(SIGNATURE_KEY, data);
            } catch (err) {
                console.error("TexCiclo: não foi possível salvar a assinatura localmente.", err);
                toast("Não foi possível salvar a assinatura neste navegador.");
                return;
            }

            const modal = document.getElementById("assinaturaModal");
            if (modal) modal.hidden = true;
            document.body.classList.remove("modal-open");
            updateSignatureUI();
            window.dispatchEvent(new Event("texciclo:assinatura-demo-salva"));
            toast("Assinatura digital cadastrada para esta demonstração.");
        }, true);

        updateSignatureUI();
        const modal = document.getElementById("assinaturaModal");
        const required = () => modal && !signatureData();
        document.addEventListener("click", e => {
            if (required() && (e.target === modal || e.target.closest('[data-modal-close="assinaturaModal"]'))) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
        document.addEventListener("keydown", e => {
            if (required() && e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
        setTimeout(() => {
            if (required() && modal.hidden) document.getElementById("btnAssinatura").click();
        }, 200);
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
        if (!form || document.documentElement.dataset.demoLoteBound === "true") return;

        // O listener em fase de captura garante que o formulário da
        // demonstração nunca chegue ao endpoint real /lotes.
        document.documentElement.dataset.demoLoteBound = "true";
        document.addEventListener("submit", function (e) {
            if (document.body.dataset.demoMode !== "true") return;
            if (e.target !== form) return;

            e.preventDefault();
            e.stopImmediatePropagation();

            const tipo = document.getElementById("tipoTecido")?.value.trim();
            const peso = Number(document.getElementById("peso")?.value);
            const finalidade = document.querySelector('#painel-novo-lote input[name="finalidade"]:checked')?.value;
            const precoBase = finalidade === "venda" ? Number(document.getElementById("preco")?.value) : 0;
            const marca = !!document.querySelector('#painel-novo-lote input[name="temMarca"]')?.checked;
            const file = document.getElementById("arquivoImagem")?.files?.[0];

            if (!tipo || peso <= 0 || !finalidade || (finalidade === "venda" && precoBase <= 0)) {
                toast("Preencha os campos obrigatórios.");
                return;
            }

            imageFromFile(file, function (imagem) {
                const s = state();
                const taxa = finalidade === "venda" ? precoBase * TAXA : 0;
                s.lotes.push({
                    id: uid("lote"),
                    industriaPerfil: "INDUSTRIA",
                    industriaNome: nomes.INDUSTRIA,
                    tipoTecido: tipo,
                    peso,
                    pesoOriginal: peso,
                    finalidade,
                    temMarca: marca,
                    imagem,
                    precoBase,
                    taxaPlataforma: taxa,
                    precoFinal: precoBase + taxa,
                    status: "Disponível",
                    criadoEm: new Date().toISOString()
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
            });
        }, true);
    }

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
        const lots = s.lotes.filter(l => l.industriaPerfil === "INDUSTRIA" && Number(l.peso) > 0);
        if (!body) return;

        body.innerHTML = lots.map(l => `
            <tr>
                <td>${l.imagem ? `<img src="${l.imagem}" alt="Imagem do lote" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` : "Sem imagem"}</td>
                <td>${esc(l.tipoTecido)}</td>
                <td>${Number(l.peso).toLocaleString("pt-BR")} kg</td>
                <td>${l.finalidade === "doacao" ? "Doação" : "Venda"}</td>
                <td><span class="chip chip--disponivel">${esc(l.status)}</span></td>
                <td>${l.temMarca
                    ? `<button type="button" class="btn-tabela demo-pdf-link" data-demo-pdf="lote" data-demo-lote="${esc(l.id)}">Ver compromisso</button>`
                    : "Não necessário"}</td>
            </tr>`).join("");
        if (empty) empty.hidden = lots.length > 0;
        bindPdfButtons(panel);
    }

    function abrirPdfDemo(payload) {
        const popup = window.open("about:blank", "_blank");
        if (!popup) {
            toast("Permita pop-ups para visualizar o documento.");
            return;
        }
        popup.document.write('<p style="font-family:Arial,sans-serif;padding:30px">Gerando documento...</p>');
        popup.document.close();

        fetch("/demo/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) throw new Error("Falha ao gerar PDF");
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            popup.location.href = url;
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        })
        .catch(error => {
            console.error(error);
            popup.close();
            toast("Não foi possível gerar o documento de demonstração.");
        });
    }

    function pdfPayloadForLot(l) {
        return {
            tipo: "lote",
            material: l.tipoTecido,
            peso: Number(l.peso),
            finalidade: l.finalidade,
            industria: nomes.INDUSTRIA,
            industriaCnpj: "Demonstração",
            temMarca: !!l.temMarca,
            assinatura: signatureData()
        };
    }

    function pdfPayloadForRequest(r, l) {
        return {
            tipo: "solicitacao",
            material: l.tipoTecido,
            peso: Number(r.quantidade),
            finalidade: l.finalidade,
            industria: l.industriaNome || nomes.INDUSTRIA,
            industriaCnpj: "Demonstração",
            recebedor: r.nome || nomes[r.perfil] || "Solicitante",
            recebedorCnpj: "Demonstração",
            temMarca: !!l.temMarca,
            assinatura: signatureData()
        };
    }

    function bindPdfButtons(root) {
        (root || document).querySelectorAll("[data-demo-pdf]").forEach(btn => {
            if (btn.dataset.demoPdfBound === "true") return;
            btn.dataset.demoPdfBound = "true";
            btn.addEventListener("click", () => {
                const x = state();
                if (btn.dataset.demoPdf === "lote") {
                    const l = x.lotes.find(v => v.id === btn.dataset.demoLote);
                    if (l) abrirPdfDemo(pdfPayloadForLot(l));
                } else {
                    const r = x.solicitacoes.find(v => v.id === btn.dataset.demoRequest);
                    const l = r && x.lotes.find(v => v.id === r.loteId);
                    if (r && l) abrirPdfDemo(pdfPayloadForRequest(r, l));
                }
            });
        });
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
            } else if (r.status === "ACEITA") {
                action = `<div class="industria-aceita">
                    <div class="industria-acoes-icones">
                        <button type="button" class="tc-icon-action" data-tooltip="Ver informações" aria-label="Ver informações" data-demo-contact="${r.id}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>
                        </button>
                        <button type="button" class="tc-icon-action demo-pdf-link" data-tooltip="Ver PDF" aria-label="Ver PDF" data-demo-pdf="request" data-demo-request="${r.id}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4v13H6z"></path><path d="M14 3.5v4h4"></path><path d="M8.5 15h7"></path><path d="M8.5 18h5"></path></svg>
                        </button>
                    </div>
                    ${l.finalidade === "doacao" || r.pagamentoStatus === "PAGO"
                        ? `<form class="pin-confirm-form" data-demo-retirada="${r.id}"><input type="text" maxlength="4" inputmode="numeric" placeholder="PIN" required><button type="submit" class="btn btn-primary btn-sm">Confirmar</button></form>`
                        : ""}
                </div>`;
            } else {
                action = `<span class="status-text">${esc(r.status === "RECUSADA" ? "Solicitação recusada." : "Material retirado.")}</span>`;
            }

            const pagamento = l.finalidade === "venda"
                ? (r.pagamentoStatus === "PAGO" ? '<span class="pagamento-badge pagamento-badge--confirmado">Confirmado</span>' : '<span class="pagamento-badge pagamento-badge--aguardando">Aguardando</span>')
                : '<span class="pagamento-badge pagamento-badge--na">—</span>';

            return `<tr>
                <td>${esc(l.tipoTecido)}</td>
                <td>${esc(r.nome || nomes[r.perfil] || "Solicitante")}</td>
                <td>${l.finalidade === "doacao" ? "Doação" : "Venda"}</td>
                <td><span class="chip chip--disponivel">${esc(r.status)}</span></td>
                <td class="solicitacoes-industria-pagamento">${pagamento}</td>
                <td class="solicitacoes-industria-acoes-cell"><div class="solicitacao-acoes">${action}</div></td>
            </tr>`;
        }).join("");
        if (empty) empty.hidden = reqs.length > 0;

        panel.querySelectorAll("[data-demo-accept]").forEach(b => b.onclick = () => {
            const x = state();
            const r = x.solicitacoes.find(v => v.id === b.dataset.demoAccept);
            if (!r) return;
            r.status = "ACEITA";
            if (!r.pin) r.pin = String(Math.floor(1000 + Math.random() * 9000));
            save(x);
            toast("Solicitação aceita.");
            renderAll();
        });

        panel.querySelectorAll("[data-demo-reject]").forEach(b => b.onclick = () => {
            const x = state();
            const r = x.solicitacoes.find(v => v.id === b.dataset.demoReject);
            if (!r) return;
            r.status = "RECUSADA";
            save(x);
            toast("Solicitação recusada.");
            renderAll();
        });

        panel.querySelectorAll("[data-demo-retirada]").forEach(f => f.onsubmit = e => {
            e.preventDefault();
            const x = state();
            const r = x.solicitacoes.find(v => v.id === f.dataset.demoRetirada);
            const l = r && x.lotes.find(v => v.id === r.loteId);
            const pin = f.querySelector("input")?.value;
            if (!r || !l) return;
            if (String(r.pin || "") !== String(pin || "")) {
                toast("PIN incorreto.");
                return;
            }
            r.status = "RETIRADA";
            l.peso = Math.max(0, Number(l.peso) - Number(r.quantidade));
            if (l.peso <= 0) l.status = "Encerrado";
            save(x);
            toast("Retirada confirmada com sucesso.");
            renderAll();
        });

        panel.querySelectorAll("[data-demo-contact]").forEach(b => b.onclick = () => {
            window.location.href = "/demo-organizacao.html?solicitacao=" + encodeURIComponent(b.dataset.demoContact);
        });
        bindPdfButtons(panel);
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
            const req = s.solicitacoes.find(r => r.loteId === l.id && r.perfil === profile && ["PENDENTE","ACEITA"].includes(r.status));
            return `<div class="product-card">
                <div class="product-thumb">${l.imagem ? `<img src="${l.imagem}" style="width:100%;height:100%;object-fit:cover;">` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7h18M6 7v13h12V7M9 7V4h6v3"/></svg>`}</div>
                <div class="product-body"><h3>${esc(l.tipoTecido)}</h3><p class="product-source">${profile === "MICROEMPRESA" ? "Vendido por " : "Doado por "}${esc(l.industriaNome)}</p>
                <div class="product-meta"><span>${Number(l.peso).toLocaleString("pt-BR")} kg disponíveis</span></div>
                <div class="product-foot">
                ${profile === "MICROEMPRESA" ? `<div class="product-price-block"><span class="product-price-label">Preço por kg</span><strong class="product-price">${money(precoKg)} / kg</strong></div>` : `<span class="chip chip--gratuito">Gratuito</span>`}
                ${req
                    ? `<div class="lote-solicitado-box"><span class="lote-solicitado-status">✓ ${req.pagamentoStatus === "PAGO" ? "Compra confirmada" : "Solicitação enviada"}</span>${req.status === "PENDENTE" ? `<button type="button" class="btn btn-cancelar-solicitacao" data-demo-cancel="${req.id}">Cancelar solicitação</button>` : ""}</div>`
                    : `<form class="solicitar-form demo-request-form" data-lote="${l.id}"><label class="quantidade-label">Quantidade desejada</label><div class="quantidade-preco-row"><input type="number" class="input-quantidade" min="0.1" step="0.1" max="${Number(l.peso)}" value="1" required>${profile === "MICROEMPRESA" ? `<div class="valor-dinamico"><span>Total</span><strong class="preco-selecionado">${money(precoKg)}</strong></div>` : ""}</div><button type="submit" class="btn btn-primary btn-sm">${profile === "MICROEMPRESA" ? "Solicitar compra" : "Solicitar lote"}</button></form>`}
                </div></div></div>`;
        }).join("");
        if (empty) empty.hidden = lots.length > 0;

        panel.querySelectorAll(".demo-request-form").forEach(form => {
            const loteId = form.dataset.lote;
            const input = form.querySelector(".input-quantidade");
            const total = form.querySelector(".preco-selecionado");
            const update = () => {
                const l = state().lotes.find(x => x.id === loteId);
                if (l && total) total.textContent = money((Number(l.precoFinal || 0) / Number(l.pesoOriginal || l.peso || 1)) * Number(input.value || 0));
            };
            input?.addEventListener("input", update);
            update();
            form.onsubmit = e => {
                e.preventDefault();
                const x = state();
                const l = x.lotes.find(v => v.id === loteId);
                const q = Number(input.value);
                if (!l || q <= 0 || q > Number(l.peso)) { toast("Quantidade inválida."); return; }
                if (x.solicitacoes.some(r => r.loteId === loteId && r.perfil === profile && ["PENDENTE","ACEITA"].includes(r.status))) {
                    toast("Você já possui uma solicitação ativa para este lote.");
                    return;
                }
                const precoKg = profile === "MICROEMPRESA" ? Number(l.precoFinal || 0) / Number(l.pesoOriginal || l.peso || 1) : 0;
                x.solicitacoes.push({ id: uid("sol"), loteId, perfil: profile, nome: nomes[profile], industriaPerfil: "INDUSTRIA", quantidade: q, valor: precoKg * q, status: "PENDENTE", pagamentoStatus: "AGUARDANDO", pin: null, criadoEm: new Date().toISOString() });
                save(x);
                toast("Solicitação enviada para a indústria.");
                renderAll();
            };
        });

        panel.querySelectorAll("[data-demo-cancel]").forEach(b => b.onclick = () => {
            const x = state();
            const r = x.solicitacoes.find(v => v.id === b.dataset.demoCancel);
            if (!r) return;
            r.status = "CANCELADA";
            save(x);
            toast("Solicitação cancelada.");
            renderAll();
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
            const l = s.lotes.find(x => x.id === r.loteId);
            if (!l) return "";
            let actions = "";

            if (r.status === "PENDENTE") {
                actions = `<span class="status-text">Aguardando análise da indústria.</span>`;
            } else if (r.status === "ACEITA" && profile === "MICROEMPRESA" && l.finalidade === "venda") {
                if (r.pagamentoStatus === "PAGO") {
                    actions = `<div class="tc-actions-row"><div class="venda-pago">
                        <button type="button" class="btn btn-pagamento-pdf demo-pdf-link" data-demo-pdf="request" data-demo-request="${r.id}">Ver PDF</button>
                        <span class="pagamento-confirmado-inline">✓ Pagamento confirmado</span>
                        <span class="pin-display">PIN: <strong>${esc(r.pin || "0000")}</strong></span>
                    </div></div>`;
                } else {
                    actions = `<div class="tc-actions-row"><div class="venda-acoes">
                        <button type="button" class="btn btn-pagamento-pdf demo-pdf-link" data-demo-pdf="request" data-demo-request="${r.id}">Ver PDF</button>
                        <button type="button" class="btn btn-pagamento-pix" data-demo-pay="${r.id}">Pagar com PIX</button>
                        <button type="button" class="btn btn-pagamento-dinheiro" data-demo-pay-money="${r.id}">Pagar em dinheiro</button>
                    </div></div>`;
                }
            } else if (r.status === "ACEITA" && profile === "ONG") {
                actions = `<div class="tc-actions-row tc-actions-row--ong">
                    <button type="button" class="tc-icon-action" data-tooltip="Ver informações" aria-label="Ver informações" data-demo-buyer-contact="${r.id}">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>
                    </button>
                    <button type="button" class="tc-icon-action demo-pdf-link" data-tooltip="Ver PDF" aria-label="Ver PDF" data-demo-pdf="request" data-demo-request="${r.id}">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4v13H6z"></path><path d="M14 3.5v4h4"></path><path d="M8.5 15h7"></path><path d="M8.5 18h5"></path></svg>
                    </button>
                    <span class="pin-display">Seu PIN: <strong>${esc(r.pin || "0000")}</strong></span>
                </div>`;
            } else if (r.status === "ACEITA") {
                actions = `<span class="status-text">Aguardando retirada.</span>`;
            } else if (r.status === "RETIRADA") {
                actions = `<span class="status-text">Material retirado.</span>`;
            } else if (r.status === "RECUSADA") {
                actions = `<span class="status-text">Solicitação recusada.</span>`;
            } else if (r.status === "CANCELADA") {
                actions = `<span class="status-text">Solicitação cancelada.</span>`;
            }

            if (profile === "ONG") {
                return `<tr><td>${esc(l.tipoTecido)}</td><td>${esc(l.industriaNome)}</td><td>${Number(r.quantidade).toLocaleString("pt-BR")} kg</td><td><span class="chip chip--disponivel">${esc(r.status)}</span></td><td>${actions}</td></tr>`;
            }
            return `<tr><td>${esc(l.tipoTecido)}</td><td>${esc(l.industriaNome)}</td><td>${Number(r.quantidade).toLocaleString("pt-BR")} kg</td><td>${l.finalidade === "venda" ? money(r.valor) : "Gratuito"}</td><td><span class="chip chip--disponivel">${esc(r.status)}</span></td><td>${actions}</td></tr>`;
        }).join("");

        if (empty) empty.hidden = reqs.length > 0;

        panel.querySelectorAll("[data-demo-pay], [data-demo-pay-money]").forEach(b => b.onclick = () => {
            const x = state();
            const r = x.solicitacoes.find(v => v.id === (b.dataset.demoPay || b.dataset.demoPayMoney));
            if (!r) return;
            r.pagamentoStatus = "PAGO";
            if (!r.pin) r.pin = String(Math.floor(1000 + Math.random() * 9000));
            save(x);
            toast("Pagamento simulado confirmado.");
            renderAll();
        });

        panel.querySelectorAll("[data-demo-buyer-contact]").forEach(b => b.onclick = () => {
            const existing = document.getElementById("demo-industry-contact");
            const same = existing && existing.dataset.request === b.dataset.demoBuyerContact;
            if (closeContact) closeContact();
            panel.querySelectorAll("[data-demo-buyer-contact]").forEach(button => button.setAttribute("aria-expanded", "false"));
            if (same) return;
            const pop = document.createElement("div");
            pop.id = "demo-industry-contact";
            pop.className = "tc-contact-popover demo-contact-floating";
            pop.dataset.request = b.dataset.demoBuyerContact;
            pop.innerHTML = '<div>E-mail: demo.industria@texciclo.local</div><div>Telefone: (47) 0000-0000</div>';
            document.body.appendChild(pop);
            b.setAttribute("aria-expanded", "true");
            b.setAttribute("aria-controls", pop.id);
            const position = () => {
                if (!b.isConnected || !b.getClientRects().length) { pop.remove(); return; }
                const rect = b.getBoundingClientRect();
                const width = pop.offsetWidth, height = pop.offsetHeight;
                pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) + "px";
                pop.style.top = Math.max(8, rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 8 : rect.top - height - 8) + "px";
            };
            const cleanup = () => {
                pop.remove(); b.setAttribute("aria-expanded", "false");
                window.removeEventListener("resize", position);
                document.removeEventListener("scroll", position, true);
                document.removeEventListener("click", outside);
                closeContact = null;
            };
            closeContact = cleanup;
            position();
            const outside = e => { if (!b.contains(e.target) && !pop.contains(e.target)) cleanup(); };
            window.addEventListener("resize", position);
            document.addEventListener("scroll", position, true);
            setTimeout(() => { if (pop.isConnected) document.addEventListener("click", outside); }, 0);
        });

        bindPdfButtons(panel);
    }

    function renderAll() {
        if (closeContact) closeContact();
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

    function renderOrganization() {
        const s = state();
        const id = new URLSearchParams(window.location.search).get("solicitacao");
        const r = s.solicitacoes.find(v => v.id === id && v.industriaPerfil === "INDUSTRIA" && v.status === "ACEITA");
        const l = r && s.lotes.find(v => v.id === r.loteId);
        if (!r || !l) {
            document.querySelector(".info-card").textContent = "Estas informações não estão mais disponíveis. Volte para solicitações.";
            return;
        }
        const values = {
            nome: r.nome || nomes[r.perfil], tipo: r.perfil === "ONG" ? "ONG" : "Microempresa",
            cnpj: "00.000.000/0000-00", cidade: "Blumenau - SC", telefone: "(47) 0000-0000",
            email: r.perfil === "ONG" ? "demo.ong@texciclo.local" : "demo.micro@texciclo.local",
            descricao: r.perfil === "ONG" ? "Organização fictícia de demonstração do TexCiclo." : "Microempresa fictícia de demonstração do TexCiclo.",
            material: l.tipoTecido, quantidade: Number(r.quantidade).toLocaleString("pt-BR") + " kg"
        };
        document.querySelectorAll("[data-organization-field]").forEach(el => {
            el.textContent = values[el.dataset.organizationField] || "Não informado";
        });
    }

    function start() {
        if (document.body.dataset.demoMode !== "true") return;
        if (document.body.dataset.demoOrganization === "true") { renderOrganization(); return; }
        initSignatureLocal();
        renderAll();
        document.querySelectorAll(".dash-tab").forEach(tab => {
            if (tab.dataset.demoLocalBound === "true") return;
            tab.dataset.demoLocalBound = "true";
            tab.addEventListener("click", () => setTimeout(renderAll, 0));
        });
    }

    window.addEventListener("texciclo:assinatura-demo-salva", updateSignatureUI);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
