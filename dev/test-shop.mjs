/* ── SHOP BEHAVIOUR TESTS ──
 *
 *   ./dev/test-shop.sh
 *
 * Drives the real pages in a headless browser against a fixture catalog,
 * and locks in the things that were quietly broken before the shop was
 * wired to Square properly:
 *
 *   - a product with options cannot reach the bag without one chosen,
 *     from the grid OR the homepage (it used to add at the bottom of its
 *     price range with no colourway)
 *   - the displayed price is the chosen variation's price from Square
 *     (it used to never change, because the local copy had no prices)
 *   - a broken live API shows an empty shop, never stale snapshot prices
 *   - with no data source at all the shop says so instead of rendering
 *     hardcoded cards that cannot actually be bought
 *
 * The fixture below is SHAPE, not copy — invented names and prices whose
 * only job is to be recognisably not Lauren's. Real product data comes
 * from Square and lives nowhere in this repo except products.json, which
 * ./dev/snapshot.sh writes.
 */
/* dev/test-shop.sh asks for the fixture, writes it beside a copy of the
   site, and then runs this file again to drive it. One definition, used
   by both halves. */
if (process.argv.includes('--emit-fixture')) {
  const v = (id, name, cents, avail = true, tracked = true) =>
    ({ id, name, priceCents: cents, tracked, quantity: avail ? 3 : 0, available: avail && tracked });
  console.log(JSON.stringify({
    source: 'snapshot', generatedAt: '2026-09-01T18:00:00.000Z', squareEnv: 'fixture',
    products: [
      { id: 'P1', name: 'Whimsy Quilt Tote Bag', description: 'Fixture copy, not Lauren\u2019s.',
        details: [{ name: 'Materials', value: 'Fixture' }], featured: true,
        images: ['images/a.jpg', 'images/b.jpg'], category: 'Bags',
        variations: [v('V1', null, 5500)], requiresChoice: false,
        priceFromCents: 5500, priceToCents: 5500, compareAtCents: null, soldOut: false, untracked: false },
      { id: 'P2', name: 'Handmade Scrunchies', description: 'Fixture copy, not Lauren\u2019s.',
        details: [{ name: 'Dimensions', value: 'Fixture' }], featured: true,
        images: ['images/s1.jpg', 'images/s2.jpg', 'images/s3.jpg'], category: 'Scrunchies',
        variations: [v('V10','Red Gingham',900), v('V11','Red Gingham with Lace',1400),
                     v('V12','Blue Plaid',900,false), v('V13','Blue Plaid with Lace',1400,false),
                     v('V14','Cloud Print',1200)],
        requiresChoice: true, priceFromCents: 900, priceToCents: 1400,
        compareAtCents: null, soldOut: false, untracked: false },
      { id: 'P3', name: 'Upcycled Lace Tablecloth Market Bags', description: 'Fixture copy.',
        details: [], featured: false, images: ['images/l1.jpg'], category: 'Bags',
        variations: [v('V20', null, 4800, false)], requiresChoice: false,
        priceFromCents: 4800, priceToCents: 4800, compareAtCents: null, soldOut: true, untracked: false },
      { id: 'P4', name: 'Vintage Toyota Workwear Jacket', description: 'Fixture copy.',
        details: [{ name: 'Size', value: 'L' }], featured: true, images: ['images/j1.jpg'], category: 'Clothing',
        variations: [v('V30', null, 7200, true, false)], requiresChoice: false,
        priceFromCents: 7200, priceToCents: 7200, compareAtCents: null, soldOut: false, untracked: true }
    ],
    meta: { totalInCatalog: 65, shown: 4, featured: 3, filter: 'ecom_visibility=VISIBLE' }
  }, null, 2));
  process.exit(0);
}
const { chromium } = await import('playwright');
const B = process.env.TEST_BASE || 'http://127.0.0.1:8899';
let pass = 0, fail = 0;
const ok  = (n, c, extra='') => { c ? (pass++, console.log('  PASS  ' + n)) : (fail++, console.log('  FAIL  ' + n + (extra ? '  → ' + extra : ''))); };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function page(route) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  /* Uncaught JS exceptions only. Missing images and the blocked font CDN
     are environment noise in this sandbox, not defects in the shop. */
  /* Uncaught JS exceptions only. Missing images, the blocked font CDN and
     Leaflet (the homepage map, loaded from unpkg) are environment noise
     when this runs offline, not defects in the shop. */
  p.on('pageerror', e => { if (!/\bL is not defined\b/.test(String(e))) errors.push(String(e)); });
  if (route) await p.route('**/products.json', route);
  await p.route('**/api/products', r => r.fulfill({ status: 404, body: 'not found' }));
  return p;
}
let errors = [];
const cart = p => p.evaluate(() => JSON.parse(localStorage.getItem('of-cart') || '[]'));

