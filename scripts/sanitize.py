#!/usr/bin/env python3
"""
Sanitize Organizze .xls export into clean transaction JSON.

Usage:
    python scripts/sanitize.py <input.xls> [--output data/transactions.json] [--merge]

When --merge is used, new transactions are merged with the existing JSON,
deduplicating by (date, description, category, amount, type).
"""

import argparse
import json
import sys
import os

try:
    import xlrd
except ImportError:
    print("Installing xlrd...")
    os.system(f"{sys.executable} -m pip install xlrd --quiet")
    import xlrd


# ── Description Cleanup Map ──────────────────────────────────────────────────
DESC_MAP = {
    "Uber Uber *Trip Help.U": "Uber",
    "Uber* Trip": "Uber",
    "Dl *Uberrides": "Uber",
    "REND PAGO APLIC AUT MAIS": "Rendimento",
    "PIX TRANSF YHON ES": "iFood",
    "PIX QRS IFOOD.COM A": "iFood",
    "MERCADO*MERCADOLIV 1/8": "Mercado Livre",
    "LIDER ORGANIZACAO COME": "Líder Farmácia",
    "Mercadolivre*10produt": "Mercado Livre",
    "Vivo Easy*Vivo Easy": "Vivo Easy",
    "IFD*ABALEN ALIMENTOS L": "Abalen Restaurante",
    "ZIG*Flex Bar": "Flex Bar",
    "ADEGA DA VILLA": "Adega da Villa",
    "CONTAINER BARBER HAIR": "Container Barber",
    "Zp *Container Barber H": "Container Barber",
    "Pagamento de NuPay": "NuPay",
    "MARAVILHAS DO LAR": "Maravilhas do Lar",
    "DAISO BRASIL": "Daiso",
    "Amazon Aws Servicos Brasil LTDA": "AWS",
    "Claro S.A.": "Claro Internet",
    "Condominio do Edificio Cardoso": "Condomínio",
    "Arantes Solucoes Imobiliarias LTDA": "Aluguel",
    "DM*Udemy": "Udemy",
    "IOF de compra internacional": "IOF",
    "Openai *Chatgpt Subscr": "ChatGPT",
    "JIM.COM* RESTAURANTE": "Jim Restaurante",
    "REST BOM APETITE": "Bom Apetite",
    "IFD*M.T. FERREIRA NAVE": "iFood",
    "KR CONVENIENCIA LTDA": "KR Conveniência",
    "MN SUPERMERCADOS LTDA": "MN Supermercados",
    "VillaniPrimavera": "Villani Primavera",
    "REDE ARAUJO  CHURRAS": "Rede Araujo",
    "MP *TIOZAOEVENTOS": "Tiozão Eventos",
    "MARCIA'S GOURMET": "Márcia's Gourmet",
    "Google Organizze Fina": "Organizze",
    "Leepastelarialtda": "Lee Pastelaria",
    "Don Manoel Restaurant": "Don Manoel",
    "Ana Julia D": "Ana Júlia",
    "SMART DAMHA LTDA": "Smart Damha",
    "Smart Damha": "Smart Damha",
    "SORFRIO COMERCIO DE PR": "Sorfrio",
    "Pg *Tecpet": "Tecpet",
    "GhiovanaCasaDe": "Ghiovana",
    "Paroquiasantana": "Paróquia",
    "Jose Ricardo Azzolin M": "José Ricardo",
    "Ifd*Ifood Club": "iFood Club",
    "Cemig Distribuicao S.A.": "CEMIG",
    "Auto Shopp Paulista LTDA": "Auto Shopp Paulista",
    "PAY DSG F": "DSG Restaurante",
    "PAY FARMA": "Farmácia",
    "PAY DROGA": "Farmácia",
    "PAY CANEL": "Canel",
    "Shpp Brasil Instituicao de Pagamento e Servicos de Pagamentos LTDA": "Shopee",
    "Tuna Pagamentos LTDA": "Tuna Pagamentos",
    "99Food": "99Food",
    "Wellhub": "Wellhub",
    "Dalben": "Dalben",
    "DALBEN": "Dalben",
    "Shark": "Shark",
}


