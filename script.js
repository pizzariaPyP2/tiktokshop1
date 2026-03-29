// ======================
// CONFIG
// ======================

const FRETE_FIXO = 0.0;
const PROMO_SECONDS = 2 * 60 * 60;
let WHATSAPP_NUMERO = "5511963565553";
let pollingPagamento = null;
let pedidoAtual = null;
let whatsappEnviadoPedidoId = null;
let linkWhatsAppAprovado = "";

// Se hospedar frontend e backend juntos, funciona sozinho.
// Se hospedar frontend separado, defina antes do script:
// <script>window.API_URL = "https://seu-backend.onrender.com";</script>
const API_BASE = window.location.origin.replace(/\/$/, "");

async function lerRespostaJsonSegura(resp) {
  const contentType = resp.headers.get("content-type") || "";
  const texto = await resp.text();

  if (!contentType.includes("application/json")) {
    console.error("Resposta recebida (não JSON):", texto);
    throw new Error("O servidor retornou HTML ou texto em vez de JSON.");
  }

  try {
    return JSON.parse(texto);
  } catch (e) {
    console.error("JSON inválido recebido:", texto);
    throw new Error("A resposta do servidor não é um JSON válido.");
  }
}

async function carregarConfig() {
  try {
    const resp = await fetch(`${API_BASE}/config`);
    const data = await lerRespostaJsonSegura(resp);

    if (!resp.ok || !data.ok) {
      throw new Error(data?.error || "Erro ao carregar configuração.");
    }

    if (data.whatsapp_numero) {
      WHATSAPP_NUMERO = data.whatsapp_numero;
    }
  } catch (e) {
    console.warn("Não consegui carregar /config:", e.message);
  }
}