/* ─────────── 1. the shop grid, from a snapshot ─────────── */
console.log('\n1. Shop grid renders from the catalog');
errors = [];
let p = await page();
await p.goto(B + '/shop.html');
await p.waitForFunction(() => document.querySelectorAll('.shop-grid .product-card').length > 1);

const cards = await p.evaluate(() => [...document.querySelectorAll('.shop-grid .product-card')].map(c => ({
  pid: c.dataset.pid || null, cat: c.dataset.cat,
  name: c.querySelector('.product-name').textContent,
  price: c.querySelector('.product-price').textContent,
  btn: c.querySelector('.add-to-bag').textContent,
  disabled: c.querySelector('.add-to-bag').disabled
})));
const by = n => cards.find(c => c.name === n);

ok('source is the committed snapshot', await p.evaluate(() => window.OFCatalog.state().source) === 'snapshot');
ok('preview is labelled as not live', /Preview of the shop as it stood on/.test(await p.evaluate(() => (document.querySelector('.shop-api-notice')||{}).textContent || '')));
ok('every card carries a Square product id', cards.filter(c=>c.name!=='Digital Gift Card').every(c => c.pid), JSON.stringify(cards.map(c=>c.pid)));
ok('scrunchie price shows the real range, not "From $9"', by('Handmade Scrunchies').price === '$9–$14', by('Handmade Scrunchies').price);
ok('single-price product shows Square\'s price', by('Whimsy Quilt Tote Bag').price === '$55', by('Whimsy Quilt Tote Bag').price);
ok('sold-out product button is disabled', by('Upcycled Lace Tablecloth Market Bags').disabled);
ok('untracked product reads Unavailable', by('Vintage Toyota Workwear Jacket').btn === 'Unavailable', by('Vintage Toyota Workwear Jacket').btn);

const filters = await p.evaluate(() => [...document.querySelectorAll('.filter-btn')].map(b => b.textContent));
ok('filters derive from Square categories', JSON.stringify(filters) === JSON.stringify(['Everything','Bags','Clothing','Gifts','Scrunchies']), JSON.stringify(filters));
ok('no stale "On Sale" filter', !filters.includes('On Sale'));

/* ─────────── 2. THE BUG: no unselected scrunchie in the bag ─────────── */
console.log('\n2. A product with options cannot be added without choosing one');
ok('grid button says Choose an Option', by('Handmade Scrunchies').btn === 'Choose an Option', by('Handmade Scrunchies').btn);
await p.click('.product-card[data-pid="P2"] .add-to-bag');
await p.waitForTimeout(400);
ok('clicking it adds NOTHING to the bag', (await cart(p)).length === 0, JSON.stringify(await cart(p)));
ok('it opens the picker instead', await p.evaluate(() => document.querySelector('.pd-modal').classList.contains('open')));
ok('Add to Bag is disabled until a choice is made', await p.evaluate(() => document.querySelector('.pd-add').disabled));
ok('and it says so', await p.evaluate(() => document.querySelector('.pd-add').textContent) === 'Select an option');

/* ─────────── 3. THE BUG: price tracks the chosen option ─────────── */
console.log('\n3. Price follows the selected variant');
ok('opens showing the range', await p.evaluate(() => document.querySelector('.pd-price').textContent) === '$9–$14', await p.evaluate(() => document.querySelector('.pd-price').textContent));
const chips = await p.evaluate(() => [...document.querySelectorAll('.pd-opt')].map(b => ({ t: b.textContent, d: b.disabled })));
ok('each option shows its own price', chips[1].t.includes('$14') && chips[0].t.includes('$9'), JSON.stringify(chips.map(c=>c.t)));
ok('sold-out options are unclickable but visible', chips[2].d && chips[3].d && chips.length === 5);

await p.click('.pd-opt[data-vid="V11"]');
await p.waitForTimeout(200);
ok('picking "Red Gingham with Lace" moves the price to $14', await p.evaluate(() => document.querySelector('.pd-price').textContent) === '$14', await p.evaluate(() => document.querySelector('.pd-price').textContent));
await p.click('.pd-opt[data-vid="V14"]');
await p.waitForTimeout(200);
ok('picking "Cloud Print" moves it to $12', await p.evaluate(() => document.querySelector('.pd-price').textContent) === '$12', await p.evaluate(() => document.querySelector('.pd-price').textContent));

