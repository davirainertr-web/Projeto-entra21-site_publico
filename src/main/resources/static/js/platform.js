const texciclo = {};

window.texciclo = texciclo;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    texciclo.initTabs();
    texciclo.initFiltros();
    texciclo.initNovoLote();
    texciclo.initCadastro();
    texciclo.autoAbrirMinhasSolicitacoes();
    texciclo.initMascaras();
    texciclo.initPreviewImagem();
    texciclo.initFinalidade();
    texciclo.initCalculoPreco();
    texciclo.initModais();
    texciclo.initAvatar();
    texciclo.initAssinaturaTopo();
    texciclo.initAssinatura();
    texciclo.abrirAbaPelaUrl();

    console.log("Platform.js carregado com sucesso.");
});


// ============================================================
// ABAS
// ============================================================

texciclo.initTabs = function () {

    const tabs = document.querySelectorAll(".dash-tab");
    const paineis = document.querySelectorAll(".panel");

    if (!tabs.length) {
        return;
    }

    tabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            const destino = tab.dataset.target;

            // Remove active
            tabs.forEach(function (item) {
                item.classList.remove("active");
            });

            // Esconde painéis
            paineis.forEach(function (painel) {
                painel.hidden = true;
            });

            // Ativa aba
            tab.classList.add("active");

            // Mostra painel
            const painelSelecionado =
                document.getElementById(destino);

            if (painelSelecionado) {
                painelSelecionado.hidden = false;
            }
        });
    });
};

// ============================================================
// ABRIR ABA CORRETA APÓS REDIRECT (ex: ?aba=solicitacoes)
// ============================================================

texciclo.abrirAbaPelaUrl = function () {

    const params = new URLSearchParams(window.location.search);
    const aba = params.get("aba");

    if (!aba) {
        return;
    }

    const destino = "painel-" + aba;

    const tabs = document.querySelectorAll(".dash-tab");
    const paineis = document.querySelectorAll(".panel");

    if (!tabs.length) {
        return;
    }

    tabs.forEach(function (item) {
        item.classList.remove("active");
    });

    paineis.forEach(function (painel) {
        painel.hidden = true;
    });

    const tabCorrespondente =
        document.querySelector('.dash-tab[data-target="' + destino + '"]');

    const painelCorrespondente =
        document.getElementById(destino);

    if (tabCorrespondente) {
        tabCorrespondente.classList.add("active");
    }

    if (painelCorrespondente) {
        painelCorrespondente.hidden = false;
    }
};


// ============================================================
// FILTROS
// ============================================================

texciclo.initFiltros = function () {

    const input =
        document.querySelector("[data-filter-input]");

    const grid =
        document.querySelector("[data-filter-grid]");

    if (!input || !grid) {
        return;
    }

    const cards =
        grid.querySelectorAll(".product-card");

    const empty =
        document.querySelector("[data-filter-empty]");

    input.addEventListener("input", function () {

        const termo =
            input.value.trim().toLowerCase();

        let encontrados = 0;

        cards.forEach(function (card) {

            const texto =
                (card.dataset.search || "")
                    .toLowerCase();

            const mostrar =
                texto.includes(termo);

            card.style.display =
                mostrar ? "" : "none";

            if (mostrar) {
                encontrados++;
            }
        });

        if (empty) {
            empty.style.display =
                encontrados > 0
                    ? "none"
                    : "block";
        }
    });
};


// ============================================================
// MODAL DE COMPRA
// ============================================================

let compraAtual = null;

texciclo.abrirCompra = function (
    botao,
    lote,
    peso,
    preco,
    fornecedor
) {

    compraAtual = {
        lote: lote,
        peso: Number(peso),
        preco: Number(preco),
        fornecedor: fornecedor
    };

    const modal =
        document.getElementById("checkoutModal");

    if (!modal) {
        return;
    }

    const checkoutLote =
        document.getElementById("checkoutLote");

    const checkoutFornecedor =
        document.getElementById("checkoutFornecedor");

    const checkoutPeso =
        document.getElementById("checkoutPeso");

    const checkoutPreco =
        document.getElementById("checkoutPreco");

    const checkoutTotal =
        document.getElementById("checkoutTotal");

    if (checkoutLote) {
        checkoutLote.textContent = lote;
    }

    if (checkoutFornecedor) {
        checkoutFornecedor.textContent = fornecedor;
    }

    if (checkoutPeso) {
        checkoutPeso.textContent =
            peso + " kg";
    }

    if (checkoutPreco) {
        checkoutPreco.textContent =
            "R$ " +
            Number(preco).toFixed(2) +
            " / kg";
    }

    if (checkoutTotal) {
        checkoutTotal.textContent =
            "R$ " +
            (Number(peso) * Number(preco))
                .toFixed(2);
    }

    modal.hidden = false;
};


