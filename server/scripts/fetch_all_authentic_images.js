import fs from 'fs';
import path from 'path';

const CACHE_FILE = 'data/authentic_images_cache.json';
const OUTPUT_FILE = 'data/products469.json';

const TRUSTED_DOMAINS = [
  'bbassets.com',
  'media-amazon.com',
  'cdn.zeptonow.com',
  'instamart-media-assets.swiggy.com',
  'jiomart.com',
  'rukminim',
  'flipkart.com',
  'grofers.com',
  'blinkit.com',
  'dmart.in',
  'itcstore.in',
  'patanjaliayurved.net',
  'dabur.com',
  'amul.com',
  'openfoodfacts.org',
  'bigbasket.com'
];

function getEnhancedQuery(p) {
  let name = p.name;
  let cat = p.category;

  if (name.includes('Packaged rice green bag')) return 'India Gate Basmati Rice Feast Rozzana green bag 5kg';
  if (name.includes('Packaged rice white purple bag')) return 'Fortune Everyday Basmati Rice purple bag 1kg';
  if (name.includes('Packaged rice blue bag')) return 'India Gate Basmati Rice Classic blue bag 1kg';
  if (name.includes('Packaged rice yellow bag')) return 'Daawat Rozana Gold Basmati Rice yellow bag 1kg';
  if (name.includes('Red bag grain / cereal')) return 'Aashirvaad Select Sharbati Atta red bag 5kg';
  if (name.includes('Packaged 250g grocery bag')) return 'Tata Sampann Unpolished Toor Dal 250g';
  if (name.includes('Packaged Flour / Semolina')) return 'Fortune Suji Semolina 500g pack';
  if (name.includes('Packaged Snack Mix Red')) return 'Haldiram All In One Namkeen red pack 200g';
  if (name.includes('Packaged Snack Mix Green')) return 'Haldiram Moong Dal namkeen green pack 200g';
  if (name.includes('Packaged Snack Mix Yellow')) return 'Haldiram Khatta Meetha namkeen yellow pack 200g';
  if (name.includes('Packaged Snack Mix Orange')) return 'Haldiram Bhujia Sev orange pack 200g';
  if (name.includes('Packaged Rusk')) return 'Britannia Toastea Premium Bake Rusk 200g';
  if (name.includes('Packaged bakery rusks')) return 'Parle Rusk Real Elaichi 200g';
  if (name.includes('Packaged Toast Rusk')) return 'Sunfeast All Rounder Toast Rusk 200g';
  if (name.includes('Instant breakfast / meal pouch')) return 'MTR Instant Poha Breakfast Mix 160g';
  if (name.includes('Chocolate health drink powder')) return 'Cadbury Bournvita Chocolate Health Drink Refill 500g';
  if (name.includes('Protein supplement pouch')) return 'Protinex Original Nutrition Protein Powder Refill 400g';
  if (name.includes('Red packaged powdered drink mix')) return 'Rasna Fruit Plus Orange Powder Mix 500g';
  if (name.includes('Generic Plastic dustpan set')) return 'Gala Dustpan with Hand Broom Brush';
  if (name.includes('Generic Cotton mop head')) return 'Scotch-Brite Cotton Floor Mop Refill';
  if (name.includes('Generic Rock salt / pink salt')) return 'Tata Salt Himalayan Pink Rock Salt 1kg';
  if (name.includes('Generic Loose salt pouch')) return 'Tata Salt Vacuum Evaporated Iodized Salt 1kg pouch';
  if (name.includes('Generic Salt pack orange white')) return 'Ankur Refined Iodised Salt orange white pack 1kg';
  if (name.includes('Generic Blue packaged soap')) return 'Rin Detergent Bar Blue 250g';
  if (name.includes('Generic Red packaged soap')) return 'Lifebuoy Total Germ Protection Red Soap Bar 125g';
  if (name.includes('Generic Green packaged soap')) return 'Medimix Ayurvedic 18 Herbs Green Soap Bar 125g';
  if (name.includes('Generic White packaged soap')) return 'Dove White Beauty Bathing Bar 100g';
  if (name.includes('Generic Incense sticks')) return 'Cycle Pure Agarbatti Incense Sticks pack';
  if (name.includes('Generic Cotton wicks')) return 'Mangaldeep Round Cotton Wicks Puja Phool Batti';
  if (name.includes('Generic Scented incense cones')) return 'Phool Organic Incense Cones Jar';
  if (name.includes('Generic Small packet accessories')) return 'Safety Pins and Bob Pins accessory pack';
  if (name.includes('Generic Glue stick')) return 'Pidilite Fevistik Glue Stick 15g';
  if (name.includes('Generic Plain bread buns')) return 'The Baker\'s Dozen Burger Buns Pav pack';
  if (name.includes('Generic Nutrish rusks')) return 'Britannia NutriChoice Multigrain Rusk 200g';
  if (name.includes('Generic Soan papdi box')) return 'Haldiram Nagpur Soan Papdi 250g box';
  if (name.includes('Generic Cake / packaged dessert')) return 'Britannia Treat Fruit Cake 120g pack';
  if (name.includes('Generic Ready-to-eat snack cup')) return 'Nissin Cup Noodles Veggie Manchow 70g';
  if (name.includes('Generic Dried dates')) return 'Lion Arabian Dates Kharik 500g pack';
  if (name.includes('Generic Roasted snack mixture')) return 'Haldiram Diet Roasted Mixture 200g jar';
  if (name.includes('Generic Chorafali papad')) return 'Ramdev Chorafali Papad 200g pack';
  if (name.includes('Generic Dry poha')) return 'Tata Sampann Thick Poha 500g pack';
  if (name.includes('Jumbo Long broom')) return 'Gala No Dust Floor Broom Jhadu';
  if (name.includes('Generic Grass broom')) return 'Gala King Kong Grass Phool Jhadu';
  if (name.includes('Generic Peacock-branded household broom')) return 'Peacock Brand Natural Grass Phool Jhadu';
  if (name.includes('Classic Soft Touch Cold Cream')) return 'Ponds Cold Cream Moisturizer 100g';
  if (name.includes('Classic Stainless Steel Kitchen Storage')) return 'Stainless Steel Dabba Kitchen Container';
  if (name.includes('Traditional Indian Gulab Jamun Sweet Box')) return 'Haldiram Gulab Jamun Tin Box 1kg';
  if (name.includes('Pure Filtered Mustard & Groundnut Cooking Oil Tin 5L')) return 'Fortune Filtered Groundnut Oil 5L Tin';
  if (name.includes('White Fox Roasted Snack')) return 'White Fox Makhana Foxnut Roasted Snack 100g';
  if (name.includes('Fresh Chilled Dairy Paneer Packet')) return 'Amul Fresh Paneer Malai 200g pack';
  if (name.includes('Amul Festive offer JOYO')) return 'Amul JOYO Storage Container Box Set';
  if (name.includes('Citrus Orange Fruity Ice Candy')) return 'Vadilal Orange Bar Ice Candy';
  if (name.includes('Alphonso Mango Juicy Ice Candy')) return 'Amul Mango Duet Ice Cream Bar';
  if (name.includes('Strawberry Pink Chilled Ice Candy')) return 'Amul Strawberry Ice Cream Cone Bar';
  if (name.includes('Creamy Vanilla Milk Ice Bar')) return 'Amul Vanilla Gold Ice Cream Bar';
  if (name.includes('Chocolate Dips Choco Stick Bar')) return 'Kwality Walls Chocobar Stick Ice Cream';

  return `${name} ${cat} pack shot`;
}

