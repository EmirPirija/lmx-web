# LMX Spec: "Do isteka zaliha" (Scarcity / Low Inventory)

## 1) Pragovi i konfiguracija

- `low inventory` prag: podrazumijevano `3` komada.
- `last units` prag: podrazumijevano `2` komada.
- Pragovi se mogu override-ovati po oglasu/seller podešavanjima:
  - `stock_alert_threshold` za `low inventory`.
  - `last_units_threshold` (ili `critical_stock_threshold`) za `last units`.

## 2) Eligibility logika (tačna pravila)

Sekcija **"Do isteka zaliha"** i scarcity UI su aktivni samo kada su istovremeno tačni svi uslovi:

1. Prodavač je uključio scarcity oznaku (`scarcity_enabled = true`)
2. Zaliha je poznata (`inventory_count` je validan broj)
3. `inventory_count > 0`
4. `inventory_count <= low_inventory_threshold`

Formula:

`isEligible = scarcity_enabled && inventory_count > 0 && inventory_count <= low_threshold`

Dodatno:

- `isLastUnits = inventory_count > 0 && inventory_count <= last_units_threshold`
- `isOutOfStock = inventory_count <= 0`

## 3) Zaštita od "fake scarcity"

- Ako je `scarcity_enabled = true`, ali `inventory_count > low_threshold`:
  - oglas **ne ulazi** u sekciju "Do isteka zaliha"
  - scarcity badge/copy se **ne prikazuju**
- Ako `inventory_count = 0`:
  - scarcity badge/copy se uklanjaju
  - prikazuje se status **"Rasprodano"**

## 4) Homepage sekcija "Do isteka zaliha"

Sekcija prikazuje samo oglase koji su `isEligible`.

Na kartici se prikazuje:

- naziv, slika, cijena
- badge: `Do isteka zaliha`
- količina:
  - `Posljednji komadi` (kad je `isLastUnits`)
  - `Još X komada dostupno` (kad je `isEligible` i nije `isLastUnits`)
- hint `Popularno` samo ako postoji realan signal interesa (pregledi/poruke/favoriti/kontakti iznad internog minimuma)

## 5) Oglas detalji (Product Detail)

Kad je `isEligible`:

- badge: `Do isteka zaliha`
- copy:
  - `Cijena važi do isteka zaliha`
  - `Posljednji komadi` ili `Još X komada dostupno`

Kad je `isOutOfStock`:

- badge: `Rasprodano`
- scarcity copy se uklanja
- kontakt akcije se blokiraju uz poruku da je oglas rasprodan dok se zaliha ne dopuni

## 6) Restock (povratak zalihe)

Sistem je dinamičan i automatski:

- Ako zaliha poraste iznad praga (`inventory_count > low_threshold`):
  - scarcity UI se uklanja
  - oglas izlazi iz homepage sekcije
- Ako zaliha opet padne ispod praga:
  - scarcity UI i sekcija se ponovo aktiviraju

## 7) Osnovna anti-manipulation zaštita

Implementirano:

- UI lock kod čestog paljenja/gašenja scarcity switcha:
  - podrška za backend lock (`scarcity_toggle_locked_until` / `scarcity_last_toggled_at`)
  - kratki klijentski cooldown da spriječi spam klikove

Preporuka za backend:

- enforce cooldown i audit trail server-side (izvor istine), npr. 10–15 min između promjena.

## 8) Statistikа za prodavače (scarcity breakdown)

U statistici oglasa se prikazuje breakdown:

- **Sa scarcity UI** vs **bez scarcity UI**
- ključne metrike:
  - Pregledi
  - Jedinstveni pregledi
  - Poruke
  - Pozivi (phone + WhatsApp + Viber klikovi)
  - Favoriti
  - Stopa kontakta
- doprinos homepage sekcije:
  - pregledi iz sekcije
  - kontakti iz sekcije
  - stopa kontakta iz sekcije
- trend kroz vrijeme (views + contacts) uz stanje zalihe (normalno / niska zaliha / posljednji komadi / rasprodano)
- 1–2 jednostavna insighta, seller-friendly

## 9) Tracking eventi (spec)

Za tačne metrike potrebno je slati/čitati:

1. `item-statistics/track-view`
   - `source = featured_section`
   - `source_detail = home_low_stock` za ulaze iz sekcije "Do isteka zaliha"

2. `item-statistics/track-contact`
   - isti attribution (`source`, `source_detail`) da se kontakti vežu za scarcity ulaz

3. `item-statistics/track-favorite`
   - attribution po istom principu

4. (Preporučeno) `track-engagement` za:
   - `engagement_type = scarcity_state_change`
   - `extra_data`: `from_state`, `to_state`, `inventory_count`, `thresholds`

5. (Preporučeno) `track-engagement` za:
   - `engagement_type = scarcity_toggle`
   - `extra_data`: `enabled`, `item_id`, `actor_id`

## 10) UI copy standard (bosanski ijekavica)

- Badge aktivno: `Do isteka zaliha`
- Količina (low): `Još {X} komada dostupno`
- Količina (critical): `Posljednji komadi`
- Cjenovni hint: `Cijena važi do isteka zaliha`
- Out of stock: `Rasprodano`
- Out of stock helper: `Artikal trenutno nije dostupan. Nakon dopune zalihe, status se automatski ažurira.`

## 11) UX ton

- poruke su informativne i neutralne
- bez agresivnog marketinga
- jasno razdvajanje stvarne niske zalihe od ručno uključene oznake