// ======================
// Dados dos produtos
// ======================
const produtos = [
  {
    id: 1,
    nome: "Capacete Norisk Ff345 Route Speedmax Preto Roxo",
    preco: 0.49,
    img: "https://i.im.ge/2026/01/21/Gg03Rp.fe1f35f1b3f1dca15ec1dcbbca454394.webp",
    imgs: [
      "https://i.im.ge/2026/01/21/Gg03Rp.fe1f35f1b3f1dca15ec1dcbbca454394.webp",
      "https://i.im.ge/2026/01/21/Gg0tqY.58b0c5c21633e4703ba1c8c19ea4d3f3.webp",
      "https://i.im.ge/2026/01/21/Gg0EFC.b21847936b29b9bd1e0c254f8c9daa59.webp",
      "https://i.im.ge/2026/01/21/Gg0Ak4.3f932e6be355694880b34a13d33727c8.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 2,
    nome: "Capacete Norisk Ff345 Route Speedmax Preto Roxo",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efZshF.br-11134207-820lw-mlgtv3oa1zid43.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efZshF.br-11134207-820lw-mlgtv3oa1zid43.webp",
      "https://i.im.ge/2026/03/22/efZaYK.br-11134207-820m7-mlqfm9h379qc7f.webp",
      "https://i.im.ge/2026/03/22/efZ7B9.br-11134207-820m2-mlgu7nv3bcp15e.webp",
      "https://i.im.ge/2026/03/22/efZIaX.br-11134207-820m1-mlgtv3oa3e2tb0.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 3,
    nome: "Norisk FF345 Route Monocolor Preto Fosco",
    preco: 149.9,
    videoEntrega: "/videos/videos-produto2.mp4",
    img: "https://i.im.ge/2026/03/22/efZmhC.br-11134207-820md-mlmjc6gi1i4nc0.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efZmhC.br-11134207-820md-mlmjc6gi1i4nc0.webp",
      "https://i.im.ge/2026/03/22/efZwbq.br-11134207-820lv-mlmjc6gkun0l49.webp",
      "https://i.im.ge/2026/03/22/efZPaP.br-11134207-820le-mlgtv3obm68415.webp",
      "https://i.im.ge/2026/03/22/efZC1m.br-11134207-81z1k-mhg9n4m6v40356.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 4,
    nome: "NORISK RAZOR FECHADO SPEEDMAX VERDE BRANCO ESPORTIVO ORIGINAL ",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efZYX0.br-11134207-81zuf-mkjq6nv79koyce.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efZYX0.br-11134207-81zuf-mkjq6nv79koyce.webp",
      "https://i.im.ge/2026/03/22/efZWAx.br-11134207-7r98o-mb3zwlo5pk0fd6.webp",
      "https://i.im.ge/2026/03/22/efZZpa.br-11134207-7r98o-mb3zwlo5sd5b13.webp",
      "https://i.im.ge/2026/03/22/efZV1J.br-11134207-7r98o-mb2l9aqcgs5rab.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 5,
    nome: "NORISK RAZOR SHARP PRETO/VERMELHO ORIGINAL + VISEIRA CRISTAL",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efZvcF.br-11134207-7r98o-malmafju3kl51e.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efZvcF.br-11134207-7r98o-malmafju3kl51e.webp",
      "https://i.im.ge/2026/03/22/efZJGK.br-11134207-7r98o-matv9iwnoubz2f.webp",
      "https://i.im.ge/2026/03/22/efZ479.br-11134207-7r98o-malmafju4z5l36.webp",
      "https://i.im.ge/2026/03/22/efZBCX.br-11134207-7r98o-malocp6vju6n54.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  }
];

const maisVendidos = [
  {
    id: 1,
    nome: "NORISK FORCE II GRAND PRIX GERMANY ALEMANHA ARTICULADO ESCAMOTEAVEL",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efKli4.br-11134207-820m1-mm3a1jhbhxq89c.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efKli4.br-11134207-820m1-mm3a1jhbhxq89c.webp",
      "https://i.im.ge/2026/03/22/efKueq.br-11134207-820li-mm3a1jhbjcaoa7.webp",
      "https://i.im.ge/2026/03/22/efK2v1.br-11134207-820md-mm3a1jhbkqv4d2.webp",
      "https://i.im.ge/2026/03/22/efKsVr.sg-11134201-7rdwk-mbzozmath77n0e.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 2,
    nome: "NORISK ESPORTIVO BARATO RAZOR SPEEDMAX CINZA LARANJA NOVO PROMOÇÃO + BRINDE UNISSEX",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efKLec.br-11134207-7r98o-maygkzv8b5kp06.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efKLec.br-11134207-7r98o-maygkzv8b5kp06.webp",
      "https://i.im.ge/2026/03/22/efKiCG.br-11134207-7r98o-maygkzv8dyplec.webp",
      "https://i.im.ge/2026/03/22/efK0vx.br-11134207-7r98o-maygkzv88cfte0.webp",
      "https://i.im.ge/2026/03/22/efKj6J.br-11134207-7r98o-maygkzv8fda12b.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 3,
    nome: "Norisk FF345 Route Monocolor Preto Fosco",
    preco: 149.9,
    videoEntrega: "/videos/videos-produto2.mp4",
    img: "https://i.im.ge/2026/03/22/efZmhC.br-11134207-820md-mlmjc6gi1i4nc0.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efZmhC.br-11134207-820md-mlmjc6gi1i4nc0.webp",
      "https://i.im.ge/2026/03/22/efZwbq.br-11134207-820lv-mlmjc6gkun0l49.webp",
      "https://i.im.ge/2026/03/22/efZPaP.br-11134207-820le-mlgtv3obm68415.webp",
      "https://i.im.ge/2026/03/22/efZC1m.br-11134207-81z1k-mhg9n4m6v40356.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 4,
    nome: "NORISK RAZOR FECHADO SPEEDMAX VERDE BRANCO ESPORTIVO ORIGINAL",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efZYX0.br-11134207-81zuf-mkjq6nv79koyce.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efZYX0.br-11134207-81zuf-mkjq6nv79koyce.webp",
      "https://i.im.ge/2026/03/22/efZWAx.br-11134207-7r98o-mb3zwlo5pk0fd6.webp",
      "https://i.im.ge/2026/03/22/efZZpa.br-11134207-7r98o-mb3zwlo5sd5b13.webp",
      "https://i.im.ge/2026/03/22/efZV1J.br-11134207-7r98o-mb2l9aqcgs5rab.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 5,
    nome: "NORISK RAZOR SHARP PRETO/VERMELHO ORIGINAL + VISEIRA CRISTAL",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efZvcF.br-11134207-7r98o-malmafju3kl51e.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efZvcF.br-11134207-7r98o-malmafju3kl51e.webp",
      "https://i.im.ge/2026/03/22/efZJGK.br-11134207-7r98o-matv9iwnoubz2f.webp",
      "https://i.im.ge/2026/03/22/efZ479.br-11134207-7r98o-malmafju4z5l36.webp",
      "https://i.im.ge/2026/03/22/efZBCX.br-11134207-7r98o-malocp6vju6n54.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 6,
    nome: "FW3 GTX Fox Grafite com Viseira Solar",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efK6rS.br-11134207-81z1k-mfcr7rh9fhmv6f.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efK6rS.br-11134207-81z1k-mfcr7rh9fhmv6f.webp",
      "https://i.im.ge/2026/03/22/efKPg6.br-11134207-81z1k-mfcr7rh98gsn3e.webp",
      "https://i.im.ge/2026/03/22/efKyMF.br-11134207-81z1k-mfcr7rh9cohzef.webp",
      "https://i.im.ge/2026/03/22/efKADK.br-11134207-81z1k-mfcr7rh99vd388.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  },
  {
    id: 7,
    nome: "Fw3 gtx star/fox com viseira solar",
    preco: 149.9,
    img: "https://i.im.ge/2026/03/22/efKgrY.sg-11134201-822wg-mi0jsu7hp98ib8.webp",
    imgs: [
      "https://i.im.ge/2026/03/22/efKgrY.sg-11134201-822wg-mi0jsu7hp98ib8.webp",
      "https://i.im.ge/2026/03/22/efK85D.sg-11134201-822xz-mi0jswwdmxhc81.webp",
      "https://i.im.ge/2026/03/22/efKZMC.sg-11134201-822yn-mi0jsvkzy39icf.webp",
      "https://i.im.ge/2026/03/22/efKKIq.sg-11134201-822xz-mi0jst09n7rc68.webp"
    ],
    rating: 4.5,
    reviews: 12,
    descricao: "Capacete esportivo resistente.",
    caracteristicas: "Material ABS, ventilação frontal.",
    tamanho: true
  }
];

// ======================
// ALERTA FAKE DE COMPRAS
// ======================
const nomesComprasFake = [
  "Carlos Almeida",
  "João Pedro",
  "Maria Souza",
  "Ana Clara",
  "Pedro Henrique",
  "Lucas Martins",
  "Juliana Alves",
  "Fernanda Costa",
  "Rafael Gomes",
  "Beatriz Lima",
  "Camila Rocha",
  "Diego Ferreira"
];

const temposComprasFake = [
  "fez uma compra há 10 seg",
  "fez uma compra há 20 seg",
  "fez uma compra há 35 seg",
  "fez uma compra há 1 min",
  "fez uma compra há 2 min"
];

let ultimoNomeCompraFake = "";

function pegarNomeCompraFake() {
  let nome = "";
  do {
    nome = nomesComprasFake[Math.floor(Math.random() * nomesComprasFake.length)];
  } while (nomesComprasFake.length > 1 && nome === ultimoNomeCompraFake);

  ultimoNomeCompraFake = nome;
  return nome;
}

function iniciarAlertaComprasFake() {
  const alertBox = document.getElementById("purchase-alert");
  const alertName = document.getElementById("purchase-name");
  const alertTime = document.getElementById("purchase-time");

  if (!alertBox || !alertName || !alertTime) return;

  function mostrarAlerta() {
    const nome = pegarNomeCompraFake();
    const tempoTxt = temposComprasFake[Math.floor(Math.random() * temposComprasFake.length)];

    alertName.textContent = nome;
    alertTime.textContent = tempoTxt;
    alertBox.classList.add("show");

    setTimeout(() => {
      alertBox.classList.remove("show");
    }, 4000);
  }

  setTimeout(() => {
    mostrarAlerta();
    setInterval(mostrarAlerta, 7000);
  }, 2500);
}

// ======================
// Scroll lock
// ======================
function lockScroll(lock) {
  if (lock) {
    document.body.dataset.scrollY = String(window.scrollY);
    document.body.style.position = "fixed";
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  } else {
    const y = Number(document.body.dataset.scrollY || "0");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    delete document.body.dataset.scrollY;
    window.scrollTo(0, y);
  }
}

// ======================
// Estoque
// ======================
[...produtos, ...maisVendidos].forEach((p) => {
  const stock = sessionStorage.getItem(`estoque_${p.id}`);
  p.estoque = stock ? Number(stock) : Math.floor(Math.random() * 6) + 2;
  sessionStorage.setItem(`estoque_${p.id}`, p.estoque);
});

// ======================
// Tempo Promo
// ======================
let tempo = sessionStorage.getItem("tempo_oferta")
  ? Number(sessionStorage.getItem("tempo_oferta"))
  : PROMO_SECONDS;

if (!tempo || tempo <= 0) tempo = PROMO_SECONDS;
sessionStorage.setItem("tempo_oferta", tempo);

// ======================
// Seletores
// ======================
const listaProdutos = document.getElementById("lista-produtos");
const listaMaisVendidos = document.getElementById("lista-mais-vendidos");

const cartFlutuante = document.getElementById("cart-flutuante");
const cartModal = document.getElementById("cart-modal");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");

const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartFreteEl = document.getElementById("cart-frete");
const cartTotalEl = document.getElementById("cart-total");

const checkoutForm = document.getElementById("checkout-form");
const closeCart = document.getElementById("close-cart");
const closeCartFallback = document.getElementById("close-cart-fallback");

const stepEntrega = document.getElementById("step-entrega");
const stepPix = document.getElementById("step-pix");

const pixTimerEl = document.getElementById("pix-timer");
const pixCopiaColaEl = document.getElementById("pix-copia-cola");
const pixCanvas = document.getElementById("pix-qrcode");
const pixQrImg = document.getElementById("pix-qrcode-img");
const btnCopiarPix = document.getElementById("btn-copiar-pix");
const btnJaPaguei = document.getElementById("btn-ja-paguei");
const pixWarn = document.getElementById("pix-warn");

const productModal = document.getElementById("product-modal");
const productContent = document.getElementById("product-content");

const modalTitle = document.getElementById("modal-title");
const modalImg = document.getElementById("modal-img");
const modalPrice = document.getElementById("modal-price");
const modalDescription = document.getElementById("modal-description");
const modalCharacteristics = document.getElementById("modal-characteristics");

const modalSizeContainer = document.getElementById("modal-size-container");
const modalSize = document.getElementById("modal-size");

const addToCartModal = document.getElementById("add-to-cart-modal");
const closeProduct = document.getElementById("close-product");

const prevImgBtn = document.getElementById("prev-img");
const nextImgBtn = document.getElementById("next-img");
const modalImageWrapper = document.querySelector(".modal-image-wrapper");

let modalVideo = document.getElementById("modal-video");
let modalVideoSource = document.getElementById("modal-video-source");

if (!modalVideo && modalImageWrapper) {
  modalVideo = document.createElement("video");
  modalVideo.id = "modal-video";
  modalVideo.style.display = "none";
  modalVideo.controls = true;
  modalVideo.autoplay = true;
  modalVideo.muted = true;
  modalVideo.loop = true;
  modalVideo.playsInline = true;

  modalVideoSource = document.createElement("source");
  modalVideoSource.id = "modal-video-source";
  modalVideoSource.type = "video/mp4";

  modalVideo.appendChild(modalVideoSource);
  modalImageWrapper.appendChild(modalVideo);
}

// ======================
// Estado
// ======================
let carrinho = [];
let produtoSelecionado = null;
let modalImgs = [];
let modalIndex = 0;
let dotsEl = null;
let countEl = null;

// ======================
// Helpers
// ======================
function formatTempo(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function aplicarTextoContador() {
  if (tempo <= 0) {
    tempo = PROMO_SECONDS;
    sessionStorage.setItem("tempo_oferta", tempo);
  }

  const txt = `⏰ Oferta expira em ${formatTempo(tempo)}`;

  document.querySelectorAll(".contador").forEach((el) => {
    el.textContent = txt;
  });

  if (pixTimerEl) {
    pixTimerEl.textContent = `⏳ Promoção termina em ${formatTempo(tempo)}`;
  }
}

function getImages(prod) {
  return Array.isArray(prod.imgs) && prod.imgs.length ? prod.imgs : [prod.img];
}

function montarMensagemWhatsApp(pedido) {
  if (!pedido) return "";

  const itensTxt = pedido.itens
    .map((p) => {
      const t = p.tamanhoEscolhido ? ` (Tam: ${p.tamanhoEscolhido})` : "";
      return `- ${p.nome}${t} | R$ ${Number(p.preco).toFixed(2)}`;
    })
    .join("\n");

  return (
    `*PEDIDO APROVADO - TikTok Shop*\n\n` +
    `*Pedido:* ${pedido.pedidoId}\n` +
    `*Pagamento ID:* ${pedido.pagamentoId}\n` +
    `*Status:* APROVADO ✅\n\n` +
    `*Nome:* ${pedido.dadosEntrega.nome}\n` +
    `*E-mail:* ${pedido.dadosEntrega.email}\n` +
    `*WhatsApp:* ${pedido.dadosEntrega.telefone}\n\n` +
    `*Endereço:* ${pedido.dadosEntrega.endereco}\n` +
    `*Cidade:* ${pedido.dadosEntrega.cidade}\n` +
    `*CEP:* ${pedido.dadosEntrega.cep}\n\n` +
    `*Itens:*\n${itensTxt}\n\n` +
    `*Subtotal:* R$ ${pedido.subtotal.toFixed(2)}\n` +
    `*Frete:* R$ ${FRETE_FIXO.toFixed(2)}\n` +
    `*Total:* R$ ${pedido.total.toFixed(2)}\n`
  );
}

function prepararLinkWhatsAppAprovado(pedido) {
  if (!pedido || !pedido.pedidoId) return "";

  const msg = montarMensagemWhatsApp(pedido);
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`;
  linkWhatsAppAprovado = url;
  return url;
}

function configurarBotaoJaPaguei(pedido) {
  if (!btnJaPaguei) return;

  btnJaPaguei.onclick = () => {
    const url = prepararLinkWhatsAppAprovado(pedido);
    if (url) {
      whatsappEnviadoPedidoId = pedido.pedidoId;
      window.open(url, "_blank");
    }
  };
}

// ======================
// Status do pagamento
// ======================
async function consultarStatusPagamento(pagamentoId) {
  const resp = await fetch(`${API_BASE}/status-pagamento/${pagamentoId}`);
  const data = await lerRespostaJsonSegura(resp);

  if (!resp.ok || !data.ok) {
    throw new Error(data?.detalhe || data?.error || "Erro ao consultar status do pagamento.");
  }

  return data;
}

function atualizarTextoStatusPagamento(status, statusDetail) {
  const el = document.getElementById("pix-status");
  if (!el) return;

  if (status === "approved") {
    el.textContent = "✅ Pagamento aprovado!";
    el.style.color = "green";
    return;
  }

  if (status === "pending") {
    el.textContent = "⏳ Aguardando pagamento...";
    el.style.color = "#b26b00";
    return;
  }

  if (status === "in_process") {
    el.textContent = "🔄 Pagamento em processamento...";
    el.style.color = "#0057b8";
    return;
  }

  if (status === "rejected") {
    el.textContent = `❌ Pagamento rejeitado${statusDetail ? " - " + statusDetail : ""}`;
    el.style.color = "red";
    return;
  }

  if (status === "cancelled") {
    el.textContent = "❌ Pagamento cancelado.";
    el.style.color = "red";
    return;
  }

  el.textContent = `ℹ️ Status: ${status || "desconhecido"}${statusDetail ? " - " + statusDetail : ""}`;
  el.style.color = "#333";
}

function iniciarPollingPagamento(pagamentoId) {
  if (!pagamentoId) return;

  if (pollingPagamento) {
    clearInterval(pollingPagamento);
    pollingPagamento = null;
  }

  atualizarTextoStatusPagamento("pending", "");

  pollingPagamento = setInterval(async () => {
    try {
      const statusData = await consultarStatusPagamento(pagamentoId);
      atualizarTextoStatusPagamento(statusData.status, statusData.status_detail);

      if (statusData.status === "approved") {
        if (pedidoAtual) {
          prepararLinkWhatsAppAprovado(pedidoAtual);
          configurarBotaoJaPaguei(pedidoAtual);
        }

        if (btnJaPaguei) {
          btnJaPaguei.style.display = "block";
          btnJaPaguei.textContent = "✅ ENVIAR PEDIDO NO WHATSAPP";
          btnJaPaguei.style.width = "100%";
          btnJaPaguei.style.padding = "16px";
          btnJaPaguei.style.fontSize = "18px";
          btnJaPaguei.style.fontWeight = "900";
          btnJaPaguei.style.borderRadius = "14px";
          btnJaPaguei.style.marginTop = "14px";
          btnJaPaguei.style.background = "#25D366";
          btnJaPaguei.style.color = "#fff";
          btnJaPaguei.style.border = "none";
          btnJaPaguei.style.cursor = "pointer";
          btnJaPaguei.style.boxShadow = "0 8px 24px rgba(37, 211, 102, 0.35)";
        }

        const statusEl = document.getElementById("pix-status");
        if (statusEl) {
          statusEl.textContent =
            "✅ PAGAMENTO APROVADO! Agora clique no botão abaixo para enviar seu pedido no WhatsApp.";
          statusEl.style.color = "green";
          statusEl.style.fontWeight = "900";
          statusEl.style.fontSize = "18px";
          statusEl.style.textAlign = "center";
          statusEl.style.marginTop = "12px";
        }

        clearInterval(pollingPagamento);
        pollingPagamento = null;
        return;
      }

      if (statusData.status === "rejected" || statusData.status === "cancelled") {
        clearInterval(pollingPagamento);
        pollingPagamento = null;
      }
    } catch (error) {
      console.error("Erro no polling do pagamento:", error);
    }
  }, 5000);
}

// ======================
// Galeria do modal
// ======================
function ensureGalleryUI() {
  if (!modalImageWrapper) return;

  if (!countEl) {
    countEl = document.createElement("div");
    countEl.className = "modal-count";
    modalImageWrapper.appendChild(countEl);
  }

  if (!dotsEl) {
    dotsEl = document.createElement("div");
    dotsEl.className = "modal-dots";
    modalImageWrapper.insertAdjacentElement("afterend", dotsEl);
  }
}

function renderDots() {
  ensureGalleryUI();
  if (!dotsEl) return;

  dotsEl.innerHTML = "";

  if (modalImgs.length <= 1) {
    dotsEl.style.display = "none";
    if (countEl) countEl.style.display = "none";
    return;
  }

  dotsEl.style.display = "flex";
  if (countEl) countEl.style.display = "inline-flex";

  modalImgs.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "modal-dot" + (i === modalIndex ? " active" : "");
    d.addEventListener("click", () => {
      modalIndex = i;
      updateModalImage();
    });
    dotsEl.appendChild(d);
  });

  if (countEl) countEl.textContent = `${modalIndex + 1}/${modalImgs.length}`;
}

function updateModalImage() {
  if (!modalImgs.length || !modalImg) return;
  modalImg.src = modalImgs[modalIndex];
  renderDots();
}

// ======================
// Card padrão
// ======================
function criarCard(prod) {
  const div = document.createElement("div");
  div.className = "produto";

  const midia = prod.videoEntrega
    ? `
      <video class="midia-produto" autoplay muted loop playsinline preload="metadata">
        <source src="${prod.videoEntrega}" type="video/mp4">
        Seu navegador não suporta vídeo.
      </video>
    `
    : `<img src="${prod.img}" alt="${prod.nome}">`;

  div.innerHTML = `
    ${midia}
    <h3 class="titulo-produto">${prod.nome}</h3>
    <p class="preco">R$ ${prod.preco.toFixed(2)}</p>
    <p class="rating">⭐ ${prod.rating} (${prod.reviews})</p>
    <div class="urgencia">⚠️ Restam ${prod.estoque} unidades</div>
    <div class="contador"></div>
  `;

  div.onclick = () => abrirModal(prod);
  return div;
}

// ======================
// Render produtos
// ======================
function renderProdutos() {
  if (!listaProdutos) return;
  listaProdutos.innerHTML = "";
  produtos.forEach((p) => listaProdutos.appendChild(criarCard(p)));
}

function renderMaisVendidos() {
  if (!listaMaisVendidos) return;
  listaMaisVendidos.innerHTML = "";
  maisVendidos.forEach((p) => listaMaisVendidos.appendChild(criarCard(p)));
}

// ======================
// Modal produto
// ======================
function abrirModal(prod) {
  produtoSelecionado = prod;
  modalImgs = getImages(prod);
  modalIndex = 0;

  if (modalTitle) modalTitle.textContent = prod.nome;
  if (modalPrice) modalPrice.textContent = `R$ ${prod.preco.toFixed(2)}`;
  if (modalDescription) modalDescription.textContent = prod.descricao || "";
  if (modalCharacteristics) modalCharacteristics.textContent = prod.caracteristicas || "";

  if (prod.videoEntrega && modalVideo && modalVideoSource && modalImg) {
    modalImg.style.display = "none";
    modalVideo.style.display = "block";
    modalVideoSource.src = prod.videoEntrega;
    modalVideo.load();
  } else {
    if (modalVideo && modalVideoSource) {
      modalVideo.pause();
      modalVideo.style.display = "none";
      modalVideoSource.src = "";
      modalVideo.load();
    }

    if (modalImg) {
      modalImg.style.display = "block";
    }
  }

  let urg = document.getElementById("modal-urgencia");
  if (!urg) {
    urg = document.createElement("div");
    urg.id = "modal-urgencia";
    urg.className = "urgencia";
    modalPrice.after(urg);
  }
  urg.textContent = `⚠️ Restam ${prod.estoque} unidades`;

  let cont = document.getElementById("modal-contador");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "modal-contador";
    cont.className = "contador";
    urg.after(cont);
  }

  if (prod.tamanho) {
    modalSizeContainer.style.display = "block";
    modalSize.innerHTML = "";
    for (let i = 56; i <= 62; i++) {
      modalSize.innerHTML += `<option>${i}</option>`;
    }
  } else {
    modalSizeContainer.style.display = "none";
  }

  const showArrows = !prod.videoEntrega && modalImgs.length > 1;
  if (prevImgBtn) prevImgBtn.style.display = showArrows ? "flex" : "none";
  if (nextImgBtn) nextImgBtn.style.display = showArrows ? "flex" : "none";

  if (!prod.videoEntrega) {
    updateModalImage();
  } else {
    renderDots();
    if (dotsEl) dotsEl.style.display = "none";
    if (countEl) countEl.style.display = "none";
  }

  aplicarTextoContador();
  productModal.classList.add("active");
  lockScroll(true);
}

function fecharModalProduto() {
  if (modalVideo) {
    modalVideo.pause();
  }

  productModal.classList.remove("active");
  lockScroll(false);
}

function prevImg() {
  if (modalImgs.length <= 1) return;
  modalIndex = (modalIndex - 1 + modalImgs.length) % modalImgs.length;
  updateModalImage();
}

function nextImg() {
  if (modalImgs.length <= 1) return;
  modalIndex = (modalIndex + 1) % modalImgs.length;
  updateModalImage();
}

if (prevImgBtn) prevImgBtn.onclick = prevImg;
if (nextImgBtn) nextImgBtn.onclick = nextImg;
if (closeProduct) closeProduct.onclick = fecharModalProduto;

if (productModal) {
  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) fecharModalProduto();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (productModal && productModal.classList.contains("active")) fecharModalProduto();
    if (cartModal && cartModal.classList.contains("active")) fecharCarrinho();
  }
});

// ======================
// Swipe
// ======================
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

function handleSwipe() {
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dy) > Math.abs(dx)) return;
  if (Math.abs(dx) < 40) return;
  if (dx > 0) prevImg();
  else nextImg();
}

if (productContent) {
  productContent.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      startX = t.screenX;
      startY = t.screenY;
    },
    { passive: true }
  );

  productContent.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches[0];
      endX = t.screenX;
      endY = t.screenY;
      handleSwipe();
    },
    { passive: true }
  );
}

// ======================
// Contador global
// ======================
function iniciarContador() {
  aplicarTextoContador();
  setInterval(() => {
    tempo--;
    if (tempo <= 0) tempo = PROMO_SECONDS;
    sessionStorage.setItem("tempo_oferta", tempo);
    aplicarTextoContador();
  }, 1000);
}

// ======================
// Carrinho
// ======================
function subtotalCarrinho() {
  return carrinho.reduce((acc, p) => acc + Number(p.preco || 0), 0);
}

function totalCarrinho() {
  return subtotalCarrinho() + FRETE_FIXO;
}

function updateCart() {
  if (!cartItems) return;

  cartItems.innerHTML = "";
  const subtotal = subtotalCarrinho();
  const total = totalCarrinho();

  carrinho.forEach((p, idx) => {
    const tamanhoTxt = p.tamanhoEscolhido ? ` (Tam: ${p.tamanhoEscolhido})` : "";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "10px 0";
    row.style.borderBottom = "1px solid #eee";

    row.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:900">${p.nome}${tamanhoTxt}</div>
        <div style="font-size:12px;opacity:.8">R$ ${p.preco.toFixed(2)}</div>
      </div>
      <button data-remove="${idx}" style="background:#111;color:#fff;border:none;border-radius:10px;padding:8px 10px;cursor:pointer">
        Remover
      </button>
    `;

    cartItems.appendChild(row);
  });

  cartItems.querySelectorAll("button[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-remove"));
      carrinho.splice(i, 1);
      updateCart();
    });
  });

  if (cartCount) cartCount.textContent = String(carrinho.length);
  if (cartSubtotalEl) cartSubtotalEl.textContent = subtotal.toFixed(2);
  if (cartFreteEl) cartFreteEl.textContent = FRETE_FIXO.toFixed(2);
  if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);

  aplicarTextoContador();
}

