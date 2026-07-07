import type { Locale } from "./i18n/locales";
import { PROOF_TEST_COUNT } from "./content";

const GATE = `${PROOF_TEST_COUNT}/${PROOF_TEST_COUNT}`;

export type SectorCard = {
  tag: string;
  title: string;
  body: string;
  proof: string;
};

export type SectorCopy = {
  eyebrow: string;
  title: string;
  note: string;
  cards: SectorCard[];
};

const TR: SectorCopy = {
  eyebrow: "//:Sektor",
  title: "Kimler için?",
  note:
    "E-ticaret veya WooCommerce mağazası değiliz — nginx önünde barındırma, API ve SOC operasyonu için kanıtlı koruma.",
  cards: [
    {
      tag: "TR hosting",
      title: "Paylaşımlı / VPS hosting",
      body:
        "Çok kiracılı nginx, Türkçe path ve anonymized customer corpus (API/JWT/path traversal) ile recall kanıtı.",
      proof: `customer-corpus · tr-hosting · ${GATE} gate`,
    },
    {
      tag: "API / B2B",
      title: "OpenAPI & JWT arkası API",
      body:
        "BOLA/şema ihlali, JWT abuse, OAuth redirect_uri/PKCE ve path traversal varyantları — log→WAF→ban.",
      proof: "openapi-strict · ban-profile e2e",
    },
    {
      tag: "SOC",
      title: "Telegram operatör & timeline",
      body:
        "Ban/ack/lineage tek akış, webhook batch ve operatör undo — Fail2ban loglarından ayrı SOC görünürlüğü.",
      proof: "telegram-soc · dashboard :8443",
    },
  ],
};

const EN: SectorCopy = {
  eyebrow: "//:Sectors",
  title: "Who is it for?",
  note:
    "Not an e-commerce or WooCommerce shop — measured protection for hosting, API, and SOC operators behind nginx.",
  cards: [
    {
      tag: "TR hosting",
      title: "Shared / VPS hosting",
      body:
        "Multi-tenant nginx with Turkish paths and anonymized customer corpus (API/JWT/path traversal) recall proof.",
      proof: `customer-corpus · tr-hosting · ${GATE} gate`,
    },
    {
      tag: "API / B2B",
      title: "OpenAPI & JWT-backed API",
      body:
        "BOLA/schema abuse, JWT abuse, OAuth redirect_uri/PKCE and path traversal variants — log→WAF→ban.",
      proof: "openapi-strict · ban-profile e2e",
    },
    {
      tag: "SOC",
      title: "Telegram operator & timeline",
      body:
        "Ban/ack/lineage in one stream, webhook batch and operator undo — SOC visibility beyond Fail2ban logs.",
      proof: "telegram-soc · dashboard :8443",
    },
  ],
};

export function getSectorCopy(locale: Locale): SectorCopy {
  return locale === "tr" ? TR : EN;
}