// ============================================================
// CONFIRMAR COMPRA
// ============================================================

texciclo.confirmarCompra = function () {

    if (!compraAtual) {
        return;
    }

    const total =
        compraAtual.peso *
        compraAtual.preco;

    alert(
        "Compra realizada com sucesso!\n\n" +
        "Lote: " +
        compraAtual.lote +
        "\n" +
        "Fornecedor: " +
        compraAtual.fornecedor +
        "\n" +
        "Quantidade: " +
        compraAtual.peso +
        " kg\n\n" +
        "Valor Total: R$ " +
        total.toFixed(2)
    );

    texciclo.closeModal("checkoutModal");

    compraAtual = null;
};


// ============================================================
// FECHAR MODAL
// ============================================================

texciclo.closeModal = function (id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.hidden = true;
};


// ============================================================
// MODAIS
// ============================================================

texciclo.initModais = function () {

    // Clique no botão X
    document
        .querySelectorAll(".modal-close")
        .forEach(function (botao) {

            botao.addEventListener(
                "click",
                function () {

                    const modal =
                        botao.closest(
                            ".modal-overlay"
                        );

                    if (modal) {
                        modal.hidden = true;
                    }
                }
            );
        });

    // Clique fora do modal
    document
        .querySelectorAll(".modal-overlay")
        .forEach(function (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (event.target === modal) {
                        modal.hidden = true;
                    }
                }
            );
        });

    // ESC
    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {
                return;
            }

            document
                .querySelectorAll(
                    ".modal-overlay"
                )
                .forEach(function (modal) {

                    modal.hidden = true;
                });
        }
    );
};


// ============================================================
// TOAST
// ============================================================

texciclo.toast = function (mensagem) {

    const toast =
        document.createElement("div");

    toast.className = "toast";
    toast.textContent = mensagem;

    document.body.appendChild(toast);

    requestAnimationFrame(function () {
        toast.classList.add("show");
    });

    setTimeout(function () {

        toast.classList.remove("show");

        setTimeout(function () {
            toast.remove();
        }, 400);

    }, 2500);
};


// ============================================================
// MENSAGEM
// ============================================================

texciclo.showMessage = function (texto) {

    texciclo.toast(texto);
};


// ============================================================
// SOLICITAR LOTE
// ============================================================

texciclo.solicitarLote = function (
    botao,
    lote
) {

    const modal =
        document.getElementById(
            "requestModal"
        );

    if (!modal) {
        return;
    }

    const titulo =
        document.getElementById(
            "requestModalTitle"
        );

    const texto =
        document.getElementById(
            "requestModalText"
        );

    if (titulo) {
        titulo.textContent =
            "Solicitação enviada";
    }

    if (texto) {

        texto.innerHTML =
            "Sua solicitação do lote <strong>" +
            lote +
            "</strong> foi enviada para a indústria." +
            "<br><br>" +
            "Você receberá uma confirmação assim que " +
            "ela aprovar a retirada.";
    }

    modal.hidden = false;

    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "Solicitado";

        botao.classList.remove(
            "btn-primary"
        );

        botao.classList.add(
            "btn-ghost"
        );
    }
};


// ============================================================
// APROVAR SOLICITAÇÃO VISUALMENTE
// ============================================================

texciclo.aprovarSolicitacao =
    function (nomeLote) {

        const cards =
            document.querySelectorAll(
                ".product-card"
            );

        cards.forEach(function (card) {

            const titulo =
                card.querySelector("h3");

            if (!titulo) {
                return;
            }

            if (
                titulo.textContent.trim()
                !==
                nomeLote.trim()
            ) {
                return;
            }

            const chip =
                card.querySelector(".chip");

            if (chip) {

                chip.textContent =
                    "Reservado";

                chip.className =
                    "chip chip--disponivel";
            }
        });
    };


// ============================================================
// RECUSAR SOLICITAÇÃO
// ============================================================

