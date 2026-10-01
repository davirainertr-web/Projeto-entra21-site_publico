/* ============================================================
   TEXCICLO — DEMONSTRAÇÃO PÚBLICA
   Mantém a interface do projeto completo e guarda somente o
   estado da demonstração no localStorage do navegador.
   ============================================================ */
(function () {
    "use strict";

    const KEY = "texciclo_demo_publico_v3";
    const SIGN_KEY = "texciclo_demo_assinatura_v2";
    const TAXA = 0.10;
    const perfil = (document.body.dataset.demoPerfil || "").toUpperCase();

    const nomes = {
        INDUSTRIA: "Vale Verde Têxtil — Demonstração",
        ONG: "Instituto Retomada — Demonstração",
        MICROEMPRESA: "Ateliê Boa Costura — Demonstração"
    };

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
        return { lotes: [], solicitacoes: [] };
    }
    function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

    function toast(msg) {
        let el = document.getElementById("texciclo-demo-toast");
        if (!el) {
            el = document.createElement("div");
            el.id = "texciclo-demo-toast";
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

    }

    document.addEventListener("DOMContentLoaded", start);
})();
