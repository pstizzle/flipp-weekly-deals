// === Flipp Weekly Ad Fetcher (fixed for GitHub Actions) ===
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

const BASE = "https://backflipp.wishabi.com/flipp";
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
    console.error("⚠️ Non-JSON response from", url.slice(0, 80));
    return [];
  }
}

async function getWeeklyDeals() {
  console.log("Fetching flyers...");
  const flyers = await safeFetchJSON(`${BASE}/services/flyers?postal_code=${ZIP}`);

  const selected = flyers.filter(f => STORES.includes(f.merchant?.name));
  const allDeals = [];

  for (const flyer of selected) {
    console.log(`Fetching deals for ${flyer.merchant.name}...`);
    const items = await safeFetchJSON(`${BASE}/flyers/${flyer.id}/items`);

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