if (addToCartModal) {
  addToCartModal.onclick = () => {
    if (!produtoSelecionado || produtoSelecionado.estoque <= 0) return;

    produtoSelecionado.estoque--;
    sessionStorage.setItem(`estoque_${produtoSelecionado.id}`, produtoSelecionado.estoque);

    const item = { ...produtoSelecionado };
    if (produtoSelecionado.tamanho && modalSizeContainer && modalSizeContainer.style.display !== "none") {
      item.tamanhoEscolhido = modalSize.value;
    }

    carrinho.push(item);
    updateCart();
    renderProdutos();
    renderMaisVendidos();
    fecharModalProduto();
  };
}

// ======================
// Carrinho modal
// ======================
function resetarStepsCarrinho() {
  if (stepEntrega) stepEntrega.classList.remove("hidden");
  if (stepPix) stepPix.classList.add("hidden");

  if (closeCart) closeCart.classList.add("hidden");
  if (closeCartFallback) closeCartFallback.classList.remove("hidden");

  const statusEl = document.getElementById("pix-status");
  if (statusEl) {
    statusEl.textContent = "⏳ Aguardando pagamento...";
    statusEl.style.color = "#b26b00";
    statusEl.style.fontWeight = "700";
  }

  if (btnJaPaguei) {
    btnJaPaguei.style.display = "none";
    btnJaPaguei.textContent = "ENVIAR PEDIDO NO WHATSAPP";
  }
}

