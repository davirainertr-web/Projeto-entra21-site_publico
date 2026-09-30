/* ============================================================
   TEXCICLO — MODO DEMONSTRAÇÃO LOCAL
   Os dados deste arquivo ficam somente no localStorage do navegador.
   Não há gravação de lotes/solicitações no PostgreSQL no modo demo.
   ============================================================ */
(function () {
    "use strict";

    const STORAGE_KEY = "texciclo_demo_local_v2";
    const TAXA_PLATAFORMA = 0.10;

    const perfil = (document.body.dataset.demoPerfil || "").toUpperCase();
    const nomes = {
        INDUSTRIA: "Vale Verde Têxtil — Demonstração",
        ONG: "Instituto Retomada — Demonstração",
        MICROEMPRESA: "Ateliê Boa Costura — Demonstração"
    };

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const state = raw ? JSON.parse(raw) : null;
            if (state && Array.isArray(state.lotes) && Array.isArray(state.solicitacoes)) {
                return state;
            }
        } catch (e) {
            console.warn("TexCiclo demo: não foi possível ler o localStorage.", e);
        }
        return { lotes: [], solicitacoes: [] };
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function money(value) {
        return Number(value || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function uid(prefix) {
        return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    }

    function notify(message) {
        let box = document.getElementById("texciclo-demo-toast");
        if (!box) {
            box = document.createElement("div");
            box.id = "texciclo-demo-toast";
            document.body.appendChild(box);
        }
        box.textContent = message;
        box.classList.add("show");
        clearTimeout(box._timer);
        box._timer = setTimeout(() => box.classList.remove("show"), 3000);
    }

    const ASSINATURA_KEY = "texciclo_demo_assinatura_v1";

    function assinaturaDemoSalva() {
        try {
            return localStorage.getItem(ASSINATURA_KEY) || "";
        } catch (e) {
            return "";
        }
    }

    function atualizarAssinaturaDemoUI() {
        const assinatura = assinaturaDemoSalva();
        const botao = document.getElementById("btnAssinatura");
        const preview = document.querySelector(".signature-preview-box");
        const vazio = document.querySelector(".signature-empty");

        if (!botao) return;

        const possui = !!assinatura;
        botao.dataset.possuiAssinatura = String(possui);
        botao.classList.toggle("signature-button--saved", possui);
        botao.innerHTML = possui
            ? "Assinatura cadastrada · Alterar"
            : "Criar assinatura digital";

        if (preview) {
            preview.hidden = !possui;
            if (possui) {
                preview.innerHTML = `<img src="${assinatura}" alt="Sua assinatura digital"><span>Assinatura cadastrada</span>`;
            }
        }

        if (vazio) {
            vazio.hidden = possui;
        }
    }

    function prepararAssinaturaDemo() {
        const painel = document.getElementById("gerenciadorAssinatura");
        if (painel && painel.parentElement !== document.body) {
            // O painel original fica dentro do conteúdo que o modo demo
            // recria dinamicamente. Movemos somente o gerenciador para fora
            // para que o botão do topo continue funcionando.
            document.body.appendChild(painel);
        }

        atualizarAssinaturaDemoUI();

        if (!assinaturaDemoSalva()) {
            setTimeout(() => {
                const botao = document.getElementById("btnAssinatura");
                if (botao) botao.click();
            }, 250);
        }
    }

    function initIndustry() {
        const main = document.querySelector(".app-main");
        if (!main) return;

        prepararAssinaturaDemo();

        main.innerHTML = `
            <div class="wrap">
                <div class="app-head">
                    <span class="eyebrow">Gestão de excedentes</span>
                    <h1>Transforme sobra industrial em valor.</h1>
                    <p>Cadastre materiais, acompanhe solicitações e visualize o impacto da sua operação.</p>
                </div>

                <div class="dash-tabs">
                    <button type="button" class="dash-tab active" data-local-tab="lotes">Meus lotes</button>
                    <button type="button" class="dash-tab" data-local-tab="novo">Novo lote</button>
                    <button type="button" class="dash-tab" data-local-tab="solicitacoes">Solicitações</button>
                    <button type="button" class="dash-tab" data-local-tab="sustentabilidade">Sustentabilidade</button>
                </div>

                <section class="panel" id="local-panel-lotes"></section>
                <section class="panel" id="local-panel-novo" hidden></section>
                <section class="panel" id="local-panel-solicitacoes" hidden></section>
                <section class="panel" id="local-panel-sustentabilidade" hidden></section>
            </div>
        `;

        main.querySelectorAll("[data-local-tab]").forEach(btn => {
            btn.addEventListener("click", () => {
                main.querySelectorAll("[data-local-tab]").forEach(b => b.classList.remove("active"));
                main.querySelectorAll(".panel").forEach(p => p.hidden = true);
                btn.classList.add("active");
                document.getElementById("local-panel-" + btn.dataset.localTab).hidden = false;
                renderIndustry();
            });
        });

        renderIndustry();
        atualizarAssinaturaDemoUI();
        if (typeof window.texcicloDemoInfoRefresh === "function") {
            requestAnimationFrame(window.texcicloDemoInfoRefresh);
        }
    }

    function renderIndustry() {
        const state = loadState();
        renderIndustryLots(state);
        renderIndustryForm(state);
        renderIndustryRequests(state);
        renderIndustrySustainability(state);
    }

    function renderIndustryLots(state) {
        const panel = document.getElementById("local-panel-lotes");
        if (!panel) return;

        const lots = state.lotes.filter(l => l.industriaPerfil === "INDUSTRIA");

        panel.innerHTML = `
            <div class="panel-head">
                <div>
                    <span class="eyebrow">Meus lotes</span>
                    <h2>Materiais cadastrados</h2>
                </div>
                <span class="chip chip--disponivel">${lots.length} lote(s)</span>
            </div>
            ${lots.length ? `
                <div class="table-wrap">
                <table class="lot-table">
                    <thead><tr>
                        <th>Imagem</th><th>Tecido</th><th>Peso</th><th>Finalidade</th>
                        <th>Valor</th><th>Status</th>
                    </tr></thead>
                    <tbody>
                    ${lots.map(l => `
                        <tr>
                            <td>${l.imagem ? `<img src="${l.imagem}" alt="Imagem do lote" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` : "Sem imagem"}</td>
                            <td>${esc(l.tipoTecido)}</td>
                            <td>${Number(l.peso).toLocaleString("pt-BR")} kg</td>
                            <td>${l.finalidade === "venda" ? "Venda" : "Doação"}</td>
                            <td>
                                ${l.finalidade === "venda"
                                    ? `<strong>${money(l.precoFinal)}</strong><br><small>Base: ${money(l.precoBase)} + taxa de 10%</small>`
                                    : "Gratuito"}
                            </td>
                            <td>${esc(l.status)}</td>
                        </tr>
                    `).join("")}
                    </tbody>
                </table></div>
            ` : `<p class="empty-note">Nenhum lote cadastrado neste navegador.</p>`}
        `;
    }

    function renderIndustryForm() {
        const panel = document.getElementById("local-panel-novo");
        if (!panel) return;

        panel.innerHTML = `
            <div class="panel-head">
                <div>
                    <span class="eyebrow">Novo lote</span>
                    <h2>Cadastre um material</h2>
                </div>
            </div>
            <form id="demo-lote-form">
                <div class="lote-form-grid">
                    <div class="lote-form-field">
                        <label for="demo-tipo">Tipo de tecido</label>
                        <input type="text" id="demo-tipo" required placeholder="Ex.: Algodão, malha, poliéster...">
                    </div>
                    <div class="lote-form-field">
                        <label for="demo-peso">Peso do lote</label>
                        <div class="input-sufixo"><input type="number" id="demo-peso" min="0.1" step="0.1" required placeholder="Ex.: 150"><span>kg</span></div>
                    </div>
                    <div class="lote-form-field lote-form-wide">
                        <label>O que você deseja fazer com o lote?</label>
                        <div class="opcoes-finalidade">
                            <label class="opcao-finalidade">
                                <input type="radio" name="demo-finalidade" value="doacao" required>
                                <span><strong>Doação</strong><small>Disponibilizar para uma ONG</small></span>
                            </label>
                            <label class="opcao-finalidade">
                                <input type="radio" name="demo-finalidade" value="venda">
                                <span><strong>Venda</strong><small>Disponibilizar para uma microempresa</small></span>
                            </label>
                        </div>
                    </div>
                    <div class="lote-form-field lote-form-wide" id="demo-preco-box" hidden>
                        <label for="demo-preco">Preço que a indústria deseja receber</label>
                        <div class="input-sufixo"><input type="number" id="demo-preco" min="0.01" step="0.01" placeholder="Ex.: 100.00"><span>R$</span></div>
                        <div class="demo-tax-preview" id="demo-tax-preview">
                            A taxa da plataforma é de 10% sobre o valor informado. Ex.: R$ 100,00 → R$ 110,00 para a microempresa.
                        </div>
                    </div>
                    <div class="lote-form-field lote-form-wide">
                        <label>Foto do material</label>
                        <label class="upload-area" for="demo-imagem">
                            <span class="upload-icon">+</span>
                            <strong>Clique para escolher uma imagem</strong>
                            <small>JPG, PNG ou WEBP • opcional</small>
                        </label>
                        <input type="file" id="demo-imagem" accept="image/jpeg,image/png,image/webp" hidden>
                        <div id="demo-preview" class="preview-imagem" hidden><img id="demo-preview-img" alt="Pré-visualização"></div>
                    </div>
                    <div class="lote-form-field lote-form-wide">
                        <label class="checkbox-marca">
                            <input type="checkbox" id="demo-marca">
                            <span><strong>Este material possui marca, etiqueta ou estampa?</strong><small>Se marcado, o compromisso de descaracterização será indicado na demonstração.</small></span>
                        </label>
                    </div>
                </div>
                <div class="lote-form-footer">
                    <button type="submit" class="btn btn-primary">Cadastrar lote</button>
                </div>
            </form>
        `;

        const finalidade = panel.querySelectorAll('input[name="demo-finalidade"]');
        const precoBox = panel.querySelector("#demo-preco-box");
        const preco = panel.querySelector("#demo-preco");
        const preview = panel.querySelector("#demo-tax-preview");
        finalidade.forEach(r => r.addEventListener("change", () => {
            const venda = panel.querySelector('input[name="demo-finalidade"]:checked')?.value === "venda";
            precoBox.hidden = !venda;
            preco.required = venda;
            updateTaxPreview();
        }));

        function updateTaxPreview() {
            const base = Number(preco.value || 0);
            if (base > 0) {
                const taxa = base * TAXA_PLATAFORMA;
                preview.innerHTML = `A taxa de 10% é <strong>${money(taxa)}</strong>. Valor final para a microempresa: <strong>${money(base + taxa)}</strong>.`;
            } else {
                preview.textContent = "A taxa da plataforma é de 10% sobre o valor informado. Ex.: R$ 100,00 → R$ 110,00 para a microempresa.";
            }
        }
        preco.addEventListener("input", updateTaxPreview);

        panel.querySelector("#demo-imagem").addEventListener("change", e => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2.5 * 1024 * 1024) {
                notify("Escolha uma imagem de até 2,5 MB para a demonstração.");
                e.target.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                panel.querySelector("#demo-preview-img").src = reader.result;
                panel.querySelector("#demo-preview").hidden = false;
            };
            reader.readAsDataURL(file);
        });

        panel.querySelector("#demo-lote-form").addEventListener("submit", e => {
            e.preventDefault();

            const tipo = panel.querySelector("#demo-tipo").value.trim();
            const peso = Number(panel.querySelector("#demo-peso").value);
            const finalidadeValue = panel.querySelector('input[name="demo-finalidade"]:checked')?.value;
            const precoBase = finalidadeValue === "venda" ? Number(preco.value) : 0;
            const marca = panel.querySelector("#demo-marca").checked;
            const img = panel.querySelector("#demo-preview-img")?.src || "";

            if (!tipo || !peso || peso <= 0 || !finalidadeValue || (finalidadeValue === "venda" && (!precoBase || precoBase <= 0))) {
                notify("Preencha os campos obrigatórios.");
                return;
            }

            const state = loadState();
            const taxa = finalidadeValue === "venda" ? precoBase * TAXA_PLATAFORMA : 0;
            const lote = {
                id: uid("lote"),
                industriaPerfil: "INDUSTRIA",
                industriaNome: nomes.INDUSTRIA,
                tipoTecido: tipo,
                peso,
                pesoOriginal: peso,
                finalidade: finalidadeValue,
                temMarca: marca,
                imagem: img,
                precoBase,
                taxaPlataforma: taxa,
                precoFinal: precoBase + taxa,
                status: "Disponível",
                criadoEm: new Date().toISOString()
            };

            state.lotes.push(lote);
            saveState(state);
            notify(finalidadeValue === "venda"
                ? `Lote cadastrado. Valor final para a microempresa: ${money(lote.precoFinal)}.`
                : "Lote de doação cadastrado.");
            renderIndustry();
            const tab = document.querySelector('[data-local-tab="lotes"]');
            if (tab) tab.click();
        });
    }

    function renderIndustryRequests(state) {
        const panel = document.getElementById("local-panel-solicitacoes");
        if (!panel) return;

        const reqs = state.solicitacoes;
        panel.innerHTML = `
            <div class="panel-head">
                <div><span class="eyebrow">Solicitações</span><h2>Interesse nos seus lotes</h2></div>
            </div>
            ${reqs.length ? `
            <div class="table-wrap"><table class="lot-table">
                <thead><tr><th>Lote</th><th>Solicitante</th><th>Finalidade</th><th>Quantidade</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                ${reqs.map(s => {
                    const l = state.lotes.find(x => x.id === s.loteId);
                    if (!l) return "";
                    return `<tr>
                        <td>${esc(l.tipoTecido)}</td>
                        <td>${esc(s.nome)}</td>
                        <td>${l.finalidade === "venda" ? "Venda" : "Doação"}</td>
                        <td>${Number(s.quantidade).toLocaleString("pt-BR")} kg</td>
                        <td>${l.finalidade === "venda" ? money(s.valor) : "Gratuito"}</td>
                        <td>${esc(s.status)}${s.pagamentoStatus === "PAGO" ? " • PAGO" : ""}</td>
                        <td>
                            ${s.status === "PENDENTE" ? `
                                <button class="btn btn-primary btn-sm" data-action="accept" data-id="${s.id}">Aceitar</button>
                                <button class="btn btn-recusar btn-sm" data-action="reject" data-id="${s.id}">Recusar</button>
                            ` : ""}
                            ${s.status === "ACEITA" && (l.finalidade === "doacao" || s.pagamentoStatus === "PAGO") ? `
                                <button class="btn btn-primary btn-sm" data-action="deliver" data-id="${s.id}">Confirmar retirada</button>
                            ` : ""}
                        </td>
                    </tr>`;
                }).join("")}
                </tbody>
            </table></div>` : `<p class="empty-note">Nenhuma solicitação ainda.</p>`}
        `;

        panel.querySelectorAll("[data-action]").forEach(btn => {
            btn.addEventListener("click", () => {
                const stateNow = loadState();
                const req = stateNow.solicitacoes.find(s => s.id === btn.dataset.id);
                if (!req) return;
                const lote = stateNow.lotes.find(l => l.id === req.loteId);

                if (btn.dataset.action === "accept") {
                    req.status = "ACEITA";
                    req.pin = String(Math.floor(1000 + Math.random() * 9000));
                    saveState(stateNow);
                    notify("Solicitação aceita.");
                } else if (btn.dataset.action === "reject") {
                    req.status = "RECUSADA";
                    saveState(stateNow);
                    notify("Solicitação recusada.");
                } else if (btn.dataset.action === "deliver") {
                    req.status = "RETIRADA";
                    if (lote) {
                        lote.peso = Math.max(0, Number(lote.peso) - Number(req.quantidade));
                        if (lote.peso <= 0) lote.status = "Encerrado";
                    }
                    saveState(stateNow);
                    notify("Retirada confirmada e lote atualizado.");
                }
                renderIndustry();
            });
        });
    }

    function renderIndustrySustainability(state) {
        const panel = document.getElementById("local-panel-sustentabilidade");
        if (!panel) return;
        const retirada = state.solicitacoes
            .filter(s => s.status === "RETIRADA")
            .reduce((sum, s) => sum + Number(s.quantidade || 0), 0);

        panel.innerHTML = `
            <div class="panel-head"><div><span class="eyebrow">Indicadores</span><h2>Impacto da demonstração</h2></div></div>
            <div class="impacto-grid">
                <div class="impacto-item"><div class="impacto-num">${retirada.toLocaleString("pt-BR", {minimumFractionDigits: 1})} kg</div><div class="impacto-label">desviados do aterro</div></div>
                <div class="impacto-item"><div class="impacto-num">${state.solicitacoes.filter(s => s.status === "RETIRADA").length}</div><div class="impacto-label">entregas realizadas</div></div>
            </div>
        `;
    }

    function initBuyer(profile) {
        const main = document.querySelector(".app-main");
        if (!main) return;

        main.innerHTML = `
            <div class="wrap">
                <div class="app-head">
                    <span class="eyebrow">${profile === "MICROEMPRESA" ? "Marketplace de excedentes" : "Rede de impacto social"}</span>
                    <h1>${profile === "MICROEMPRESA" ? "Matéria-prima de qualidade, por uma fração do preço." : "Materiais que podem gerar impacto social."}</h1>
                    <p>${profile === "MICROEMPRESA" ? "Encontre materiais disponibilizados por indústrias parceiras." : "Encontre doações disponibilizadas por indústrias parceiras."}</p>
                </div>
                <div class="dash-tabs">
                    <button type="button" class="dash-tab active" data-local-tab="vitrine">Vitrine</button>
                    <button type="button" class="dash-tab" data-local-tab="minhas">Minhas solicitações</button>
                </div>
                <section class="panel" id="local-panel-vitrine"></section>
                <section class="panel" id="local-panel-minhas" hidden></section>
            </div>
        `;

        main.querySelectorAll("[data-local-tab]").forEach(btn => {
            btn.addEventListener("click", () => {
                main.querySelectorAll("[data-local-tab]").forEach(b => b.classList.remove("active"));
                main.querySelectorAll(".panel").forEach(p => p.hidden = true);
                btn.classList.add("active");
                document.getElementById("local-panel-" + btn.dataset.localTab).hidden = false;
                renderBuyer(profile);
            });
        });

        renderBuyer(profile);
        if (typeof window.texcicloDemoInfoRefresh === "function") {
            requestAnimationFrame(window.texcicloDemoInfoRefresh);
        }
    }

    function renderBuyer(profile) {
        const state = loadState();
        renderBuyerVitrine(state, profile);
        renderBuyerRequests(state, profile);
    }

    function renderBuyerVitrine(state, profile) {
        const panel = document.getElementById("local-panel-vitrine");
        if (!panel) return;

        const finalidade = profile === "MICROEMPRESA" ? "venda" : "doacao";
        const lotes = state.lotes.filter(l =>
            l.finalidade === finalidade &&
            Number(l.peso) > 0 &&
            l.status === "Disponível"
        );

        panel.innerHTML = `
            <div class="panel-head"><div><span class="eyebrow">Vitrine</span><h2>${profile === "MICROEMPRESA" ? "Lotes à venda" : "Lotes para doação"}</h2></div></div>
            ${lotes.length ? `
            <div class="product-grid">
                ${lotes.map(l => {
                    const precoKg = l.finalidade === "venda" ? Number(l.precoFinal) / Number(l.pesoOriginal || l.peso) : 0;
                    return `<article class="product-card">
                        <div class="product-thumb">
                            ${l.imagem ? `<img src="${l.imagem}" alt="Imagem do lote" style="width:100%;height:100%;object-fit:cover;">` : `<div style="padding:30px;text-align:center;">Tecido</div>`}
                        </div>
                        <div class="product-body">
                            <h3>${esc(l.tipoTecido)}</h3>
                            <p class="product-source">Vendido por ${esc(l.industriaNome)}</p>
                            <div class="product-meta"><span>${Number(l.peso).toLocaleString("pt-BR")} kg disponíveis</span></div>
                            <div class="product-foot">
                                ${profile === "MICROEMPRESA" ? `
                                    <div class="product-price-block">
                                        <span class="product-price-label">Preço final por kg</span>
                                        <strong class="product-price">${money(precoKg)} / kg</strong>
                                        <small>Inclui taxa de 10% da plataforma</small>
                                    </div>
                                ` : `<div class="product-price-block"><span class="product-price-label">Valor</span><strong class="product-price">Doação</strong></div>`}
                                <form class="local-request-form" data-lote="${l.id}">
                                    <label class="quantidade-label">Quantidade desejada</label>
                                    <div class="quantidade-preco-row">
                                        <input type="number" class="input-quantidade" min="0.1" step="0.1" max="${Number(l.peso)}" value="1" required>
                                        ${profile === "MICROEMPRESA" ? `<div class="valor-dinamico"><span>Total</span><strong class="preco-selecionado">${money(precoKg)}</strong></div>` : ""}
                                    </div>
                                    <button type="submit" class="btn btn-primary btn-sm">${profile === "MICROEMPRESA" ? "Solicitar compra" : "Solicitar lote"}</button>
                                </form>
                            </div>
                        </div>
                    </article>`;
                }).join("")}
            </div>` : `<p class="empty-note">${profile === "MICROEMPRESA" ? "Nenhum lote à venda neste navegador." : "Nenhum lote de doação neste navegador."}</p>`}
        `;

        panel.querySelectorAll(".local-request-form").forEach(form => {
            const loteId = form.dataset.lote;
            const lote = state.lotes.find(l => l.id === loteId);
            const input = form.querySelector(".input-quantidade");
            const total = form.querySelector(".preco-selecionado");

            function updateTotal() {
                if (!total || !lote) return;
                const precoKg = Number(lote.precoFinal) / Number(lote.pesoOriginal || lote.peso);
                total.textContent = money(precoKg * Number(input.value || 0));
            }
            input.addEventListener("input", updateTotal);
            updateTotal();

            form.addEventListener("submit", e => {
                e.preventDefault();
                const quantidade = Number(input.value);
                if (!lote || !quantidade || quantidade <= 0 || quantidade > Number(lote.peso)) {
                    notify("Quantidade inválida.");
                    return;
                }

                const stateNow = loadState();
                const ja = stateNow.solicitacoes.some(s =>
                    s.loteId === loteId &&
                    s.perfil === profile &&
                    ["PENDENTE", "ACEITA"].includes(s.status)
                );
                if (ja) {
                    notify("Você já possui uma solicitação ativa para este lote.");
                    return;
                }

                const precoKg = profile === "MICROEMPRESA"
                    ? Number(lote.precoFinal) / Number(lote.pesoOriginal || lote.peso)
                    : 0;

                stateNow.solicitacoes.push({
                    id: uid("sol"),
                    loteId,
                    perfil: profile,
                    nome: nomes[profile],
                    quantidade,
                    valor: profile === "MICROEMPRESA" ? precoKg * quantidade : 0,
                    status: "PENDENTE",
                    pagamentoStatus: "AGUARDANDO",
                    pin: null,
                    criadoEm: new Date().toISOString()
                });

                saveState(stateNow);
                notify("Solicitação enviada para a indústria.");
                renderBuyer(profile);
            });
        });
    }

    function renderBuyerRequests(state, profile) {
        const panel = document.getElementById("local-panel-minhas");
        if (!panel) return;

        const reqs = state.solicitacoes.filter(s => s.perfil === profile);

        panel.innerHTML = `
            <div class="panel-head"><div><span class="eyebrow">Acompanhamento</span><h2>Minhas solicitações</h2></div></div>
            ${reqs.length ? `
            <div class="table-wrap"><table class="lot-table">
                <thead><tr><th>Material</th><th>Quantidade</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                ${reqs.map(s => {
                    const l = state.lotes.find(x => x.id === s.loteId);
                    if (!l) return "";
                    let actions = "";
                    if (s.status === "PENDENTE") {
                        actions = `<button class="btn btn-cancelar-solicitacao" data-cancel="${s.id}">Cancelar</button>`;
                    } else if (s.status === "ACEITA" && l.finalidade === "venda" && s.pagamentoStatus !== "PAGO") {
                        actions = `
                            <button class="btn btn-pagamento-pix" data-pay="${s.id}">PIX simulado</button>
                            <button class="btn btn-pagamento-dinheiro" data-pay-money="${s.id}">Dinheiro</button>
                        `;
                    } else if (s.status === "ACEITA" && (l.finalidade === "doacao" || s.pagamentoStatus === "PAGO")) {
                        actions = `<button class="btn btn-primary btn-sm" data-pickup="${s.id}">Confirmar retirada</button>`;
                    } else if (s.status === "RETIRADA") {
                        actions = `<span class="status-inline">Material retirado.</span>`;
                    }
                    return `<tr>
                        <td>${esc(l.tipoTecido)}</td>
                        <td>${Number(s.quantidade).toLocaleString("pt-BR")} kg</td>
                        <td>${l.finalidade === "venda" ? money(s.valor) : "Gratuito"}</td>
                        <td>${esc(s.status)}${s.pagamentoStatus === "PAGO" ? " • PAGO" : ""}${s.pin ? `<br><small>PIN: <strong>${esc(s.pin)}</strong></small>` : ""}</td>
                        <td>${actions}</td>
                    </tr>`;
                }).join("")}
                </tbody>
            </table></div>` : `<p class="empty-note">Você ainda não solicitou nenhum lote neste navegador.</p>`}
        `;

        panel.querySelectorAll("[data-cancel]").forEach(btn => btn.addEventListener("click", () => {
            const s = loadState();
            const req = s.solicitacoes.find(x => x.id === btn.dataset.cancel);
            if (req && req.status === "PENDENTE") {
                req.status = "CANCELADA";
                saveState(s);
                notify("Solicitação cancelada.");
                renderBuyer(profile);
            }
        }));

        panel.querySelectorAll("[data-pay], [data-pay-money]").forEach(btn => btn.addEventListener("click", () => {
            const s = loadState();
            const reqId = btn.dataset.pay || btn.dataset.payMoney;
            const req = s.solicitacoes.find(x => x.id === reqId);
            if (!req) return;
            req.pagamentoStatus = "PAGO";
            req.pin = String(Math.floor(1000 + Math.random() * 9000));
            saveState(s);
            notify(btn.dataset.pay ? "PIX simulado confirmado." : "Pagamento em dinheiro registrado.");
            renderBuyer(profile);
        }));

        panel.querySelectorAll("[data-pickup]").forEach(btn => btn.addEventListener("click", () => {
            const s = loadState();
            const req = s.solicitacoes.find(x => x.id === btn.dataset.pickup);
            const lote = req ? s.lotes.find(x => x.id === req.loteId) : null;
            if (!req || !lote) return;
            req.status = "RETIRADA";
            lote.peso = Math.max(0, Number(lote.peso) - Number(req.quantidade));
            if (lote.peso <= 0) lote.status = "Encerrado";
            saveState(s);
            notify("Retirada confirmada. O ciclo foi encerrado.");
            renderBuyer(profile);
        }));
    }

    window.addEventListener("texciclo:assinatura-demo-salva", function () {
        atualizarAssinaturaDemoUI();
        notify("Assinatura digital cadastrada para esta demonstração.");
    });

    function start() {
        if (document.body.dataset.demoMode !== "true") return;
        if (perfil === "INDUSTRIA") initIndustry();
        if (perfil === "ONG" || perfil === "MICROEMPRESA") initBuyer(perfil);
    }

    document.addEventListener("DOMContentLoaded", start);
})();