texciclo.rejeitarSolicitacao =
    function () {

        alert(
            "A indústria recusou esta solicitação."
        );
    };


// ============================================================
// NOVO LOTE
// ============================================================

texciclo.initNovoLote = function () {

    const form =
        document.getElementById(
            "novoLoteForm"
        );

    if (!form) {
        return;
    }

    const checkbox =
        document.getElementById(
            "temMarca"
        );

    const aviso =
        document.getElementById(
            "marcaNotice"
        );

    // Mostra/esconde aviso da marca
    if (checkbox && aviso) {

        checkbox.addEventListener(
            "change",
            function () {

                aviso.classList.toggle(
                    "show",
                    checkbox.checked
                );
            }
        );
    }

    // O formulário será enviado ao Spring Boot
    form.addEventListener(
        "submit",
        function () {

            texciclo.toast(
                "Salvando lote..."
            );
        }
    );
};


// ============================================================
// CADASTRO LOCAL - MANTIDO PARA COMPATIBILIDADE
// ============================================================

texciclo.salvarLoteLocal = function () {

    const tecido =
        document.getElementById(
            "tipoTecido"
        );

    const peso =
        document.getElementById(
            "pesoLote"
        );

    const tabela =
        document.getElementById(
            "lotesTableBody"
        );

    if (!tecido || !peso || !tabela) {
        return;
    }

    const finalidade =
        document.querySelector(
            'input[name="finalidade"]:checked'
        );

    const marca =
        document.getElementById(
            "temMarca"
        );

    const tr =
        document.createElement("tr");

    tr.innerHTML =
        "<td>" +
        tecido.value +
        "</td>" +

        "<td>" +
        peso.value +
        " kg</td>" +

        "<td>" +
        (
            finalidade &&
                finalidade.value === "doacao"
                ? "Doação"
                : "Venda"
        ) +
        "</td>" +

        "<td>" +
        "<span class=\"chip chip--disponivel\">" +
        "Disponível" +
        "</span>" +
        "</td>" +

        "<td>" +
        (
            marca && marca.checked
                ? "Sim"
                : "Não"
        ) +
        "</td>";

    tabela.prepend(tr);

    texciclo.mensagemCadastro(
        tecido.value,
        peso.value
    );
};


// ============================================================
// MENSAGEM DE CADASTRO
// ============================================================

texciclo.mensagemCadastro =
    function (tecido, peso) {

        const msg =
            document.getElementById(
                "loteSuccess"
            );

        if (msg) {

            msg.textContent =
                "Lote de " +
                tecido +
                " (" +
                peso +
                " kg) cadastrado com sucesso.";

            msg.classList.add("show");
        }

        texciclo.toast(
            "Novo lote cadastrado."
        );
    };


// ============================================================
// IR PARA TABELA
// ============================================================

texciclo.irParaTabela =
    function () {

        const aba =
            document.querySelector(
                ".dash-tab[data-target='painel-lotes']"
            );

        if (aba) {
            aba.click();
        }
    };


// ============================================================
// RESET FORMULÁRIO
// ============================================================

texciclo.resetFormulario =
    function () {

        const form =
            document.getElementById(
                "novoLoteForm"
            );

        if (!form) {
            return;
        }

        form.reset();

        const aviso =
            document.getElementById(
                "marcaNotice"
            );

        if (aviso) {
            aviso.classList.remove("show");
        }
    };


// ============================================================
// FINALIZAR CADASTRO
// ============================================================

texciclo.finalizarCadastro =
    function (tecido, peso) {

        texciclo.mensagemCadastro(
            tecido,
            peso
        );

        texciclo.resetFormulario();

        texciclo.irParaTabela();
    };


// ============================================================
// PREVIEW DA IMAGEM
// ============================================================