def clean_description(desc: str) -> str:
    """Clean up raw Organizze description for display."""
    if desc in DESC_MAP:
        return DESC_MAP[desc]
    # Try partial matches for dynamic descriptions
    for pattern, clean in [
        ("Nescafe Dolce Gusto", "Nescafé Dolce Gusto"),
        ("Mapfre*Pcl", "Mapfre Seguro"),
        ("HelioZancanelliNe", "Hélio Zancanelli"),
        ("Times Jardins Escola", "Times Idiomas"),
        ("Airbnb *", "Airbnb"),
        ("Center Shopping", "Center Shopping"),
        ("Flash Alimentação", "Flash VA"),
        ("Zup I.t. Servicos", "Salário Zup"),
        ("Hud's Escarpas", "Hud's Escarpas"),
        ("Fatura Março", "Fatura cartão"),
        ("FATURA PAGA ITAU", "Fatura Itaú"),
    ]:
        if pattern in desc:
            return clean
    # Fallback: truncate at 30 chars
    return desc[:30] if len(desc) > 30 else desc


def parse_xls(filepath: str) -> list[dict]:
    """Parse all sheets from an Organizze .xls export."""
    wb = xlrd.open_workbook(filepath)
    transactions = []

    for sheet in wb.sheets():
        if sheet.nrows <= 1:
            continue
        for r in range(1, sheet.nrows):
            date_str = sheet.cell_value(r, 0)
            desc = sheet.cell_value(r, 1)
            cat = sheet.cell_value(r, 2)
            val = sheet.cell_value(r, 3)

            if val == 0 or not date_str:
                continue

            # Convert DD.MM.YYYY → YYYY-MM-DD
            parts = date_str.split(".")
            if len(parts) == 3:
                iso_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
            else:
                iso_date = date_str

            transactions.append({
                "date": iso_date,
                "description": desc,
                "description_clean": clean_description(desc),
                "category": cat if cat else "Outros",
                "amount": abs(val),
                "type": "income" if val > 0 else "expense",
                "account": sheet.name,
            })

    transactions.sort(key=lambda x: x["date"])
    return transactions


