"""Analisi dell'esempio "catalogo-demo": legge l'export del tracker e i risultati delle prove, calcola i numeri e li scrive in analisi.json.

Ogni valore dichiara la propria provenienza (file, colonna, operazione): è la prova dei calcoli.
Esecuzione, dalla cartella dell'esempio: python analisi.py
"""
import json
from pathlib import Path

import pandas as pd

CARTELLA = Path(__file__).parent

tracker = pd.read_csv(CARTELLA / "dati/tracker.csv")
prove = pd.read_csv(CARTELLA / "dati/prove.csv")
corpus = pd.read_csv(CARTELLA / "dati/corpus.csv")
budget = pd.read_csv(CARTELLA / "dati/budget.csv")
azioni = pd.read_csv(CARTELLA / "dati/azioni.csv")


def provenienza(file: str, colonna: str, operazione: str) -> dict:
    return {"file": f"dati/{file}", "colonna": colonna, "operazione": operazione}


NUMERO = {"tipo": "numero", "decimali": 0}
PERCENTUALE = {"tipo": "percentuale", "decimali": 0}
DATA = {"tipo": "data"}
EURO = {"tipo": "numero", "decimali": 0, "unita": "€"}
MINUTI = {"tipo": "numero", "decimali": 1, "unita": "min"}

valori = {}
serie = {}

# Avanzamento complessivo e per milestone
valori["avanzamento_complessivo"] = {
    "etichetta": "Avanzamento complessivo del progetto",
    "formato": PERCENTUALE,
    "valore": round(float(tracker["avanzamento"].mean()), 0),
    "provenienza": provenienza("tracker.csv", "avanzamento", "media di tutte le milestone"),
}
valori["milestone_completate"] = {
    "etichetta": "Milestone completate",
    "formato": NUMERO,
    "valore": int((tracker["avanzamento"] == 100).sum()),
    "provenienza": provenienza("tracker.csv", "avanzamento", "conteggio delle milestone al 100%"),
}
valori["milestone_totale"] = {
    "etichetta": "Milestone del progetto",
    "formato": NUMERO,
    "valore": int(len(tracker)),
    "provenienza": provenienza("tracker.csv", "id", "conteggio"),
}
aperte = tracker[tracker["avanzamento"] < 100]
valori["prossima_scadenza"] = {
    "etichetta": "Prossima scadenza",
    "formato": DATA,
    "valore": str(aperte["data_fine"].min()),
    "provenienza": provenienza("tracker.csv", "data_fine", "minimo tra le milestone non completate"),
}
for riga in tracker.itertuples():
    n = riga.id.lower()
    valori[f"{n}_data"] = {
        "etichetta": f"Scadenza di {riga.milestone}",
        "formato": DATA,
        "valore": str(riga.data_fine),
        "provenienza": provenienza("tracker.csv", "data_fine", f"valore della milestone {riga.id}"),
    }
    valori[f"{n}_avanzamento"] = {
        "etichetta": f"Avanzamento di {riga.milestone}",
        "formato": PERCENTUALE,
        "valore": int(riga.avanzamento),
        "provenienza": provenienza("tracker.csv", "avanzamento", f"valore della milestone {riga.id}"),
    }

# Avanzamento per workstream
for nome, gruppo in tracker.groupby("workstream", sort=False):
    valori[f"ws_{nome.lower()}"] = {
        "etichetta": f"Avanzamento del workstream {nome}",
        "formato": PERCENTUALE,
        "valore": round(float(gruppo["avanzamento"].mean()), 0),
        "provenienza": provenienza("tracker.csv", "avanzamento", f"media delle milestone del workstream {nome}"),
    }

# Scadenze delle azioni
for riga in azioni.itertuples():
    valori[f"{riga.id.lower()}_scadenza"] = {
        "etichetta": f"Scadenza dell'azione {riga.id}",
        "formato": DATA,
        "valore": str(riga.scadenza),
        "provenienza": provenienza("azioni.csv", "scadenza", f"valore dell'azione {riga.id}"),
    }