texciclo.initPreviewImagem =
    function () {

        const arquivoImagem =
            document.getElementById(
                "arquivoImagem"
            );

        const previewImagem =
            document.getElementById(
                "previewImagem"
            );

        const imagemPreview =
            document.getElementById(
                "imagemPreview"
            );

        if (!arquivoImagem) {
            return;
        }

        arquivoImagem.addEventListener(
            "change",
            function () {

                const arquivo =
                    this.files[0];

                if (!arquivo) {

                    if (previewImagem) {
                        previewImagem.hidden = true;
                    }

                    if (imagemPreview) {
                        imagemPreview.src = "";
                    }

                    return;
                }

                // Verifica se é imagem
                if (
                    !arquivo.type.startsWith(
                        "image/"
                    )
                ) {

                    this.value = "";

                    if (previewImagem) {
                        previewImagem.hidden = true;
                    }

                    if (imagemPreview) {
                        imagemPreview.src = "";
                    }

                    alert(
                        "Selecione uma imagem válida."
                    );

                    return;
                }

                const leitor =
                    new FileReader();

                leitor.onload =
                    function (evento) {

                        if (imagemPreview) {

                            imagemPreview.src =
                                evento.target.result;
                        }

                        if (previewImagem) {
                            previewImagem.hidden =
                                false;
                        }
                    };

                leitor.readAsDataURL(
                    arquivo
                );
            }
        );
    };


// ============================================================
// FINALIDADE - DOAÇÃO / VENDA
// ============================================================

texciclo.initFinalidade =
    function () {

        const radios =
            document.querySelectorAll(
                'input[name="finalidade"]'
            );

        const campoPreco =
            document.getElementById(
                "campoPreco"
            );

        const preco =
            document.getElementById(
                "preco"
            );

        if (
            !radios.length ||
            !campoPreco ||
            !preco
        ) {
            return;
        }

        function atualizarFinalidade() {

            const selecionado =
                document.querySelector(
                    'input[name="finalidade"]:checked'
                );

            const venda =
                selecionado &&
                selecionado.value === "venda";

            campoPreco.hidden =
                !venda;

            preco.required =
                venda;

            if (!venda) {
                preco.value = "";
            }
        }

        radios.forEach(function (radio) {

            radio.addEventListener(
                "change",
                atualizarFinalidade
            );
        });

        // Executa ao carregar
        atualizarFinalidade();
    };


// ============================================================
// CÁLCULO DE PREÇO
// ============================================================

texciclo.initCalculoPreco =
    function () {

        document
            .querySelectorAll(
                ".calcular-preco"
            )
            .forEach(function (formulario) {

                const pesoDisponivel =
                    parseFloat(
                        formulario.dataset.peso
                    ) || 0;

                const precoTotal =
                    parseFloat(
                        formulario.dataset.preco
                    ) || 0;

                const inputQuantidade =
                    formulario.querySelector(
                        ".input-quantidade"
                    );

                const precoSelecionado =
                    formulario.querySelector(
                        ".preco-selecionado"
                    );

                if (
                    !inputQuantidade ||
                    !precoSelecionado
                ) {
                    return;
                }

                function atualizarPreco() {

                    let quantidade =
                        parseFloat(
                            inputQuantidade.value
                        );

                    if (
                        isNaN(quantidade) ||
                        quantidade < 0
                    ) {
                        quantidade = 0;
                    }

                    if (
                        quantidade >
                        pesoDisponivel
                    ) {

                        quantidade =
                            pesoDisponivel;

                        inputQuantidade.value =
                            pesoDisponivel;
                    }

                    let valor = 0;

                    if (
                        pesoDisponivel > 0 &&
                        precoTotal > 0
                    ) {

                        valor =
                            (
                                precoTotal /
                                pesoDisponivel
                            ) *
                            quantidade;
                    }

                    precoSelecionado.textContent =
                        valor.toLocaleString(
                            "pt-BR",
                            {
                                style: "currency",
                                currency: "BRL"
                            }
                        );
                }

                inputQuantidade.addEventListener(
                    "input",
                    atualizarPreco
                );

                inputQuantidade.addEventListener(
                    "change",
                    atualizarPreco
                );

                atualizarPreco();
            });
    };


// ============================================================
// ABRIR SOLICITAÇÕES AUTOMATICAMENTE
// ============================================================

texciclo.autoAbrirMinhasSolicitacoes =
    function () {

        const params =
            new URLSearchParams(
                window.location.search
            );

        if (
            params.get("sucesso")
            !==
            "solicitacao"
        ) {
            return;
        }

        const tab =
            document.querySelector(
                ".dash-tab[data-target='painel-minhas']"
            );

        if (tab) {
            tab.click();
        }
    };


// ============================================================
// AVATAR / INICIAIS DO USUÁRIO
// ============================================================

