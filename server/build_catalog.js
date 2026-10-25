import fs from 'fs';
import mongoose from 'mongoose';
import 'dotenv/config';

// Load raw items
const rawItems = JSON.parse(fs.readFileSync('data/rawPdfItems.json', 'utf8'));

// Curated image dictionaries with reliable high-quality CDNs and Unsplash direct product assets
const categoryImages = {
  Chocolates: [
    "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?auto=format&fit=crop&q=80&w=600"
  ],
  Drinks: [
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=600"
  ],
  Dairy: [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600"
  ],
  "Ice Cream": [
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&q=80&w=600"
  ],
  Cleaning: [
    "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=600"
  ],
  "Personal Care": [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1608248597359-536f0490b4bf?auto=format&fit=crop&q=80&w=600"
  ],
  Spices: [
    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600"
  ],
  Grocery: [
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600"
  ],
  Instant: [
    "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600"
  ],
  Electrical: [
    "https://images.unsplash.com/photo-1550524514-4b533f81e3a9?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=600"
  ]
};

// Item-specific authentic image mapping based on brand & pack
const specificImageMap = {
  // Cadbury Silk
  P001: "https://www.bbassets.com/media/uploads/p/l/20006690_49-cadbury-dairy-milk-silk-bubbly-chocolate-bar.jpg",
  P002: "https://images.openfoodfacts.org/images/products/762/220/227/1861/front_en.9.400.jpg",
  P003: "https://images.openfoodfacts.org/images/products/762/220/227/1861/front_en.9.400.jpg",
  P004: "https://www.bbassets.com/media/uploads/p/l/40120536_17-cadbury-dairy-milk-silk-oreo-chocolate-bar.jpg",
  P005: "https://www.bbassets.com/media/uploads/p/l/40156947_11-cadbury-dairy-milk-silk-mousse-chocolate-bar.jpg",
  P006: "https://www.bbassets.com/media/uploads/p/l/40120537_13-cadbury-dairy-milk-silk-hazelnut-chocolate-bar.jpg",
  P007: "https://www.bbassets.com/media/uploads/p/l/40200843_6-cadbury-dairy-milk-silk-red-velvet-chocolate-bar.jpg",
  P008: "https://www.bbassets.com/media/uploads/p/l/40156947_11-cadbury-dairy-milk-silk-mousse-chocolate-bar.jpg",
  P009: "https://images.openfoodfacts.org/images/products/762/220/232/9494/front_en.12.400.jpg",
  P010: "https://images.openfoodfacts.org/images/products/762/220/232/9494/front_en.12.400.jpg",
  P011: "https://images.openfoodfacts.org/images/products/762/220/227/1861/front_en.9.400.jpg",
  P012: "https://images.openfoodfacts.org/images/products/762/220/232/9494/front_en.12.400.jpg",
  P013: "https://images.openfoodfacts.org/images/products/762/220/232/9494/front_en.12.400.jpg",
  P014: "https://www.bbassets.com/media/uploads/p/l/40098555_16-cadbury-dairy-milk-crispello-chocolate-bar.jpg",
  
  // Bournville
  P015: "https://www.bbassets.com/media/uploads/p/l/263539_12-cadbury-bournville-rich-cocoa-dark-chocolate-bar.jpg",
  P016: "https://www.bbassets.com/media/uploads/p/l/263539_12-cadbury-bournville-rich-cocoa-dark-chocolate-bar.jpg",
  P017: "https://www.bbassets.com/media/uploads/p/l/40087494_12-cadbury-bournville-fruit-nut-dark-chocolate-bar.jpg",
  P018: "https://www.bbassets.com/media/uploads/p/l/40087495_13-cadbury-bournville-cranberry-dark-chocolate-bar.jpg",
  P019: "https://www.bbassets.com/media/uploads/p/l/40087495_13-cadbury-bournville-cranberry-dark-chocolate-bar.jpg",

  // 5 Star, Fuse, Perk, Amul, KitKat
  P020: "https://www.bbassets.com/media/uploads/p/l/100012484_20-cadbury-5-star-chocolate-bar.jpg",
  P021: "https://www.bbassets.com/media/uploads/p/l/40094767_15-cadbury-5-star-3d-chocolate-bar.jpg",
  P022: "https://www.bbassets.com/media/uploads/p/l/40200844_7-cadbury-5-star-oreo-chocolate-bar.jpg",
  P023: "https://www.bbassets.com/media/uploads/p/l/40094768_13-cadbury-fuse-chocolate-bar.jpg",
  P024: "https://www.bbassets.com/media/uploads/p/l/100012490_18-cadbury-perk-chocolate-bar.jpg",
  P025: "https://www.bbassets.com/media/uploads/p/l/100012484_20-cadbury-5-star-chocolate-bar.jpg",
  P026: "https://www.bbassets.com/media/uploads/p/l/40085437_10-amul-dark-chocolate.jpg",
  P027: "https://www.bbassets.com/media/uploads/p/l/40231599_2-nestle-kitkat-dessert-delight-choco-pudding.jpg",
  P028: "https://www.bbassets.com/media/uploads/p/l/40231600_2-nestle-kitkat-dessert-delight-rich-choco-fudge.jpg",
  P029: "https://www.bbassets.com/media/uploads/p/l/40231600_2-nestle-kitkat-dessert-delight-rich-choco-fudge.jpg",
  P030: "https://www.bbassets.com/media/uploads/p/l/40231599_2-nestle-kitkat-dessert-delight-choco-pudding.jpg",
  P031: "https://www.bbassets.com/media/uploads/p/l/40192806_8-nestle-kitkat-share-bag-pack.jpg",
  P032: "https://www.bbassets.com/media/uploads/p/l/100012502_20-nestle-kitkat-chocolate-bar.jpg",
  P033: "https://www.bbassets.com/media/uploads/p/l/100012502_20-nestle-kitkat-chocolate-bar.jpg",
  P034: "https://www.bbassets.com/media/uploads/p/l/100012502_20-nestle-kitkat-chocolate-bar.jpg",
  P035: "https://www.bbassets.com/media/uploads/p/l/40192806_8-nestle-kitkat-share-bag-pack.jpg",
  P036: "https://www.bbassets.com/media/uploads/p/l/100012503_18-nestle-munch-chocolate-bar.jpg",
  P037: "https://www.bbassets.com/media/uploads/p/l/40120538_10-nestle-munch-max-chocolate-bar.jpg",
  P038: "https://www.bbassets.com/media/uploads/p/l/100012500_18-nestle-milkybar-white-chocolate-bar.jpg",
  P039: "https://www.bbassets.com/media/uploads/p/l/100012500_18-nestle-milkybar-white-chocolate-bar.jpg",

  // Beverages
  P040: "https://www.bbassets.com/media/uploads/p/l/251014_14-diet-coke-soft-drink.jpg",
  P041: "https://www.bbassets.com/media/uploads/p/l/251023_13-coca-cola-soft-drink.jpg",
  P042: "https://www.bbassets.com/media/uploads/p/l/251042_11-sprite-soft-drink-lime-flavoured.jpg",
  P043: "https://www.bbassets.com/media/uploads/p/l/251034_12-thums-up-soft-drink.jpg",
  P044: "https://www.bbassets.com/media/uploads/p/l/251030_10-fanta-soft-drink-orange-flavoured.jpg",
  P045: "https://www.bbassets.com/media/uploads/p/l/265691_11-maaza-mango-drink.jpg",
  P046: "https://www.bbassets.com/media/uploads/p/l/265694_10-minute-maid-pulpy-orange-juice.jpg",
  P047: "https://www.bbassets.com/media/uploads/p/l/265698_10-kinley-club-soda.jpg",
  P048: "https://www.bbassets.com/media/uploads/p/l/265696_9-kinley-packaged-drinking-water.jpg",
  P049: "https://www.bbassets.com/media/uploads/p/l/40120540_10-monster-energy-drink.jpg",
  P050: "https://www.bbassets.com/media/uploads/p/l/40156950_8-monster-energy-ultra-zero-sugar.jpg",
  P051: "https://www.bbassets.com/media/uploads/p/l/265700_15-red-bull-energy-drink.jpg",
  P052: "https://www.bbassets.com/media/uploads/p/l/40182800_4-hell-energy-drink.jpg",
  P053: "https://www.bbassets.com/media/uploads/p/l/40182800_4-hell-energy-drink.jpg",
  P054: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
  P055: "https://www.bbassets.com/media/uploads/p/l/100000004_15-aquafina-packaged-drinking-water.jpg",
  P056: "https://www.bbassets.com/media/uploads/p/l/100000002_18-bisleri-packaged-drinking-water.jpg",
  P057: "https://www.bbassets.com/media/uploads/p/l/100000002_18-bisleri-packaged-drinking-water.jpg",

  // Dairy
  P058: "https://www.bbassets.com/media/uploads/p/l/100005470_19-amul-butter-pasteurised.jpg",
  P059: "https://www.bbassets.com/media/uploads/p/l/104758_10-amul-processed-cheese-block.jpg",
  P060: "https://www.bbassets.com/media/uploads/p/l/104764_11-amul-masti-dahi.jpg",
  P061: "https://www.bbassets.com/media/uploads/p/l/279586_12-amul-fresh-malai-paneer.jpg",
  P062: "https://www.bbassets.com/media/uploads/p/l/306926_4-amul-taaza-fresh-toned-milk.jpg",
  P063: "https://www.bbassets.com/media/uploads/p/l/104760_8-amul-shrikhand-kesar.jpg",
  P064: "https://www.bbassets.com/media/uploads/p/l/279585_10-amul-masti-buttermilk-spiced.jpg",
  P065: "https://www.bbassets.com/media/uploads/p/l/279586_12-amul-fresh-malai-paneer.jpg",

  // Ice Cream
  P066: "https://www.bbassets.com/media/uploads/p/l/40019280_10-amul-ice-cream-tricone-chocolate.jpg",
  P067: "https://www.bbassets.com/media/uploads/p/l/40019280_10-amul-ice-cream-tricone-chocolate.jpg",
  P068: "https://www.bbassets.com/media/uploads/p/l/40019281_10-amul-ice-cream-tricone-butterscotch.jpg",
  P069: "https://www.bbassets.com/media/uploads/p/l/40019280_10-amul-ice-cream-tricone-chocolate.jpg",
  P070: "https://www.bbassets.com/media/uploads/p/l/40019282_9-amul-frostik-chocolate-bar.jpg",
  P071: "https://www.bbassets.com/media/uploads/p/l/40019283_8-amul-chocobar-ice-cream.jpg",
  P072: "https://www.bbassets.com/media/uploads/p/l/40019284_9-amul-rajbhog-kulfi.jpg",
  P073: "https://www.bbassets.com/media/uploads/p/l/40019285_8-amul-pista-malai-kulfi.jpg",
  P074: "https://www.bbassets.com/media/uploads/p/l/40019285_8-amul-pista-malai-kulfi.jpg",

  // Harpic, Lizol, Vim, Colin
  P098: "https://www.bbassets.com/media/uploads/p/l/266946_17-harpic-power-plus-toilet-cleaner-original.jpg",
  P099: "https://www.bbassets.com/media/uploads/p/l/40003738_10-harpic-bathroom-cleaner-lemon.jpg",
  P100: "https://www.bbassets.com/media/uploads/p/l/40003738_10-harpic-bathroom-cleaner-lemon.jpg",
  P101: "https://www.bbassets.com/media/uploads/p/l/266952_18-lizol-disinfectant-floor-cleaner-citrus.jpg",
  P102: "https://www.bbassets.com/media/uploads/p/l/266951_18-lizol-disinfectant-floor-cleaner-floral.jpg",
  P103: "https://www.bbassets.com/media/uploads/p/l/266960_13-domex-fresh-guard-disinfectant-toilet-cleaner.jpg",
  P105: "https://www.bbassets.com/media/uploads/p/l/266970_19-vim-dishwash-gel-lemon.jpg",
  P106: "https://www.bbassets.com/media/uploads/p/l/266980_14-colin-glass-surface-cleaner.jpg",
  P122: "https://www.bbassets.com/media/uploads/p/l/266990_12-comfort-fabric-conditioner-morning-fresh.jpg",
  P123: "https://www.bbassets.com/media/uploads/p/l/266991_12-comfort-fabric-conditioner-lily-fresh.jpg",
  P124: "https://www.bbassets.com/media/uploads/p/l/266972_15-vim-dishwash-bar-lemon.jpg",

  // Personal Care & Shampoos
  P125: "https://www.bbassets.com/media/uploads/p/l/267000_15-dettol-liquid-handwash-refill-original.jpg",
  P126: "https://www.bbassets.com/media/uploads/p/l/267001_14-dettol-skincare-liquid-handwash.jpg",
  P127: "https://www.bbassets.com/media/uploads/p/l/267002_16-dettol-antiseptic-liquid.jpg",
  P128: "https://www.bbassets.com/media/uploads/p/l/267010_13-stayfree-secure-cottony-wings-sanitary-pads.jpg",
  P133: "https://www.bbassets.com/media/uploads/p/l/267020_14-whisper-choice-wings-sanitary-pads.jpg",
  P135: "https://www.bbassets.com/media/uploads/p/l/267022_15-whisper-ultra-clean-sanitary-pads.jpg",
  P137: "https://www.bbassets.com/media/uploads/p/l/267030_16-pampers-all-round-protection-diaper-pants.jpg",
  P138: "https://www.bbassets.com/media/uploads/p/l/40112800_8-godrej-aer-room-spray-fresh-lush-green.jpg",
  P139: "https://www.bbassets.com/media/uploads/p/l/267040_13-loreal-paris-fall-resist-3x-anti-hairfall-shampoo.jpg",
  P140: "https://www.bbassets.com/media/uploads/p/l/267042_11-loreal-paris-extraordinary-oil-shampoo.jpg",
  P141: "https://www.bbassets.com/media/uploads/p/l/267041_14-loreal-paris-total-repair-5-repairing-shampoo.jpg",
  P144: "https://www.bbassets.com/media/uploads/p/l/267050_15-dove-hair-fall-rescue-shampoo.jpg",
  P145: "https://www.bbassets.com/media/uploads/p/l/267051_14-dove-intense-repair-shampoo.jpg",
  P146: "https://www.bbassets.com/media/uploads/p/l/267060_13-tresemme-keratin-smooth-shampoo.jpg",
  P148: "https://www.bbassets.com/media/uploads/p/l/267070_15-head-shoulders-anti-dandruff-shampoo.jpg",
  P149: "https://www.bbassets.com/media/uploads/p/l/267080_14-sunsilk-black-shine-shampoo.jpg",
  P155: "https://www.bbassets.com/media/uploads/p/l/40130000_10-cetaphil-gentle-skin-cleanser.jpg",
  P156: "https://www.bbassets.com/media/uploads/p/l/40130001_9-cetaphil-daily-advance-ultra-hydrating-lotion.jpg",
  P157: "https://www.bbassets.com/media/uploads/p/l/40130002_9-cetaphil-moisturising-cream.jpg",
  P159: "https://www.bbassets.com/media/uploads/p/l/267100_12-moov-pain-relief-specialist-spray.jpg",
  P160: "https://www.bbassets.com/media/uploads/p/l/267110_13-livon-hair-serum-for-women.jpg",
  P164: "https://www.bbassets.com/media/uploads/p/l/267120_11-boroline-antiseptic-ayurvedic-cream.jpg",
  P167: "https://www.bbassets.com/media/uploads/p/l/267130_16-himalaya-purifying-neem-face-wash.jpg",
  P168: "https://www.bbassets.com/media/uploads/p/l/267140_15-vaseline-intensive-care-deep-moisture-body-lotion.jpg",
  P169: "https://www.bbassets.com/media/uploads/p/l/267150_14-clinic-plus-strong-long-health-shampoo.jpg",

  // Everest Spices
  P171: "https://www.bbassets.com/media/uploads/p/l/267200_14-everest-masala-chhole.jpg",
  P172: "https://www.bbassets.com/media/uploads/p/l/267201_14-everest-masala-sambhar.jpg",
  P173: "https://www.bbassets.com/media/uploads/p/l/267202_15-everest-masala-kitchen-king.jpg",
  P174: "https://www.bbassets.com/media/uploads/p/l/267203_14-everest-masala-pav-bhaji.jpg",
  P175: "https://images.openfoodfacts.org/images/products/890/178/641/1009/front_en.15.400.jpg",
  P176: "https://www.bbassets.com/media/uploads/p/l/267205_13-everest-masala-chaat.jpg",
  P177: "https://www.bbassets.com/media/uploads/p/l/267206_12-everest-dry-mango-powder-amchur.jpg",
  P178: "https://www.bbassets.com/media/uploads/p/l/267207_13-everest-cumin-powder-jeera.jpg",
  P179: "https://www.bbassets.com/media/uploads/p/l/267208_14-everest-chilli-powder-kashmiri-lal.jpg",
  P180: "https://www.bbassets.com/media/uploads/p/l/267209_13-everest-masala-chicken.jpg",
  P181: "https://www.bbassets.com/media/uploads/p/l/267210_13-everest-masala-meat.jpg",
  P182: "https://www.bbassets.com/media/uploads/p/l/267211_12-everest-shahi-biryani-masala.jpg",
  P183: "https://www.bbassets.com/media/uploads/p/l/267212_12-everest-shahi-paneer-masala.jpg",
  P184: "https://www.bbassets.com/media/uploads/p/l/267213_11-everest-pani-puri-masala.jpg",

  // Gits, Parachute, Oils, Colgate
  P192: "https://www.bbassets.com/media/uploads/p/l/267300_14-gits-instant-mix-gulab-jamun.jpg",
  P193: "https://www.bbassets.com/media/uploads/p/l/267301_13-gits-instant-mix-jalebi.jpg",
  P202: "https://www.bbassets.com/media/uploads/p/l/267305_11-gits-instant-mix-basundi.jpg",
  P203: "https://www.bbassets.com/media/uploads/p/l/267310_15-glucon-d-instant-energy-drink-regular.jpg",
  P204: "https://www.bbassets.com/media/uploads/p/l/267311_15-glucon-d-instant-energy-drink-tangy-orange.jpg",
  P205: "https://www.bbassets.com/media/uploads/p/l/267320_14-navratna-ayurvedic-cool-hair-oil.jpg",
  P208: "https://www.bbassets.com/media/uploads/p/l/267330_16-parachute-100-pure-coconut-hair-oil.jpg",
  P209: "https://www.bbassets.com/media/uploads/p/l/267331_14-parachute-advansed-aloe-vera-enriched-coconut-hair-oil.jpg",
  P212: "https://www.bbassets.com/media/uploads/p/l/126906_10-aashirvaad-sharbati-atta-100-mp-chakki-atta.jpg",
  P213: "https://www.bbassets.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg",
  P214: "https://www.bbassets.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg",
  P223: "https://www.bbassets.com/media/uploads/p/l/267350_14-dabur-amla-hair-oil.jpg",
  P225: "https://www.bbassets.com/media/uploads/p/l/267360_16-colgate-strong-teeth-anticavity-toothpaste-with-amino-shakti.jpg",
  P226: "https://www.bbassets.com/media/uploads/p/l/267361_15-colgate-herbal-toothpaste-with-neem-eucalyptus-chamomile.jpg",
  P227: "https://www.bbassets.com/media/uploads/p/l/267362_12-colgate-cibaca-anti-cavity-toothpaste.jpg",
  P229: "https://www.bbassets.com/media/uploads/p/l/265700_15-red-bull-energy-drink.jpg"
};