# Risultati delle prove
valori["prove_totale"] = {
    "etichetta": "Domande del campione di prova",
    "formato": NUMERO,
    "valore": int(len(prove)),
    "provenienza": provenienza("prove.csv", "id", "conteggio"),
}
valori["precisione"] = {
    "etichetta": "Risposte corrette",
    "formato": PERCENTUALE,
    "valore": round(float(prove["corretta"].mean() * 100), 0),
    "provenienza": provenienza("prove.csv", "corretta", "media * 100"),
}
valori["fonti_citate"] = {
    "etichetta": "Risposte con fonte citata",
    "formato": PERCENTUALE,
    "valore": round(float(prove["fonte_citata"].mean() * 100), 0),
    "provenienza": provenienza("prove.csv", "fonte_citata", "media * 100"),
}
valori["tempo_assistente"] = {
    "etichetta": "Tempo medio con l'assistente",
    "formato": MINUTI,
    "valore": round(float(prove["minuti_assistente"].mean()), 1),
    "provenienza": provenienza("prove.csv", "minuti_assistente", "media"),
}
valori["tempo_attuale"] = {
    "etichetta": "Tempo medio con la ricerca attuale",
    "formato": MINUTI,
    "valore": round(float(prove["minuti_attuale"].mean()), 1),
    "provenienza": provenienza("prove.csv", "minuti_attuale", "media"),
}
valori["riduzione_tempo"] = {
    "etichetta": "Riduzione del tempo di ricerca",
    "formato": PERCENTUALE,
    "valore": round(float((1 - prove["minuti_assistente"].mean() / prove["minuti_attuale"].mean()) * 100), 0),
    "provenienza": provenienza("prove.csv", "minuti_assistente, minuti_attuale", "1 - media assistente / media attuale, in %"),
}

categorie = list(dict.fromkeys(prove["categoria"]))
serie["tempo_assistente_categoria"] = {
    "etichetta": "Tempo medio con l'assistente per categoria",
    "formato": MINUTI,
    "punti": [
        {"etichetta": c, "valore": round(float(prove.loc[prove["categoria"] == c, "minuti_assistente"].mean()), 1)}
        for c in categorie
    ],
    "provenienza": provenienza("prove.csv", "minuti_assistente", "media per categoria"),
}
serie["tempo_attuale_categoria"] = {
    "etichetta": "Tempo medio con la ricerca attuale per categoria",
    "formato": MINUTI,
    "punti": [
        {"etichetta": c, "valore": round(float(prove.loc[prove["categoria"] == c, "minuti_attuale"].mean()), 1)}
        for c in categorie
    ],
    "provenienza": provenienza("prove.csv", "minuti_attuale", "media per categoria"),
}

# Corpus documentale
valori["corpus_totale"] = {
    "etichetta": "Documenti indicizzati",
    "formato": NUMERO,
    "valore": int(corpus["documenti"].sum()),
    "provenienza": provenienza("corpus.csv", "documenti", "somma"),
}
serie["corpus_per_tipo"] = {
    "etichetta": "Documenti indicizzati per tipo",
    "formato": NUMERO,
    "punti": [{"etichetta": r.tipo, "valore": int(r.documenti)} for r in corpus.itertuples()],
    "provenienza": provenienza("corpus.csv", "documenti", "valore per tipo"),
}

# Budget: cascata dal budget approvato al costo previsto
iniziale = int(budget["importo"].iloc[0])
previsto = int(budget["importo"].sum())
valori["budget_approvato"] = {
    "etichetta": "Budget approvato",
    "formato": EURO,
    "valore": iniziale,
    "provenienza": provenienza("budget.csv", "importo", "prima voce"),
}
valori["costo_previsto"] = {
    "etichetta": "Costo previsto",
    "formato": EURO,
    "valore": previsto,
    "provenienza": provenienza("budget.csv", "importo", "somma di tutte le voci"),
}
punti_budget = [{"etichetta": r.voce, "valore": int(r.importo)} for r in budget.itertuples()]
punti_budget.append({"etichetta": "Costo previsto", "valore": previsto})
serie["budget_cascata"] = {
    "etichetta": "Dal budget approvato al costo previsto",
    "formato": EURO,
    "punti": punti_budget,
    "provenienza": provenienza("budget.csv", "importo", "voci in ordine, più la somma finale"),
}

analisi = {"valori": valori, "serie": serie}
(CARTELLA / "analisi.json").write_text(json.dumps(analisi, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("analisi.json scritto")