function mostrarPix() {
  if (stepEntrega) stepEntrega.classList.add("hidden");
  if (stepPix) stepPix.classList.remove("hidden");

  if (closeCart) closeCart.classList.remove("hidden");
  if (closeCartFallback) closeCartFallback.classList.add("hidden");

  if (btnJaPaguei) {
    btnJaPaguei.style.display = "none";
    btnJaPaguei.textContent = "ENVIAR PEDIDO NO WHATSAPP";
  }

  aplicarTextoContador();
}

function abrirCarrinho() {
  cartModal.classList.add("active");
  lockScroll(true);
  resetarStepsCarrinho();
  updateCart();
}

function fecharCarrinho() {
  cartModal.classList.remove("active");
  lockScroll(false);
  resetarStepsCarrinho();

  if (pollingPagamento) {
    clearInterval(pollingPagamento);
    pollingPagamento = null;
  }
}

if (cartFlutuante) cartFlutuante.onclick = abrirCarrinho;
if (closeCart) closeCart.onclick = fecharCarrinho;
if (closeCartFallback) closeCartFallback.onclick = fecharCarrinho;

document.addEventListener("click", (e) => {
  if (!cartModal || !cartModal.classList.contains("active")) return;
  const clicouNoCarrinho = cartModal.contains(e.target);
  const clicouNoBotao = cartFlutuante && cartFlutuante.contains(e.target);
  if (!clicouNoCarrinho && !clicouNoBotao) fecharCarrinho();
});