texciclo.initAvatar =
    function () {

        const chip =
            document.getElementById(
                "userName"
            );

        const dot =
            document.getElementById(
                "userDot"
            );

        if (!chip || !dot) {
            return;
        }

        const nome =
            chip.textContent.trim();

        const iniciais =
            nome
                .split(" ")
                .filter(
                    parte =>
                        parte.length > 0
                )
                .map(
                    parte =>
                        parte[0]
                )
                .join("")
                .substring(0, 2)
                .toUpperCase();

        dot.textContent =
            iniciais;
    };


// ============================================================
// MÁSCARAS
// ============================================================

texciclo.initMascaras =
    function () {

        // ======================================================
        // CNPJ
        // ======================================================

        const cnpjInput =
            document.getElementById(
                "cnpj"
            );

        if (cnpjInput) {

            cnpjInput.addEventListener(
                "input",
                function () {

                    let v =
                        this.value
                            .replace(/\D/g, "")
                            .slice(0, 14);

                    v =
                        v.replace(
                            /^(\d{2})(\d)/,
                            "$1.$2"
                        );

                    v =
                        v.replace(
                            /^(\d{2})\.(\d{3})(\d)/,
                            "$1.$2.$3"
                        );

                    v =
                        v.replace(
                            /\.(\d{3})(\d)/,
                            ".$1/$2"
                        );

                    v =
                        v.replace(
                            /(\d{4})(\d)/,
                            "$1-$2"
                        );

                    this.value = v;
                }
            );
        }

        // ======================================================
        // TELEFONE
        // ======================================================

        const telefoneInput =
            document.getElementById(
                "telefone"
            );

        if (telefoneInput) {

            telefoneInput.addEventListener(
                "input",
                function () {

                    let v =
                        this.value
                            .replace(/\D/g, "")
                            .slice(0, 11);

                    v =
                        v.replace(
                            /^(\d{2})(\d)/,
                            "($1) $2"
                        );

                    v =
                        v.replace(
                            /(\d{5})(\d)/,
                            "$1-$2"
                        );

                    this.value = v;
                }
            );
        }
    };


// ============================================================
// CADASTRO DE USUÁRIO
// ============================================================

texciclo.initCadastro =
    function () {

        const radios =
            document.querySelectorAll(
                'input[name="tipo"]'
            );

        if (!radios.length) {
            return;
        }

        const campo =
            document.getElementById(
                "campoDescricao"
            );

        const label =
            document.getElementById(
                "labelDescricao"
            );

        const textarea =
            document.getElementById(
                "descricao"
            );

        if (
            !campo ||
            !label ||
            !textarea
        ) {
            return;
        }

        function atualizarTipo() {

            const radioSelecionado =
                document.querySelector(
                    'input[name="tipo"]:checked'
                );

            if (!radioSelecionado) {
                return;
            }

            const tipo =
                radioSelecionado.value;

            if (tipo === "INDUSTRIA") {

                campo.style.display =
                    "none";

                textarea.removeAttribute(
                    "required"
                );

            } else if (
                tipo === "ONG"
            ) {

                campo.style.display =
                    "block";

                label.textContent =
                    "Conte sobre sua organização: o que vocês fazem e a quem ajudam?";

                textarea.placeholder =
                    "Ex: oficinas de costura para mulheres em situação de vulnerabilidade, atendendo cerca de 40 famílias por mês.";

                textarea.setAttribute(
                    "required",
                    "required"
                );

            } else if (
                tipo === "MICROEMPRESA"
            ) {

                campo.style.display =
                    "block";

                label.textContent =
                    "Conte sobre sua empresa: o que vocês produzem ou revendem?";

                textarea.placeholder =
                    "Ex: confecção de roupas autorais em pequena escala, vendidas em feiras locais.";

                textarea.setAttribute(
                    "required",
                    "required"
                );
            }
        }

        radios.forEach(function (radio) {

            radio.addEventListener(
                "change",
                atualizarTipo
            );
        });

        atualizarTipo();
    };


// ============================================================
// ASSINATURA DIGITAL DA INDÚSTRIA
// ============================================================

// ============================================================
// BOTÃO DO TOPO — MOSTRAR/OCULTAR GERENCIADOR DE ASSINATURA
// ============================================================

