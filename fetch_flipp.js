// === Flipp Weekly Ad Fetcher ===
// Created for ZIP 85383 (you can change it if needed)

import fetch from "node-fetch";
import fs from "fs";

const ZIP = "85383";
const STORES = ["Fry's Food Stores", "Walmart", "Safeway", "Sprouts Farmers Market", "Costco Wholesale", "Target"];

const BASE = "https://backflipp.wishabi.com/flipp";

// Step 1 — Get all flyers near you
const flyersURL = `${BASE}/services/flyers?postal_code=${ZIP}`;

async function getWeeklyDeals() {
  const flyersRes = await fetch(flyersURL);
  const flyers = await flyersRes.json();

  // Filter to your favorite stores
  const selectedFlyers = flyers.filter(f => STORES.includes(f.merchant?.name));

  const allDeals = [];

  // Step 2 — Loop through each flyer and grab its items
  for (const flyer of selectedFlyers) {
    console.log(`Fetching deals for ${flyer.merchant.name}...`);
    const itemsRes = await fetch(`${BASE}/flyers/${flyer.id}/items`);
    const items = await itemsRes.json();

    for (const i of items) {
      allDeals.push({
        store: flyer.merchant.name,
        item: i.name,
        price: i.current_price,
        category: i.category,
        valid_to: flyer.valid_to
      });
    }
  }

  // Step 3 — Write results to JSON file
  fs.writeFileSync("weekly_deals.json", JSON.stringify(allDeals, null, 2));
  console.log(`✅ Saved ${allDeals.length} deals to weekly_deals.json`);
}

getWeeklyDeals().catch(console.error);