// ======================
// PIX
// ======================
async function desenharQRCodeSeguro(textoPix) {
  if (!pixCanvas) return;

  pixCanvas.style.display = "block";
  if (pixQrImg) pixQrImg.style.display = "none";

  const ctx = pixCanvas.getContext("2d");
  ctx.clearRect(0, 0, pixCanvas.width, pixCanvas.height);

  if (pixWarn) pixWarn.style.display = "none";

  const QR = window.QRCode || (typeof QRCode !== "undefined" ? QRCode : null);

  try {
    if (QR && typeof QR.toCanvas === "function") {
      await new Promise((resolve, reject) => {
        QR.toCanvas(pixCanvas, textoPix, { width: 220 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      return;
    }
  } catch (_) {}

  try {
    if (QR && typeof QR.toDataURL === "function") {
      const url = await QR.toDataURL(textoPix, { width: 220, margin: 1 });
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, pixCanvas.width, pixCanvas.height);
        ctx.drawImage(img, 0, 0, pixCanvas.width, pixCanvas.height);
      };
      img.src = url;
      return;
    }
  } catch (_) {}

  if (pixWarn) {
    pixWarn.style.display = "block";
    pixWarn.textContent = "⚠️ Não consegui gerar o QRCode. Use o PIX Copia e Cola abaixo.";
  }
}

async function gerarEExibirPix(dadosEntrega) {
  const subtotal = subtotalCarrinho();
  const total = totalCarrinho();
  const pedidoId = `${Date.now()}`;
  const itensPedido = carrinho.map((p) => ({
    id: p.id,
    nome: p.nome,
    preco: Number(p.preco),
    quantidade: Number(p.quantidade || 1),
    tamanhoEscolhido: p.tamanhoEscolhido || ""
  }));

  try {
    if (pixWarn) {
      pixWarn.style.display = "none";
      pixWarn.textContent = "";
    }

    if (pixCopiaColaEl) {
      pixCopiaColaEl.value = "Gerando PIX...";
    }

    if (pixQrImg) {
      pixQrImg.style.display = "none";
      pixQrImg.removeAttribute("src");
    }

    if (pixCanvas) {
      pixCanvas.style.display = "none";
      const ctx = pixCanvas.getContext("2d");
      ctx.clearRect(0, 0, pixCanvas.width, pixCanvas.height);
    }

    if (btnJaPaguei) {
      btnJaPaguei.style.display = "none";
      btnJaPaguei.textContent = "Já paguei";
    }

    const resp = await fetch(`${API_BASE}/criar-pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        total,
        pedidoId,
        dadosEntrega,
        itens: itensPedido
      })
    });

    const data = await lerRespostaJsonSegura(resp);

    if (!resp.ok || !data.ok) {
      throw new Error(data?.detalhe || data?.error || "Erro ao gerar PIX.");
    }

    const pixText = data.pixCopiaECola || "";
    const qrBase64 = data.qrCodeBase64 || "";
    const pagamentoId = data.pagamentoId || null;

    if (!pixText && !qrBase64) {
      throw new Error("O Mercado Pago não retornou o código PIX.");
    }

    pedidoAtual = {
      pedidoId,
      pagamentoId,
      dadosEntrega,
      itens: itensPedido,
      subtotal,
      total
    };

    whatsappEnviadoPedidoId = null;
    linkWhatsAppAprovado = "";

    if (pixCopiaColaEl) pixCopiaColaEl.value = pixText;

    if (qrBase64 && pixQrImg) {
      pixQrImg.src = `data:image/png;base64,${qrBase64}`;
      pixQrImg.style.display = "block";
      if (pixCanvas) pixCanvas.style.display = "none";
    } else if (pixText) {
      await desenharQRCodeSeguro(pixText);
    }

    if (pagamentoId) {
      iniciarPollingPagamento(pagamentoId);
    }

    if (btnCopiarPix) {
      btnCopiarPix.onclick = async () => {
        try {
          await navigator.clipboard.writeText(pixText);
          btnCopiarPix.textContent = "✅ Copiado!";
          setTimeout(() => {
            btnCopiarPix.textContent = "Copiar código PIX";
          }, 1500);
        } catch (e) {
          alert("Não consegui copiar automaticamente. Selecione e copie manualmente.");
        }
      };
    }

    configurarBotaoJaPaguei(pedidoAtual);
  } catch (error) {
    console.error(error);

    if (pixCopiaColaEl) pixCopiaColaEl.value = "";

    if (pixWarn) {
      pixWarn.style.display = "block";
      pixWarn.textContent = `⚠️ ${error.message}`;
    }

    alert(error.message || "Não foi possível gerar o PIX.");
  }
}

if (checkoutForm) {
  checkoutForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!carrinho.length) return alert("Carrinho vazio!");

    const nome = checkoutForm.nome.value.trim();
    const email = checkoutForm.email.value.trim();
    const telefone = checkoutForm.telefone.value.trim();
    const endereco = checkoutForm.endereco.value.trim();
    const cidade = checkoutForm.cidade.value.trim();
    const cep = checkoutForm.cep.value.trim();

    if (!nome || !email || !telefone || !endereco || !cidade || !cep) {
      alert("Preencha todos os dados de entrega.");
      return;
    }

    const dadosEntrega = { nome, email, telefone, endereco, cidade, cep };

    mostrarPix();
    await gerarEExibirPix(dadosEntrega);
  };
}

// ======================
// Avaliações reais
// ======================
const comentariosClientes = [
  {
    nome: "Camila R.",
    foto: "https://i.im.ge/2026/03/29/eHsNxM.b4fdb4c69d66575cdef596557d4e62d7.jpeg",
    estrelas: 5,
    data: "há 2 dias",
    texto: "juro que pensei que não ia chegar",
    videoEntrega: "/videos/entrega-bruna.mp4"
  },
  {
    nome: "João Pedro",
    foto: "https://randomuser.me/api/portraits/men/32.jpg",
    estrelas: 5,
    data: "ontem",
    texto: "promoçaõ funciona rapaziada marchaaaaa",
    fotoEntrega: "https://i.postimg.cc/zGBW79Fx/br-11134103-820mh-ml6omd221mvbe9.jpg"
  },
  {
    nome: "Larissa Menezes",
    foto: "https://randomuser.me/api/portraits/women/22.jpg",
    estrelas: 5,
    data: "há 4 dias",
    texto: "top de linha gostei muito <3 ",
    videoEntrega: "/videos/entrega-ana.mp4"
  },
  {
    nome: "Bruno Santos",
    foto: "https://i.postimg.cc/50rJLQpx/br-11134233-7r98o-lygu8369hbx12e.jpg",
    estrelas: 5,
    data: "há 1 semana",
    texto: "estoureiiii.",
    fotoEntrega: ""
  },
  {
    nome: "Renata Gomes",
    foto: "",
    estrelas: 5,
    data: "há 3 dias",
    texto: "gente so da pra compra uma vez ou ate o estoque acabar ?",
    fotoEntrega: ""
  },
  {
    nome: "Diego Ferreira",
    foto: "https://randomuser.me/api/portraits/men/18.jpg",
    estrelas: 4,
    data: "há 5 dias",
    texto: "Entrega rápida e bem embalado. PIX copiar e colar foi fácil.",
    fotoEntrega: "https://i.postimg.cc/QCFG0NVT/br-11134103-81z1k-mhc8hgxmozk042.jpg"
  },
  {
    nome: "Ana Clara Souza",
    foto: "https://randomuser.me/api/portraits/women/12.jpg",
    estrelas: 5,
    data: "há 6 dias",
    texto: "Promoções são reais mesmo! Já comprei 2 vezes aqui.",
    videoEntrega: ""
  }
];

function estrelasTxt(n) {
  const cheias = "★".repeat(Math.max(0, Math.min(5, n)));
  const vazias = "☆".repeat(Math.max(0, 5 - Math.min(5, n)));
  return cheias + vazias;
}

function renderComentariosClientes() {
  const el = document.getElementById("reviews-list");
  if (!el) return;

  el.innerHTML = "";

  comentariosClientes.forEach((c) => {
    const avatar = c.foto || "https://via.placeholder.com/48?text=User";

    const card = document.createElement("div");
    card.className = "review-card";

    card.innerHTML = `
      <div class="review-top">
        <img class="review-avatar" src="${avatar}" alt="${c.nome}">
        <div>
          <p class="review-name">${c.nome}</p>
          <div class="review-meta">
            <span class="review-stars">${estrelasTxt(c.estrelas)}</span>
            <span>${c.data}</span>
          </div>
        </div>
      </div>

      <p class="review-text">${c.texto}</p>

      ${
        c.videoEntrega
          ? `
        <video
          class="review-prod review-video"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
        >
          <source src="${c.videoEntrega}" type="video/mp4">
          Seu navegador não suporta vídeo.
        </video>
      `
          : c.fotoEntrega
          ? `
        <img
          class="review-prod"
          src="${c.fotoEntrega}"
          alt="Cliente recebeu o produto"
          loading="lazy"
        >
      `
          : ""
      }

      <span class="review-badge">✅ Compra verificada</span>
    `;

    el.appendChild(card);
  });
}

// ======================
// Boot
// ======================
renderProdutos();
renderMaisVendidos();
updateCart();
iniciarContador();
renderComentariosClientes();
iniciarAlertaComprasFake();
carregarConfig();