def sanitize(transactions: list[dict], rules: dict) -> list[dict]:
    """
    Apply sanitization rules to remove noise and adjust amounts.

    Rules dict structure:
    {
        "remove_internal_transfers": true,
        "remove_test_transactions": ["Pagar.me"],
        "remove_duplicate_card_bills": true,
        "roommate": {
            "name": "Adriano",
            "house_reimbursement": 1560.0,
            "loan_entries": [{"date": "2026-03-04", "amount": 1300.0}],
            "income_splits": [{"date": "2026-03-18", "amount": 2960.0, "loan_repayment": 1400.0}]
        },
        "partner": {
            "name": "Ana Júlia",
            "reimbursements": [
                {"income_date": "2026-03-09", "income_amount": 443.0, "offset_desc": "MOBLY", "offset_date": "2026-03-09"},
                {"income_date": "2026-03-21", "income_amount": 135.0, "reduce_desc": "Wellhub", "reduce_to": 2.50},
                {"income_date": "2026-03-21", "income_amount": 85.0, "offset_desc": "Ana Julia", "offset_date": "2026-03-21", "offset_amount": 85.0},
                {"income_date": "2026-03-22", "income_amount": 40.0, "reduce_desc": "Ana Julia", "reduce_date": "2026-03-24", "reduce_by": 40.0}
            ]
        },
        "cancel_pairs": [
            {"desc_pattern": "Buser", "date": "2026-03-23"},
            {"desc_pattern": "Arca", "date_range": ["2026-03-23", "2026-03-24"]}
        ]
    }
    """
    result = []
    skip = set()

    # Index for targeted removal
    for i, t in enumerate(transactions):
        d, desc, cat, amt, tp = t["date"], t["description"], t["category"], t["amount"], t["type"]

        # 1. Remove internal transfers (same person sending to self)
        if rules.get("remove_internal_transfers"):
            if "Ihury Kewin" in desc and tp in ("income", "expense"):
                # Check if there's a matching opposite transaction on same date
                for j, t2 in enumerate(transactions):
                    if j != i and t2["date"] == d and t2["amount"] == amt and t2["type"] != tp and "Ihury Kewin" in t2["description"]:
                        skip.add(i)
                        skip.add(j)
                        break

        # 2. Remove test transactions
        for pattern in rules.get("remove_test_transactions", []):
            if pattern in desc:
                skip.add(i)

        # 3. Remove duplicate card bill payments
        if rules.get("remove_duplicate_card_bills"):
            # Card bill payments from bank accounts (these duplicate individual card charges)
            if "FATURA PAGA" in desc:
                skip.add(i)
            if desc == "Fatura Março 2026" and tp == "expense":
                skip.add(i)
            if "NU PAGAMENT" in desc:
                skip.add(i)
            # Fatura estornos
            if desc == "Fatura Março 2026" and tp == "income":
                skip.add(i)

        # 4. Cancel pairs (refund + charge)
        for pair in rules.get("cancel_pairs", []):
            pattern = pair["desc_pattern"]
            if pattern in desc:
                if "date" in pair and d == pair["date"]:
                    skip.add(i)
                elif "date_range" in pair and pair["date_range"][0] <= d <= pair["date_range"][1]:
                    skip.add(i)

    # 5. Roommate rules
    rm = rules.get("roommate", {})
    if rm:
        name = rm.get("name", "")
        # Remove loan entries
        for loan in rm.get("loan_entries", []):
            for i, t in enumerate(transactions):
                if t["date"] == loan["date"] and t["amount"] == loan["amount"] and name.lower() in t["description"].lower():
                    skip.add(i)
        # Process income splits
        for split in rm.get("income_splits", []):
            for i, t in enumerate(transactions):
                if t["date"] == split["date"] and t["amount"] == split["amount"] and t["type"] == "income" and name.lower() in t["description"].lower():
                    skip.add(i)  # Will re-add as split entries

    # 6. Partner reimbursement removals
    partner = rules.get("partner", {})
    if partner:
        for reimb in partner.get("reimbursements", []):
            for i, t in enumerate(transactions):
                # Remove the income entry
                if t["date"] == reimb["income_date"] and t["amount"] == reimb["income_amount"] and t["type"] == "income":
                    if partner["name"].lower().replace("ú", "u") in t["description"].lower().replace("ú", "u"):
                        skip.add(i)
                        break
            # Remove offset expense if specified
            if "offset_desc" in reimb and "offset_date" in reimb:
                for i, t in enumerate(transactions):
                    if t["date"] == reimb["offset_date"] and t["type"] == "expense":
                        if reimb["offset_desc"].lower() in t["description"].lower():
                            if "offset_amount" in reimb:
                                if abs(t["amount"] - reimb["offset_amount"]) < 1:
                                    skip.add(i)
                                    break
                            else:
                                if abs(t["amount"] - reimb["income_amount"]) < 2:
                                    skip.add(i)
                                    break

    # Now build result with adjustments
    for i, t in enumerate(transactions):
        if i in skip:
            continue

        entry = {
            "date": t["date"],
            "description": t.get("description_clean", clean_description(t["description"])),
            "category": t["category"],
            "amount": round(t["amount"], 2),
            "type": t["type"],
        }

        # Partner reductions (adjust amount instead of removing)
        adjusted = False
        if partner:
            for reimb in partner.get("reimbursements", []):
                if "reduce_desc" in reimb and reimb["reduce_desc"].lower().replace("ú", "u") in t["description"].lower().replace("ú", "u"):
                    if "reduce_to" in reimb and t["type"] == "expense":
                        if t["description"] == reimb.get("reduce_desc") or reimb["reduce_desc"].lower() in t["description"].lower():
                            entry["amount"] = reimb["reduce_to"]
                            adjusted = True
                            break
                    if "reduce_by" in reimb and t.get("date") == reimb.get("reduce_date") and t["type"] == "expense":
                        entry["amount"] = round(t["amount"] - reimb["reduce_by"], 2)
                        adjusted = True
                        break

        result.append(entry)

    # Add roommate split entries
    rm = rules.get("roommate", {})
    if rm:
        for split in rm.get("income_splits", []):
            loan_repayment = split.get("loan_repayment", 0)
            house_share = split["amount"] - loan_repayment
            interest = loan_repayment - next(
                (l["amount"] for l in rm.get("loan_entries", []) if True), 0
            ) if loan_repayment > 0 else 0

            if house_share > 0:
                result.append({
                    "date": split["date"],
                    "description": f"{rm['name']} (parte casa)",
                    "category": "Reembolso",
                    "amount": round(house_share, 2),
                    "type": "income",
                })
            if interest > 0:
                result.append({
                    "date": split["date"],
                    "description": f"{rm['name']} (juros)",
                    "category": "Outras receitas",
                    "amount": round(interest, 2),
                    "type": "income",
                })

    # Apply roommate house reimbursement to Casa expenses
    house_reimb = rm.get("house_reimbursement", 0)
    if house_reimb > 0:
        casa_entries = [e for e in result if e["type"] == "expense" and e["category"] == "Casa"]
        casa_total = sum(e["amount"] for e in casa_entries)
        if casa_total > 0:
            for e in casa_entries:
                ratio = e["amount"] / casa_total
                reduction = house_reimb * ratio
                e["amount"] = round(max(0, e["amount"] - reduction), 2)
                e["category"] = "Casa (sua parte)"
            # Remove the reembolso entry since it's been applied
            result = [e for e in result if e.get("category") != "Reembolso"]

    result.sort(key=lambda x: x["date"])
    return result