async function searchBingImages(query) {
  try {
    const searchUrl = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query + ' india') + '&form=HDRSC2';
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (!res.ok) return [];
    const text = await res.text();
    const matches = [...text.matchAll(/murl&quot;:&quot;(https?:[^&]+)&quot;/g)];
    const urls = matches.map(m => m[1]);
    return urls;
  } catch (e) {
    return [];
  }
}

function selectBestImages(candidates, existingUsed) {
  const isExcluded = (u) => {
    const l = u.toLowerCase();
    return (
      l.includes('logo') ||
      l.includes('icon') ||
      l.includes('banner') ||
      l.includes('vector') ||
      l.includes('recipe') ||
      l.includes('avatar') ||
      l.includes('unsplash.com') ||
      l.includes('placeholder') ||
      l.includes('w=120') ||
      l.includes('h=120') ||
      l.endsWith('.svg') ||
      l.endsWith('.gif') ||
      l.endsWith('.ico')
    );
  };

  const valid = candidates
    .map(u => u.startsWith('http://') ? 'https://' + u.slice(7) : u)
    .filter(u => !isExcluded(u) && !existingUsed.has(u));

  const sorted = valid.sort((a, b) => {
    const aTrusted = TRUSTED_DOMAINS.some(d => a.includes(d));
    const bTrusted = TRUSTED_DOMAINS.some(d => b.includes(d));
    if (aTrusted && !bTrusted) return -1;
    if (!aTrusted && bTrusted) return 1;
    return 0;
  });

  return sorted;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  console.log(`Starting image resolution for all ${products.length} products...`);

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`Loaded ${Object.keys(cache).length} cached entries.`);
    } catch (e) {
      cache = {};
    }
  }

  const usedUrls = new Set();
  for (const id in cache) {
    if (cache[id].images && cache[id].images[0]) {
      usedUrls.add(cache[id].images[0]);
    }
  }

  const concurrency = 3;
  let completed = 0;
  let updated = 0;
  let skipped = 0;

  async function worker(items) {
    for (const p of items) {
      const pid = p._id;

      if (
        cache[pid] &&
        cache[pid].images &&
        cache[pid].images.length > 0 &&
        !cache[pid].images[0].includes('unsplash.com')
      ) {
        p.image = cache[pid].images;
        skipped++;
        completed++;
        continue;
      }

      const query = getEnhancedQuery(p);
      let candidates = await searchBingImages(query);
      if (candidates.length === 0) {
        const fallbackQuery = p.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
        candidates = await searchBingImages(fallbackQuery);
      }

      const best = selectBestImages(candidates, usedUrls);

      if (best.length > 0) {
        const primary = best[0];
        const secondary = best[1] || primary;
        const images = secondary !== primary ? [primary, secondary] : [primary];

        usedUrls.add(primary);
        p.image = images;
        cache[pid] = {
          name: p.name,
          category: p.category,
          images: images,
          query: query
        };
        updated++;
        console.log(`[${completed + 1}/${products.length}] ${p.name.slice(0, 30)} -> ${primary.slice(0, 60)}...`);
      } else {
        cache[pid] = {
          name: p.name,
          category: p.category,
          images: p.image,
          query: query
        };
        console.warn(`[${completed + 1}/${products.length}] WARN: No unique image for ${p.name}`);
      }

      completed++;

      if (completed % 15 === 0 || completed === products.length) {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
        console.log(`-- Checkpoint: ${completed}/${products.length} done (Updated: ${updated}, Cached: ${skipped}) --`);
      }

      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Partition products into 3 chunks for concurrency
  const chunks = [[], [], []];
  products.forEach((p, idx) => {
    chunks[idx % concurrency].push(p);
  });

  await Promise.all(chunks.map(chunk => worker(chunk)));

  // Final write
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
  console.log(`\nALL DONE! Processed ${products.length} products. Updated: ${updated}, Cached: ${skipped}`);
}

main().catch(console.error);
