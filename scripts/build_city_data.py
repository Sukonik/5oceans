#!/usr/bin/env python3
"""Build data/maps/cities.json from a curated list of waterfront cities plus the
countries-states-cities-database (ODbL 1.0) for names and coordinates.
Usage: python scripts/build_city_data.py /path/to/countries-states-cities-database
The curated fields (water body, kind, note) are editorial and original."""
import json, sys, unicodedata, pathlib

DB = pathlib.Path(sys.argv[1]) / "json" / "countries+states+cities.json"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data/maps/cities.json"

ATL, PAC, IND, ARC, SOU, FRESH = "Atlantic Ocean", "Pacific Ocean", "Indian Ocean", "Arctic Ocean", "Southern Ocean", "Freshwater"
# name, country iso2, state iso2 (or ""), db name (if different), ocean, water body, kind, note
C = [
 ("Long Beach", "US", "NY", "", ATL, "Atlantic Ocean", "Ocean coast", "Barrier-island city on the Atlantic in Nassau County. Proposed first FiveOceans pilot city."),
 ("Miami", "US", "FL", "", ATL, "Biscayne Bay", "Bay", "Atlantic coast city on Biscayne Bay."),
 ("Fort Lauderdale", "US", "FL", "", ATL, "Atlantic Ocean", "Ocean coast", "Atlantic coast city known for its canals."),
 ("St. Petersburg", "US", "FL", "St. Petersburg", ATL, "Tampa Bay", "Bay", "On a peninsula between Tampa Bay and the Gulf of Mexico."),
 ("Sarasota", "US", "FL", "", ATL, "Gulf of Mexico", "Gulf", "Gulf of Mexico coast city on Sarasota Bay."),
 ("Charleston", "US", "SC", "", ATL, "Charleston Harbor", "Harbor", "Harbor city where the Ashley and Cooper rivers meet the Atlantic."),
 ("Wilmington", "US", "NC", "", ATL, "Cape Fear River", "River and coast", "On the Cape Fear River near the Atlantic coast."),
 ("Portland", "US", "ME", "", ATL, "Casco Bay", "Bay", "Harbor city on Casco Bay."),
 ("Newport", "US", "RI", "", ATL, "Narragansett Bay", "Bay", "On Aquidneck Island at the mouth of Narragansett Bay."),
 ("Annapolis", "US", "MD", "", ATL, "Chesapeake Bay", "Bay", "On the Chesapeake Bay at the mouth of the Severn River."),
 ("Galveston", "US", "TX", "", ATL, "Gulf of Mexico", "Gulf", "Island city on the Gulf of Mexico."),
 ("San Diego", "US", "CA", "", PAC, "San Diego Bay", "Bay", "Pacific coast harbor city on San Diego Bay."),
 ("Santa Barbara", "US", "CA", "", PAC, "Pacific Ocean", "Ocean coast", "Pacific coast city between the ocean and the Santa Ynez Mountains."),
 ("Seattle", "US", "WA", "", PAC, "Puget Sound", "Sound", "Between Puget Sound and Lake Washington."),
 ("Honolulu", "US", "HI", "", PAC, "Pacific Ocean", "Ocean coast", "Pacific city on the island of Oahu."),
 ("Chicago", "US", "IL", "", FRESH, "Lake Michigan", "Lake", "On the southwestern shore of Lake Michigan."),
 ("Milwaukee", "US", "WI", "", FRESH, "Lake Michigan", "Lake", "On the western shore of Lake Michigan."),
 ("Duluth", "US", "MN", "", FRESH, "Lake Superior", "Lake", "Port city at the western tip of Lake Superior."),
 ("Traverse City", "US", "MI", "", FRESH, "Grand Traverse Bay", "Lake", "At the head of Grand Traverse Bay on Lake Michigan."),
 ("Burlington", "US", "VT", "", FRESH, "Lake Champlain", "Lake", "On the shore of Lake Champlain."),
 ("Lake Havasu City", "US", "AZ", "", FRESH, "Lake Havasu", "Lake", "On Lake Havasu, a reservoir on the Colorado River."),
 ("Portland", "US", "OR", "", FRESH, "Willamette River", "River", "Where the Willamette River meets the Columbia River."),
 ("Vancouver", "CA", "BC", "", PAC, "Strait of Georgia", "Strait", "Pacific port city on Burrard Inlet and the Strait of Georgia."),
 ("Halifax", "CA", "NS", "", ATL, "Halifax Harbour", "Harbor", "Atlantic port city in Nova Scotia."),
 ("Kelowna", "CA", "BC", "", FRESH, "Okanagan Lake", "Lake", "On the shore of Okanagan Lake."),
 ("San Juan", "PR", "", "", ATL, "San Juan Bay", "Bay", "Capital of Puerto Rico on the Atlantic side of the island."),
 ("Cartagena", "CO", "BOL", "Cartagena de Indias", ATL, "Caribbean Sea", "Sea", "Caribbean coast port city in Colombia."),
 ("Panama City", "PA", "", "Panama City", PAC, "Bay of Panama", "Bay", "On the Pacific end of the Panama Canal."),
 ("Rio de Janeiro", "BR", "RJ", "", ATL, "Guanabara Bay", "Bay", "Atlantic city around Guanabara Bay."),
 ("Mar del Plata", "AR", "B", "", ATL, "Atlantic Ocean", "Ocean coast", "Atlantic resort city in Argentina."),
 ("Valparaiso", "CL", "VS", "", PAC, "Pacific Ocean", "Ocean coast", "Pacific port city in Chile."),
 ("Ushuaia", "AR", "V", "", SOU, "Beagle Channel", "Channel", "On the Beagle Channel in Tierra del Fuego. Gateway port for Southern Ocean and Antarctic voyages."),
 ("San Carlos de Bariloche", "AR", "R", "", FRESH, "Nahuel Huapi Lake", "Lake", "On the shore of Nahuel Huapi Lake."),
 ("Lisbon", "PT", "11", "", ATL, "Tagus estuary", "Estuary", "Atlantic capital on the Tagus estuary."),
 ("Porto", "PT", "13", "", ATL, "Douro River", "River and coast", "On the Douro River near the Atlantic."),
 ("Valencia", "ES", "V", "", ATL, "Mediterranean Sea", "Sea", "Mediterranean coast city."),
 ("Malaga", "ES", "MA", "", ATL, "Mediterranean Sea", "Sea", "Mediterranean coast city on the Costa del Sol."),
 ("Nice", "FR", "PAC", "", ATL, "Mediterranean Sea", "Sea", "Mediterranean coast city on the French Riviera."),
 ("Split", "HR", "17", "", ATL, "Adriatic Sea", "Sea", "Adriatic Sea port city."),
 ("Athens", "GR", "I", "", ATL, "Saronic Gulf", "Gulf", "Near the Saronic Gulf of the Aegean Sea."),
 ("Reykjavik", "IS", "", "", ATL, "Faxafloi bay", "Bay", "North Atlantic capital on Faxaflói bay."),
 ("Tromso", "NO", "55", "Tromsø", ARC, "Norwegian Sea", "Sea", "North of the Arctic Circle, between fjords and the Norwegian Sea."),
 ("Cape Town", "ZA", "WC", "", ATL, "Table Bay", "Bay", "On Table Bay, at the Atlantic end of the Cape Peninsula."),
 ("Mombasa", "KE", "", "", IND, "Indian Ocean", "Ocean coast", "Island port city on the Indian Ocean."),
 ("Dubai", "AE", "DU", "", IND, "Persian Gulf", "Gulf", "Persian Gulf coast city."),
 ("Panaji", "IN", "GA", "", IND, "Mandovi River", "River and coast", "Goa's capital on the Mandovi River near the Arabian Sea."),
 ("Phuket", "TH", "83", "Phuket", IND, "Andaman Sea", "Sea", "Island city on the Andaman Sea."),
 ("Sydney", "AU", "NSW", "", PAC, "Port Jackson", "Harbor", "Pacific harbor city on Port Jackson."),
 ("Hobart", "AU", "TAS", "", SOU, "Derwent River", "River and coast", "On the Derwent River estuary in Tasmania, open to the Southern Ocean beyond Storm Bay."),
 ("Auckland", "NZ", "AUK", "", PAC, "Hauraki Gulf", "Gulf", "Harbor city between the Hauraki Gulf and the Tasman Sea."),
 ("Queenstown", "NZ", "OTA", "", FRESH, "Lake Wakatipu", "Lake", "On the shore of Lake Wakatipu."),
 ("Lucerne", "CH", "LU", "Luzern", FRESH, "Lake Lucerne", "Lake", "On Lake Lucerne where the Reuss River leaves the lake."),
 ("Geneva", "CH", "GE", "", FRESH, "Lake Geneva", "Lake", "At the southwestern end of Lake Geneva."),
 ("Como", "IT", "CO", "", FRESH, "Lake Como", "Lake", "At the southwestern tip of Lake Como."),
 ("Budapest", "HU", "BU", "", FRESH, "Danube River", "River", "On both banks of the Danube."),
 ("Vienna", "AT", "9", "", FRESH, "Danube River", "River", "On the Danube."),
 ("Cologne", "DE", "NW", "Köln", FRESH, "Rhine River", "River", "On the Rhine."),
]