def dedup(existing: list[dict], new: list[dict]) -> list[dict]:
    """Merge new transactions with existing, removing duplicates."""
    seen = set()
    for t in existing:
        key = (t["date"], t["description"], t["category"], t["amount"], t["type"])
        seen.add(key)

    merged = list(existing)
    added = 0
    for t in new:
        key = (t["date"], t["description"], t["category"], t["amount"], t["type"])
        if key not in seen:
            merged.append(t)
            seen.add(key)
            added += 1

    merged.sort(key=lambda x: x["date"])
    print(f"Merged: {added} new transactions added, {len(merged)} total")
    return merged


def main():
    parser = argparse.ArgumentParser(description="Sanitize Organizze export")
    parser.add_argument("input", help="Path to .xls file")
    parser.add_argument("--output", default="data/transactions.json", help="Output JSON path")
    parser.add_argument("--rules", default="data/sanitization-rules.json", help="Rules JSON path")
    parser.add_argument("--merge", action="store_true", help="Merge with existing transactions")
    args = parser.parse_args()

    # Parse XLS
    print(f"Parsing {args.input}...")
    raw = parse_xls(args.input)
    print(f"  Found {len(raw)} raw transactions")

    # Load rules
    if os.path.exists(args.rules):
        with open(args.rules) as f:
            rules = json.load(f)
    else:
        print(f"  Warning: No rules file at {args.rules}, using defaults")
        rules = {"remove_internal_transfers": True, "remove_duplicate_card_bills": True}

    # Sanitize
    clean = sanitize(raw, rules)
    print(f"  After sanitization: {len(clean)} transactions")

    # Merge or replace
    if args.merge and os.path.exists(args.output):
        with open(args.output) as f:
            existing = json.load(f)
        final = dedup(existing, clean)
    else:
        final = clean

    # Summary
    income = sum(t["amount"] for t in final if t["type"] == "income")
    expense = sum(t["amount"] for t in final if t["type"] == "expense")
    print(f"\n  Receitas: R${income:,.2f}")
    print(f"  Despesas: R${expense:,.2f}")
    print(f"  Saldo:    R${income - expense:,.2f}")

    # Save
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
    print(f"\n  Saved to {args.output}")


if __name__ == "__main__":
    main()