texciclo.initAssinaturaTopo = function () {

    const botao = document.getElementById("btnTopoAssinatura");
    const painel = document.getElementById("gerenciadorAssinatura");

    if (!botao || !painel) {
        return;
    }

    botao.addEventListener("click", function () {
        const abrir = painel.hidden;
        painel.hidden = !abrir;
        botao.setAttribute("aria-expanded", String(abrir));
        botao.textContent = abrir ? "Fechar assinatura" : "Assinatura digital";

        if (abrir) {
            painel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
};


// ============================================================
// ASSINATURA DIGITAL DA INDÚSTRIA
// ============================================================

texciclo.initAssinatura = function () {

    const botao = document.getElementById("btnAssinatura");
    const modal = document.getElementById("assinaturaModal");
    const canvas = document.getElementById("assinaturaCanvas");
    const limpar = document.getElementById("limparAssinatura");
    const formulario = document.getElementById("assinaturaForm");
    const input = document.getElementById("assinaturaData");
    const salvar = document.getElementById("salvarAssinatura");
    const confirmarAlteracao = document.getElementById("confirmarAlteracao");
    const titulo = document.getElementById("assinaturaModalTitulo");

    if (!botao || !modal || !canvas || !limpar || !formulario || !input || !salvar || !confirmarAlteracao) {
        return;
    }

    const contexto = canvas.getContext("2d");
    let desenhando = false;
    let possuiTraco = false;
    let alterando = false;

    function prepararCanvas() {
        const rect = canvas.getBoundingClientRect();
        const escala = Math.max(window.devicePixelRatio || 1, 1);
        const largura = Math.max(1, Math.floor(rect.width));
        const altura = Math.max(1, Math.floor(rect.height));

        canvas.width = Math.floor(largura * escala);
        canvas.height = Math.floor(altura * escala);

        contexto.setTransform(escala, 0, 0, escala, 0, 0);
        contexto.clearRect(0, 0, largura, altura);
        contexto.lineWidth = 2.4;
        contexto.lineCap = "round";
        contexto.lineJoin = "round";
        contexto.strokeStyle = "#151d19";

        possuiTraco = false;
        input.value = "";
        salvar.disabled = true;
    }

    function posicao(evento) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evento.clientX - rect.left,
            y: evento.clientY - rect.top
        };
    }

    function iniciar(evento) {
        evento.preventDefault();
        desenhando = true;
        const pos = posicao(evento);
        contexto.beginPath();
        contexto.moveTo(pos.x, pos.y);
        if (canvas.setPointerCapture) {
            canvas.setPointerCapture(evento.pointerId);
        }
    }

    function desenhar(evento) {
        if (!desenhando) {
            return;
        }

        evento.preventDefault();
        const pos = posicao(evento);
        contexto.lineTo(pos.x, pos.y);
        contexto.stroke();

        possuiTraco = true;
        salvar.disabled = false;
    }

    function finalizar(evento) {
        if (!desenhando) {
            return;
        }

        desenhando = false;
        if (canvas.releasePointerCapture && canvas.hasPointerCapture && canvas.hasPointerCapture(evento.pointerId)) {
            canvas.releasePointerCapture(evento.pointerId);
        }
    }

    function abrirModal() {
        alterando = botao.dataset.possuiAssinatura === "true";

        if (alterando) {
            confirmarAlteracao.value = "true";

            if (titulo) {
                titulo.textContent = "Alterar assinatura digital";
            }
        } else {
            confirmarAlteracao.value = "false";
            if (titulo) {
                titulo.textContent = "Criar assinatura digital";
            }
        }

        modal.hidden = false;
        document.body.classList.add("modal-open");

        requestAnimationFrame(function () {
            prepararCanvas();
            canvas.focus();
        });
    }

    botao.addEventListener("click", abrirModal);

    canvas.addEventListener("pointerdown", iniciar);
    canvas.addEventListener("pointermove", desenhar);
    canvas.addEventListener("pointerup", finalizar);
    canvas.addEventListener("pointercancel", finalizar);
    canvas.addEventListener("pointerleave", finalizar);

    limpar.addEventListener("click", function () {
        prepararCanvas();
    });

    formulario.addEventListener("submit", function (evento) {
        if (!possuiTraco) {
            evento.preventDefault();
            window.alert("Desenhe sua assinatura antes de salvar.");
            return;
        }

        input.value = canvas.toDataURL("image/png");

        if (!input.value || !input.value.startsWith("data:image/png;base64,")) {
            evento.preventDefault();
            window.alert("Não foi possível capturar a assinatura. Desenhe novamente.");
        }
    });
};