def fold(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)).lower().replace("-", " ").replace(".", "").strip()

db = json.load(open(DB, encoding="utf-8"))
countries = {c["iso2"]: c for c in db}
out, miss = [], []
for name, cc, sc, dbname, ocean, water, kind, note in C:
    country = countries.get(cc)
    if not country: miss.append((name, cc, "country")); continue
    cand = []
    for st in country["states"]:
        if sc and st.get("iso2") != sc: continue
        for ci in st["cities"]:
            if fold(ci["name"]) == fold(dbname or name): cand.append((st, ci))
    if not cand and sc:  # state code mismatch: retry across the country and report it
        for st in country["states"]:
            for ci in st["cities"]:
                if fold(ci["name"]) == fold(dbname or name): cand.append((st, ci))
        if cand: print("note: state code ignored for", name, cc, sc, "->", cand[0][0]["name"])
    if not cand: miss.append((name, cc, sc)); continue
    st, ci = cand[0]
    out.append(dict(id=fold(name).replace(" ", "-") + "-" + (sc or cc).lower(), name=name, state=st["name"], country=country["name"], countryCode=cc, region=country["region"],
                    lat=round(float(ci["latitude"]), 4), lon=round(float(ci["longitude"]), 4), family="Freshwater" if ocean == FRESH else "Seawater",
                    ocean=ocean, water=water, kind=kind, note=note))
doc = {"meta": {"title": "Cities near water", "count": len(out), "generated": "2026-11-06",
                "source": "Names, states, countries and coordinates from the countries-states-cities-database (https://github.com/dr5hn/countries-states-cities-database)",
                "license": "ODbL 1.0 (https://opendatacommons.org/licenses/odbl/1-0/). This adapted database is shared under the same license. Credit: dr5hn and contributors.",
                "editorial": "Water body, kind and notes are original FiveOceans editorial text."}, "cities": out}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
print("wrote", OUT, len(out), "cities; missing:", miss)
