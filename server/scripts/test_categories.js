import fs from 'fs';

const usedUrls = new Set();

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
  'openfoodfacts.org'
];

async function searchBingImages(query) {
  try {
    const searchUrl = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query + ' grocery product india') + '&form=HDRSC2';
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
      l.endsWith('.gif')
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

async function testCategories() {
  const sampleNames = [
    { cat: 'Chocolates', name: 'Cadbury Fuse' },
    { cat: 'Drinks', name: 'Sprite refreshing lemon-lime 750ml' },
    { cat: 'Dairy', name: 'Amul Pasteurised Butter 500g' },
    { cat: 'Ice Cream', name: 'Amul TriCone Chocolate Cone' },
    { cat: 'Instant', name: 'Gits Gulab Jamun Instant Dessert Mix 200g' },
    { cat: 'Cleaning', name: 'Lizol Disinfectant Floor Cleaner Citrus Green 1L' },
    { cat: 'Personal Care', name: 'L’Oreal Paris Casting Creme Gloss 500 Brown' },
    { cat: 'Spices', name: 'Everest Chhole Masala Authentic Spice 100g' },
    { cat: 'Electrical', name: 'Wipro Garnet Emergency Rechargeable LED Bulb 10W' },
    { cat: 'Grocery', name: 'Fortune Sunlite Refined Sunflower Cooking Oil 1L' },
    { cat: 'Bakery', name: 'Britannia Bourbon Biscuit' }
  ];

  for (const item of sampleNames) {
    const candidates = await searchBingImages(item.name);
    const best = selectBestImages(candidates, usedUrls);
    if (best.length > 0) {
      usedUrls.add(best[0]);
      console.log(`[${item.cat}] ${item.name}`);
      console.log(`  -> Selected: ${best[0]}`);
    } else {
      console.log(`[FAILED] ${item.name}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

testCategories();

