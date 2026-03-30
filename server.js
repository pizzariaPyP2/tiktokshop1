const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { MercadoPagoConfig, Payment } = require("mercadopago");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN não encontrada no .env");
}

app.use(cors());
app.use(express.json());

// arquivos estáticos
app.use("/videos", express.static(path.join(__dirname, "videos")));
app.use(express.static(__dirname));

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

const paymentClient = new Payment(client);

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// teste rápido
app.get("/ping", (req, res) => {
  res.json({ ok: true, pong: true });
});

app.get("/config", (req, res) => {
  res.json({
    ok: true,
    public_url: process.env.PUBLIC_URL || `http://localhost:${PORT}`,
    whatsapp_numero: process.env.WHATSAPP_NUMERO || ""
  });
});

app.post("/criar-pix", async (req, res) => {
  try {
    console.log("POST /criar-pix recebido");
    console.log("Body:", req.body);

    const { total, pedidoId, dadosEntrega, itens } = req.body;

    if (!total || Number(total) <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Total inválido."
      });
    }

    const email = String(dadosEntrega?.email || "").trim().toLowerCase();

    if (!emailValido(email)) {
      return res.status(400).json({
        ok: false,
        error: "E-mail do cliente inválido ou não enviado."
      });
    }

    const nomeCompleto = String(dadosEntrega?.nome || "Cliente").trim();
    const partesNome = nomeCompleto.split(" ").filter(Boolean);
    const first_name = partesNome[0] || "Cliente";
    const last_name = partesNome.slice(1).join(" ") || "Loja";

    const body = {
      transaction_amount: Number(total),
      description: `Pedido TikTok Shop #${pedidoId}`,
      payment_method_id: "pix",
      payer: {
        email,
        first_name,
        last_name
      },
      external_reference: String(pedidoId),
      additional_info: {
        items: Array.isArray(itens)
          ? itens.map((item) => ({
              id: String(item.id || ""),
              title: item.nome || "Produto",
              description: item.tamanhoEscolhido
                ? `Tamanho: ${item.tamanhoEscolhido}`
                : "Produto da loja",
              quantity: Number(item.quantidade || 1),
              unit_price: Number(item.preco || 0)
            }))
          : [],
        shipments: {
          receiver_address: {
            zip_code: String(dadosEntrega?.cep || ""),
            city_name: String(dadosEntrega?.cidade || ""),
            street_name: String(dadosEntrega?.endereco || "")
          }
        }
      }
    };

    const response = await paymentClient.create({ body });
    const tx = response?.point_of_interaction?.transaction_data || {};

    console.log("PIX criado:", response?.id);

    return res.status(200).json({
      ok: true,
      pedidoId,
      pagamentoId: response?.id || null,
      status: response?.status || "",
      status_detail: response?.status_detail || "",
      pixCopiaECola: tx?.qr_code || "",
      qrCodeBase64: tx?.qr_code_base64 || null
    });
  } catch (error) {
    console.error("Erro ao criar PIX:", error);

    return res.status(error?.status || 500).json({
      ok: false,
      error: "Não foi possível gerar o PIX.",
      detalhe:
        error?.cause?.[0]?.description ||
        error?.message ||
        "Erro interno ao gerar PIX."
    });
  }
});

app.get("/status-pagamento/:id", async (req, res) => {
  try {
    const paymentId = String(req.params.id || "").trim();

    if (!paymentId || paymentId === "null" || paymentId === "undefined") {
      return res.status(400).json({
        ok: false,
        error: "ID do pagamento inválido."
      });
    }

    const response = await paymentClient.get({ id: paymentId });

    return res.json({
      ok: true,
      id: response?.id || null,
      status: response?.status || "",
      status_detail: response?.status_detail || ""
    });
  } catch (error) {
    console.error("Erro ao consultar pagamento:", error);

    return res.status(error?.status || 500).json({
      ok: false,
      error: "Não foi possível consultar o pagamento.",
      detalhe:
        error?.cause?.[0]?.description ||
        error?.message ||
        "Erro interno ao consultar pagamento."
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});