await p.click('.pd-add');
await p.waitForTimeout(300);
const c1 = await cart(p);
ok('the bag line names the chosen option', c1[0] && c1[0].name === 'Handmade Scrunchies — Cloud Print', JSON.stringify(c1));
ok('it is charged Square\'s price for THAT option ($12)', c1[0] && c1[0].price === 12, JSON.stringify(c1));
ok('it carries the Square variation id for checkout', c1[0] && c1[0].variationId === 'V14');
ok('and the product id', c1[0] && c1[0].productId === 'P2');

/* ─────────── 4. ordinary product ─────────── */
console.log('\n4. A product with no choice to make still adds in one click');
await p.evaluate(() => localStorage.removeItem('of-cart'));
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
await p.click('.product-card[data-pid="P1"] .add-to-bag');
await p.waitForTimeout(300);
const c2 = await cart(p);
ok('adds at $55 with its variation id', c2[0] && c2[0].price === 55 && c2[0].variationId === 'V1', JSON.stringify(c2));

console.log('\n5. Console stayed clean');
ok('no uncaught JS exceptions during all of the above', errors.length === 0, errors.join(' | '));
await p.context().close();

/* ─────────── 6. no data at all ─────────── */
console.log('\n6. With no API and no snapshot, the shop is empty and says so');
errors = [];
p = await page(r => r.fulfill({ status: 404, body: 'nope' }));
await p.goto(B + '/shop.html');
await p.waitForTimeout(700);
ok('renders zero product cards', await p.evaluate(() => document.querySelectorAll('.shop-grid .product-card[data-pid]').length) === 0);
ok('tells the visitor rather than showing nothing', /isn’t connected to any inventory/.test(await p.evaluate(() => (document.querySelector('.shop-api-notice')||{}).textContent||'')));
await p.context().close();

/* ─────────── 7. live API broken → no silent stale fallback ─────────── */
console.log('\n7. A broken live API does NOT fall back to stale snapshot prices');
let snapshotWasFetched = false;
const ctx = await browser.newContext();
p = await ctx.newPage();
p.on('pageerror', e => errors.push(String(e)));
await p.route('**/api/products', r => r.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"Square 401"}' }));
await p.route('**/products.json', r => { snapshotWasFetched = true; r.continue(); });
await p.goto(B + '/shop.html');
await p.waitForTimeout(700);
ok('the snapshot is never fetched', !snapshotWasFetched);
ok('the shop is empty, not stale', await p.evaluate(() => document.querySelectorAll('.shop-grid .product-card[data-pid]').length) === 0);
ok('and it says inventory is unreachable', /can’t reach our inventory/.test(await p.evaluate(() => (document.querySelector('.shop-api-notice')||{}).textContent||'')));
await ctx.close();

/* ─────────── 8. homepage ─────────── */
console.log('\n8. Homepage featured comes from Square\'s Featured toggle');
errors = [];
p = await page();
await p.goto(B + '/index.html');
await p.waitForFunction(() => document.querySelectorAll('#featured-grid .product-card').length > 0);
const feat = await p.evaluate(() => [...document.querySelectorAll('#featured-grid .product-card')].map(c => ({
  name: c.querySelector('.product-name').textContent, btn: c.querySelector('.add-to-bag').textContent, pid: c.dataset.pid })));
ok('shows only the toggled items', feat.length === 3 && !feat.some(f => f.name.includes('Lace Tablecloth')), JSON.stringify(feat.map(f=>f.name)));
ok('homepage cards carry product ids too', feat.every(f => f.pid));
ok('scrunchies on the HOMEPAGE also refuse a blind add', feat.find(f => f.name === 'Handmade Scrunchies').btn === 'Choose an Option');
await p.evaluate(() => localStorage.removeItem('of-cart'));
await p.click('#featured-grid .product-card[data-pid="P2"] .add-to-bag');
await p.waitForTimeout(400);
ok('and adding nothing to the bag from there either', (await cart(p)).length === 0, JSON.stringify(await cart(p)));
ok('no uncaught JS exceptions on the homepage', errors.length === 0, errors.join(' | '));
await p.context().close();

await browser.close();
console.log(`\n${'─'.repeat(50)}\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