// Assemble all 229 full products
const allProducts = rawItems.map((item, index) => {
  const specificImg = specificImageMap[item.id];
  const catImgs = categoryImages[item.cat] || categoryImages.Grocery;
  const fallbackImg = catImgs[index % catImgs.length];

  const images = specificImg ? [specificImg, fallbackImg] : [fallbackImg];

  const desc = [
    `100% Genuine & Authentic ${item.name}`,
    `Category: ${item.sub || item.cat} | Code: ${item.id}`,
    "Fast express grocery delivery to your doorstep in 30 minutes"
  ];

  const hexId = "65f" + (index + 1).toString(16).padStart(21, '0');

  return {
    _id: hexId,
    code: item.id,
    name: item.name,
    category: item.cat,
    subCategory: item.sub,
    price: item.price,
    offerPrice: item.offer,
    image: images,
    description: desc,
    inStock: true,
    purchaseCount: Math.floor(Math.random() * 80) + 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

console.log(`Generated ${allProducts.length} full product entries!`);
fs.writeFileSync('data/products229.json', JSON.stringify(allProducts, null, 2));

// Complete expanded categories
const fullCategories = [
  {
    text: "Chocolates & Sweets",
    name: "Chocolates & Sweets",
    path: "Chocolates",
    image: "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FDF2F8",
    description: "Premium Cadbury Silk, dark chocolates, wafers & sweets"
  },
  {
    text: "Cold Drinks & Sodas",
    name: "Cold Drinks & Sodas",
    path: "Drinks",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400",
    bgColor: "#F0F5DE",
    description: "Chilled soft drinks, juices, energy drinks & mineral waters"
  },
  {
    text: "Dairy Products",
    name: "Dairy Products",
    path: "Dairy",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEE6CD",
    description: "Farm-fresh milk, butter, cheese blocks, paneer & curd"
  },
  {
    text: "Ice Creams & Frozen",
    name: "Ice Creams & Frozen",
    path: "Ice Cream",
    image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=400",
    bgColor: "#EFF6FF",
    description: "Amul TriCones, chocobars, kulfis, sundaes & tubs"
  },
  {
    text: "Cleaning & Household",
    name: "Cleaning & Household",
    path: "Cleaning",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=400",
    bgColor: "#F0FDF4",
    description: "Harpic, Lizol, Vim dishwash, Domex & Colin cleaners"
  },
  {
    text: "Personal & Hair Care",
    name: "Personal & Hair Care",
    path: "Personal Care",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FAF5FF",
    description: "Shampoos, conditioners, hair colours, body washes & skincare"
  },
  {
    text: "Spices, Masalas & Pantry",
    name: "Spices, Masalas & Pantry",
    path: "Spices",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEF3C7",
    description: "Everest blended masalas, achar spices, pure flours & honey"
  },
  {
    text: "Groceries & Cooking Oils",
    name: "Groceries & Cooking Oils",
    path: "Grocery",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FFF7ED",
    description: "Refined cooking oils, whole wheat atta, grains & crunchy snacks"
  },
  {
    text: "Instant Food & Desserts",
    name: "Instant Food & Desserts",
    path: "Instant",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=400",
    bgColor: "#E1F5EC",
    description: "Gits dessert mixes, gulab jamun, quick snacks & ready meals"
  },
  {
    text: "Electrical & Lights",
    name: "Electrical & Lights",
    path: "Electrical",
    image: "https://images.unsplash.com/photo-1550524514-4b533f81e3a9?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEF9C3",
    description: "Wipro LED bulbs, emergency lights, festive string lights & candles"
  },
  {
    text: "Organic Veggies",
    name: "Organic Veggies",
    path: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEF6DA",
    description: "Farm-fresh organic leafy vegetables and greens"
  },
  {
    text: "Fresh Fruits",
    name: "Fresh Fruits",
    path: "Fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEE0E0",
    description: "Sweet, juicy seasonal and imported fresh fruits"
  },
  {
    text: "Bakery & Breads",
    name: "Bakery & Breads",
    path: "Bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    bgColor: "#E0F6FE",
    description: "Whole wheat breads, morning muffins, and fresh buns"
  }
];

fs.writeFileSync('data/fullCategories.json', JSON.stringify(fullCategories, null, 2));
console.log('Saved data/fullCategories.json with', fullCategories.length, 'categories');
