"""Analisi dell'esempio "vendite": calcola i numeri della presentazione e li scrive in analisi.json.

Ogni valore dichiara la propria provenienza (file, colonna, operazione): è la prova dei calcoli.
Esecuzione, dalla cartella dell'esempio: python analisi.py
"""
import json
from pathlib import Path

import pandas as pd

CARTELLA = Path(__file__).parent
FILE = "dati/vendite.csv"

df = pd.read_csv(CARTELLA / FILE)


def provenienza(colonna: str, operazione: str) -> dict:
    return {"file": FILE, "colonna": colonna, "operazione": operazione}


mesi = sorted(df["mese"].unique())
primo, ultimo = mesi[0], mesi[-1]
ricavi_primo = df.loc[df["mese"] == primo, "ricavi"].sum()
ricavi_ultimo = df.loc[df["mese"] == ultimo, "ricavi"].sum()
per_regione = df.groupby("regione")["ricavi"].sum().sort_values(ascending=False)
quota_nord = per_regione["Nord"] / per_regione.sum() * 100

euro = {"tipo": "numero", "decimali": 0, "unita": "€"}

analisi = {
    "valori": {
        "ricavi_totale": {
            "etichetta": "Ricavi del semestre",
            "formato": euro,
            "valore": int(df["ricavi"].sum()),
            "provenienza": provenienza("ricavi", "somma"),
        },
        "ordini_totale": {
            "etichetta": "Ordini del semestre",
            "formato": {"tipo": "numero", "decimali": 0},
            "valore": int(df["ordini"].sum()),
            "provenienza": provenienza("ordini", "somma"),
        },
        "crescita_semestre": {
            "etichetta": "Crescita dei ricavi da gennaio a giugno",
            "formato": {"tipo": "percentuale", "decimali": 1},
            "valore": round(float((ricavi_ultimo / ricavi_primo - 1) * 100), 1),
            "provenienza": provenienza("ricavi", f"somma per mese, variazione % {primo} -> {ultimo}"),
        },
        "quota_nord": {
            "etichetta": "Quota dei ricavi del Nord",
            "formato": {"tipo": "percentuale", "decimali": 1},
            "valore": round(float(quota_nord), 1),
            "provenienza": provenienza("ricavi", "somma Nord / somma totale"),
        },
    },
    "serie": {
        "ricavi_per_regione": {
            "etichetta": "Ricavi del semestre per regione",
            "formato": euro,
            "punti": [{"etichetta": r, "valore": int(v)} for r, v in per_regione.items()],
            "provenienza": provenienza("ricavi", "somma per regione"),
        }
    },
}

(CARTELLA / "analisi.json").write_text(json.dumps(analisi, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("analisi.json scritto")
