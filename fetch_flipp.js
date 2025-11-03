import fs from "node:fs";
import fetch from "node-fetch";

const ZIP = "85383";
const API_URL = `https://flipp.com/flyers?postal_code=${ZIP}`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function getWeeklyDeals() {
  console.log("🚀 Fetching Flipp API data...");

  const res = await fetch(API_URL, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();

  const flyers = json?.flyers || json?.data || [];
  console.log(`📦 Found ${flyers.length} flyers near ${ZIP}`);

  const deals = [];
  for (const flyer of flyers) {
    const store = flyer?.merchant?.name || flyer?.merchant_name || "Unknown Store";
    if (flyer?.items) {
      for (const item of flyer.items) {
        deals.push({
          store,
          name: item?.name || item?.title || "Unnamed item",
          price: item?.price_text || item?.current_price || "—",
        });
      }
    }
  }

  fs.writeFileSync("weekly_deals.json", JSON.stringify(deals, null, 2));
  console.log(`✅ Saved ${deals.length} deals`);
}

getWeeklyDeals().catch((err) => {
  console.error("❌ Error:", err);
  fs.writeFileSync("weekly_deals.json", "[]");
});
