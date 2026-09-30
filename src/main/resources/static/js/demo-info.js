(function () {
    "use strict";

    /*
     * ============================================================
     * TEXCICLO — CAIXAS INFORMATIVAS DO MODO DE DEMONSTRAÇÃO
     * ============================================================
     *
     * Este script somente funciona quando:
     *
     * body[data-demo-mode="true"]
     *
     * Perfis:
     * - industria
     * - microempresa
     * - ong
     *
     * A caixa:
     * - não cria overlay;
     * - não bloqueia cliques;
     * - não interfere na navegação;
     * - não altera o sistema real;
     * - acompanha a aba/painel atualmente aberto.
     * ============================================================
     */


    /* ============================================================
       CONFIGURAÇÕES
       ============================================================ */

    var STORAGE_PREFIX = "texciclo_demo_info_";


    /*
     * Conteúdo apresentado em cada painel.
     */

    var CONFIG = {

        /* ========================================================
           INDÚSTRIA
           ======================================================== */

        industria: {

            "local-panel-lotes": {
                slug: "meus_lotes",

                titulo: "Meus lotes",

                texto:
                    "Aqui você acompanha os lotes de resíduos têxteis " +
                    "cadastrados pela indústria, incluindo quantidade " +
                    "disponível, finalidade, status e documentos."
            },


            "local-panel-novo": {
                slug: "novo_lote",

                titulo: "Novo lote",

                texto:
                    "Aqui você cadastra um novo lote de material têxtil " +
                    "para doação ou venda, informando tipo de tecido, " +
                    "quantidade, finalidade, presença de marca ou estampa, " +
                    "imagem e, quando for venda, o preço."
            },


            "local-panel-solicitacoes": {
                slug: "solicitacoes",

                titulo: "Solicitações",

                texto:
                    "Aqui você acompanha as solicitações feitas por " +
                    "ONGs e microempresas, podendo aceitar, recusar " +
                    "e acompanhar a retirada dos materiais."
            },


            "local-panel-sustentabilidade": {
                slug: "sustentabilidade",

                titulo: "Sustentabilidade",

                texto:
                    "Aqui você acompanha os indicadores relacionados " +
                    "ao reaproveitamento dos materiais e ao impacto " +
                    "gerado pela plataforma."
            }
        },


        /* ========================================================
           MICROEMPRESA
           ======================================================== */

        microempresa: {

            "local-panel-vitrine": {
                slug: "vitrine",

                titulo: "Vitrine",

                texto:
                    "Aqui você encontra os materiais disponíveis para " +
                    "venda e pode solicitar a quantidade desejada."
            },


            "local-panel-minhas": {
                slug: "minhas_solicitacoes",

                titulo: "Minhas solicitações",

                texto:
                    "Aqui você acompanha suas solicitações, pagamentos, " +
                    "documentos, contato com a indústria e retirada " +
                    "dos materiais."
            }
        },


        /* ========================================================
           ONG
           ======================================================== */

        ong: {

            "local-panel-vitrine": {
                slug: "vitrine",

                titulo: "Vitrine",

                texto:
                    "Aqui você encontra materiais disponibilizados " +
                    "gratuitamente pelas indústrias para doação."
            },


            "local-panel-minhas": {
                slug: "minhas_solicitacoes",

                titulo: "Minhas solicitações",

                texto:
                    "Aqui você acompanha suas solicitações de doação, " +
                    "a aprovação da indústria, o documento de compromisso, " +
                    "o PIN e a retirada do material."
            }
        }
    };


    /* ============================================================
       VARIÁVEIS DE ESTADO
       ============================================================ */

    var box = null;

    var perfil = "";

    var painelAtualId = null;

    var observer = null;


    /* ============================================================
       VERIFICA SE O MODO DEMONSTRAÇÃO ESTÁ ATIVO
       ============================================================ */

    function modoDemoAtivo() {

        return (
            document.body &&
            document.body.dataset.demoMode === "true"
        );
    }


    /* ============================================================
       DESCOBRE O PERFIL ATUAL
       ============================================================ */

    function perfilAtual() {

        if (!document.body) {
            return "";
        }

        var valor = (
            document.body.dataset.demoPerfil || ""
        ).toLowerCase().trim();

        return CONFIG[valor] ? valor : "";
    }


    /* ============================================================
       DESCOBRE O PAINEL VISÍVEL
       ============================================================ */

    function painelAtivo() {

        var paineis = document.querySelectorAll(".panel");

        for (var i = 0; i < paineis.length; i++) {

            if (!paineis[i].hidden) {
                return paineis[i].id;
            }
        }

        return null;
    }


    /* ============================================================
       DESCOBRE A CONFIGURAÇÃO DA ABA ATUAL
       ============================================================ */

    function setorAtual() {

        var painelId = painelAtivo();

        var setores = CONFIG[perfil];

        if (!painelId || !setores) {
            return null;
        }

        return setores[painelId] || null;
    }


    /* ============================================================
       CHAVE DO LOCAL STORAGE
       ============================================================ */

    function chaveStorage(setorInfo) {

        return (
            STORAGE_PREFIX +
            perfil +
            "_" +
            setorInfo.slug
        );
    }


    /* ============================================================
       VERIFICA ESTADO SALVO
       ============================================================ */

    function estaMinimizado(setorInfo) {

        try {

            return (
                localStorage.getItem(
                    chaveStorage(setorInfo)
                ) === "minimized"
            );

        } catch (erro) {

            return false;
        }
    }


    /* ============================================================
       SALVA ESTADO
       ============================================================ */

    function salvarEstado(setorInfo, minimizado) {

        try {

            localStorage.setItem(
                chaveStorage(setorInfo),
                minimizado
                    ? "minimized"
                    : "open"
            );

        } catch (erro) {

            /*
             * Caso o navegador bloqueie o localStorage,
             * a caixa continua funcionando normalmente.
             */
        }
    }


    /* ============================================================
       APLICA ESTADO DA CAIXA
       ============================================================ */

    function aplicarEstado(minimizado) {

        if (!box) {
            return;
        }

        box.classList.toggle(
            "is-minimized",
            minimizado
        );

        var botao = box.querySelector(
            ".demo-info-box__toggle"
        );

        if (!botao) {
            return;
        }

        botao.setAttribute(
            "aria-expanded",
            String(!minimizado)
        );

        botao.setAttribute(
            "aria-label",
            minimizado
                ? "Abrir explicação"
                : "Minimizar explicação"
        );

        botao.setAttribute(
            "title",
            minimizado
                ? "Abrir explicação"
                : "Minimizar explicação"
        );
    }


    /* ============================================================
       RENDERIZA A CAIXA
       ============================================================ */

    function renderizar() {

        if (!box) {
            return;
        }

        painelAtualId = painelAtivo();

        var setorInfo = setorAtual();


        /*
         * Se não houver informação para o painel,
         * esconde a caixa.
         */

        if (!setorInfo) {

            box.hidden = true;

            return;
        }


        box.hidden = false;


        /* Título */

        var titulo = box.querySelector(
            ".demo-info-box__title"
        );

        if (titulo) {
            titulo.textContent = setorInfo.titulo;
        }


        /* Texto */

        var texto = box.querySelector(
            ".demo-info-box__text"
        );

        if (texto) {
            texto.textContent = setorInfo.texto;
        }


        /*
         * Aplica o estado salvo daquele perfil + setor.
         */

        aplicarEstado(
            estaMinimizado(setorInfo)
        );
    }


    /* ============================================================
       CRIA A CAIXA
       ============================================================ */

    function criarCaixa() {

        var existente = document.getElementById(
            "demoInfoBox"
        );


        /*
         * Se já existir, reutiliza.
         */

        if (existente) {

            box = existente;

            return;
        }


        /*
         * Cria elemento principal.
         */

        box = document.createElement("aside");

        box.id = "demoInfoBox";

        box.className = "demo-info-box";

        box.setAttribute(
            "aria-live",
            "polite"
        );

        box.setAttribute(
            "aria-label",
            "Informações da demonstração"
        );


        /*
         * Estrutura HTML.
         */

        box.innerHTML =
            '<div class="demo-info-box__header">' +

                '<span class="demo-info-box__title"></span>' +

                '<button ' +
                    'type="button" ' +
                    'class="demo-info-box__toggle" ' +
                    'aria-expanded="true" ' +
                    'aria-label="Minimizar explicação" ' +
                    'title="Minimizar explicação">' +

                    '<span ' +
                        'class="demo-info-icon" ' +
                        'aria-hidden="true">' +
                        'i' +
                    '</span>' +

                '</button>' +

            '</div>' +

            '<p class="demo-info-box__text"></p>';


        /*
         * Adiciona ao body.
         */

        document.body.appendChild(box);


        /* ========================================================
           BOTÃO DE MINIMIZAR
           ======================================================== */

        var botao = box.querySelector(
            ".demo-info-box__toggle"
        );


        botao.addEventListener(
            "click",
            function () {

                var setorInfo = setorAtual();

                if (!setorInfo) {
                    return;
                }


                var novoEstadoMinimizado =
                    !box.classList.contains(
                        "is-minimized"
                    );


                aplicarEstado(
                    novoEstadoMinimizado
                );


                salvarEstado(
                    setorInfo,
                    novoEstadoMinimizado
                );
            }
        );
    }


    /* ============================================================
       OBSERVA NAVEGAÇÃO ENTRE ABAS
       ============================================================ */

    function vincularNavegacaoAtual() {

        if (observer) {
            observer.disconnect();
        }

        document
            .querySelectorAll(".dash-tab")
            .forEach(function (tab) {

                if (tab.dataset.demoInfoBound === "true") {
                    return;
                }

                tab.dataset.demoInfoBound = "true";

                tab.addEventListener(
                    "click",
                    function () {
                        requestAnimationFrame(renderizar);
                    }
                );
            });

        observer = new MutationObserver(
            function () {
                var novoPainel = painelAtivo();

                if (novoPainel !== painelAtualId) {
                    renderizar();
                }
            }
        );

        document
            .querySelectorAll(".panel")
            .forEach(function (painel) {
                observer.observe(
                    painel,
                    {
                        attributes: true,
                        attributeFilter: ["hidden"]
                    }
                );
            });

        renderizar();
    }

    function observarNavegacao() {
        vincularNavegacaoAtual();

        // O modo demonstração recria o conteúdo do .app-main com JavaScript.
        // Observamos essa troca para reconectar a caixa informativa às novas abas.
        var appMain = document.querySelector(".app-main");

        if (appMain) {
            var estruturaObserver = new MutationObserver(function () {
                requestAnimationFrame(vincularNavegacaoAtual);
            });

            estruturaObserver.observe(appMain, { childList: true });
        }
    }


    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */

    function iniciar() {

        /*
         * Nunca executa fora do modo demonstração.
         */

        if (!modoDemoAtivo()) {
            return;
        }


        /*
         * Descobre o perfil.
         */

        perfil = perfilAtual();


        if (!perfil) {
            return;
        }


        /*
         * Cria a caixa.
         */

        criarCaixa();


        /*
         * Observa navegação.
         */

        observarNavegacao();


        /*
         * Aguarda o dashboard terminar
         * de configurar o painel inicial.
         */

        requestAnimationFrame(
            function () {

                renderizar();
            }
        );
    }


    window.texcicloDemoInfoRefresh = function () {
        if (!modoDemoAtivo() || !box) {
            return;
        }
        vincularNavegacaoAtual();
    };


    /* ============================================================
       START
       ============================================================ */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    } else {

        iniciar();
    }

})();