"""Analisi della Presentazione: calcola i numeri e li scrive in analisi.json.

Regole:
- l'Analisi è l'unica fonte dei numeri: la Specifica li cita con {{id}};
- ogni valore e ogni serie dichiarano la provenienza (file, colonna, operazione);
- gli id usano solo lettere, cifre e _.

Esecuzione, dalla cartella della Presentazione: python analisi.py
"""
import json
from pathlib import Path

import pandas as pd

CARTELLA = Path(__file__).parent
FILE = "dati/DATI.csv"  # TODO: nome del file in dati/


def provenienza(colonna: str, operazione: str) -> dict:
    return {"file": FILE, "colonna": colonna, "operazione": operazione}


# df = pd.read_csv(CARTELLA / FILE)  # per Excel: pd.read_excel
euro = {"tipo": "numero", "decimali": 0, "unita": "€"}

analisi = {
    "valori": {
        # "ricavi_totale": {
        #     "etichetta": "Ricavi del periodo",
        #     "formato": euro,  # tipo: numero | percentuale | data (AAAA-MM-GG)
        #     "valore": int(df["ricavi"].sum()),
        #     "provenienza": provenienza("ricavi", "somma"),
        # },
    },
    "serie": {
        # "ricavi_per_regione": {
        #     "etichetta": "Ricavi per regione",
        #     "formato": euro,
        #     "punti": [{"etichetta": r, "valore": int(v)} for r, v in df.groupby("regione")["ricavi"].sum().items()],
        #     "provenienza": provenienza("ricavi", "somma per regione"),
        # },
    },
}

(CARTELLA / "analisi.json").write_text(json.dumps(analisi, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("analisi.json scritto")
