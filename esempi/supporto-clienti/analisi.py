"""Analisi dell'esempio "supporto-clienti": calcola i numeri della presentazione e li scrive in analisi.json.

I dati sono sintetici. Ogni valore dichiara la propria provenienza (file, colonna, operazione).
Esecuzione, dalla cartella dell'esempio: python analisi.py
"""
import json
from pathlib import Path

import pandas as pd

CARTELLA = Path(__file__).parent
FILE = "dati/ticket.csv"

df = pd.read_csv(CARTELLA / FILE)
df["ore_per_ticket"] = df["ore_prima_risposta"] * df["ticket"]
df["csat_per_ticket"] = df["csat"] * df["ticket"]


def provenienza(colonna: str, operazione: str) -> dict:
    return {"file": FILE, "colonna": colonna, "operazione": operazione}


def media_pesata(dati: pd.DataFrame, colonna: str) -> float:
    return float(dati[colonna].sum() / dati["ticket"].sum())


settimane = sorted(df["settimana"].unique(), key=lambda s: int(s[1:]))
per_settimana = df.groupby("settimana")["ticket"].sum().reindex(settimane)
per_canale = df.groupby("canale")["ticket"].sum().sort_values(ascending=False)
per_categoria = df.groupby("categoria")["ticket"].sum().sort_values(ascending=False)
canali = ["Email", "Chat", "Telefono"]

ore = {"tipo": "numero", "decimali": 1, "unita": "h"}
voto = {"tipo": "numero", "decimali": 1}
conteggio = {"tipo": "numero", "decimali": 0}

tempo = {c: media_pesata(df[df["canale"] == c], "ore_per_ticket") for c in canali}
csat = {c: media_pesata(df[df["canale"] == c], "csat_per_ticket") for c in canali}

valori = {
    "ticket_totale": {
        "etichetta": "Ticket del periodo",
        "formato": conteggio,
        "valore": int(df["ticket"].sum()),
        "provenienza": provenienza("ticket", "somma"),
    },
    "crescita_ticket": {
        "etichetta": "Crescita dei ticket dalla prima all'ultima settimana",
        "formato": {"tipo": "percentuale", "decimali": 1},
        "valore": round(float((per_settimana.iloc[-1] / per_settimana.iloc[0] - 1) * 100), 1),
        "provenienza": provenienza("ticket", f"somma per settimana, variazione % {settimane[0]} -> {settimane[-1]}"),
    },
    "tempo_medio": {
        "etichetta": "Tempo medio alla prima risposta",
        "formato": ore,
        "valore": round(media_pesata(df, "ore_per_ticket"), 1),
        "provenienza": provenienza("ore_prima_risposta", "media pesata sui ticket"),
    },
    "csat_medio": {
        "etichetta": "Soddisfazione media (da 1 a 5)",
        "formato": voto,
        "valore": round(media_pesata(df, "csat_per_ticket"), 1),
        "provenienza": provenienza("csat", "media pesata sui ticket"),
    },
    "quota_chat": {
        "etichetta": "Quota dei ticket in chat",
        "formato": {"tipo": "percentuale", "decimali": 1},
        "valore": round(float(per_canale["Chat"] / per_canale.sum() * 100), 1),
        "provenienza": provenienza("ticket", "somma Chat / somma totale"),
    },
}
for c in canali:
    chiave = c.lower()
    valori[f"ticket_{chiave}"] = {
        "etichetta": f"Ticket {c}",
        "formato": conteggio,
        "valore": int(per_canale[c]),
        "provenienza": provenienza("ticket", f"somma, canale {c}"),
    }
    valori[f"tempo_{chiave}"] = {
        "etichetta": f"Prima risposta {c}",
        "formato": ore,
        "valore": round(tempo[c], 1),
        "provenienza": provenienza("ore_prima_risposta", f"media pesata sui ticket, canale {c}"),
    }
    valori[f"csat_{chiave}"] = {
        "etichetta": f"Soddisfazione {c}",
        "formato": voto,
        "valore": round(csat[c], 1),
        "provenienza": provenienza("csat", f"media pesata sui ticket, canale {c}"),
    }

analisi = {
    "valori": valori,
    "serie": {
        "ticket_per_settimana": {
            "etichetta": "Ticket per settimana",
            "formato": conteggio,
            "punti": [{"etichetta": s, "valore": int(v)} for s, v in per_settimana.items()],
            "provenienza": provenienza("ticket", "somma per settimana"),
        },
        "ticket_per_canale": {
            "etichetta": "Ticket per canale",
            "formato": conteggio,
            "punti": [{"etichetta": c, "valore": int(v)} for c, v in per_canale.items()],
            "provenienza": provenienza("ticket", "somma per canale"),
        },
        "ticket_per_categoria": {
            "etichetta": "Ticket per categoria",
            "formato": conteggio,
            "punti": [{"etichetta": c, "valore": int(v)} for c, v in per_categoria.items()],
            "provenienza": provenienza("ticket", "somma per categoria"),
        },
        "tempo_per_canale": {
            "etichetta": "Ore alla prima risposta per canale",
            "formato": ore,
            "punti": [{"etichetta": c, "valore": round(tempo[c], 1)} for c in canali],
            "provenienza": provenienza("ore_prima_risposta", "media pesata sui ticket per canale"),
        },
        "csat_per_canale": {
            "etichetta": "Soddisfazione per canale",
            "formato": voto,
            "punti": [{"etichetta": c, "valore": round(csat[c], 1)} for c in canali],
            "provenienza": provenienza("csat", "media pesata sui ticket per canale"),
        },
    },
}

(CARTELLA / "analisi.json").write_text(json.dumps(analisi, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("analisi.json scritto")
