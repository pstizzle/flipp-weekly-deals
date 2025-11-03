// === Flipp Weekly Ad Fetcher (2025 endpoint) ===
import fs from "node:fs";

const ZIP = "85383";
const STORES = [
  "Fry's Food Stores",
  "Walmart",
  "Safeway",
  "Sprouts Farmers Market",
  "Costco Wholesale",
  "Target"
];

const BASE = "https://flipp.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function safeFetchJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("⚠️ Non-JSON or empty response from:", url);
    console.error(text.slice(0, 300));
    return [];
  }
}

async function getWeeklyDeals() {
  console.log("Fetching flyers from Flipp...");
  const flyers = await safeFetchJSON(`${BASE}/flyers?postal_code=${ZIP}`);

  console.log(`📦 Got ${flyers.length} flyers near ${ZIP}`);

  const selected = flyers.filter(f => STORES.includes(f.merchant?.name));
  console.log(`✅ Selected ${selected.length} favorite stores`);

  const allDeals = [];

  for (const flyer of selected) {
    console.log(`Fetching deals for ${flyer.merchant.name} (id ${flyer.id})...`);
    const flyerData = await safeFetchJSON(`${BASE}/flyers/${flyer.id}?postal_code=${ZIP}`);
    const items = flyerData.items || [];

    console.log(`→ Got ${items.length} items`);
    for (const i of items) {
      allDeals.push({
        store: flyer.merchant.name,
        item: i.name,
        price: i.current_price,
        category: i.category,
        valid_to: flyer.valid_to,
      });
    }
  }

  fs.writeFileSync("weekly_deals.json", JSON.stringify(allDeals, null, 2));
  console.log(`✅ Saved ${allDeals.length} deals`);
}

getWeeklyDeals().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
