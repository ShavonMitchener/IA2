//Catalog
const products = {
  "Tyres": [
    { name: "Front Tyres", price: 110, img: "Images/tyre.png" },
    { name: "Rear Tyres",  price: 100, img: "Images/tyre.png" }
  ],
  "Fluids": [
    { name: "Engine Oil",           price: 70, img: "Images/oil.png" },
    { name: "Coolant",              price: 40, img: "Images/coolant.png" },
    { name: "Power Steering Fluid", price: 35, img: "Images/steeringfluid.jpg" },
    { name: "Windscreen Washer",    price: 35, img: "Images/washer.jpeg" },
    { name: "Brake cleaner",        price: 35, img: "Images/brakecleaner.jpg" }
  ],
  "Brakes": [
    { name: "Front Brake Pads", price: 85,  img: "Images/fdiscpad.png" },
    { name: "Rear Brake Pads",  price: 75,  img: "Images/bdiscpad.png" },
    { name: "Brake Rotor",      price: 100, img: "Images/rotor.png" }
  ],
  "Electrical": [
    { name: "Car Battery",             price: 160, img: "Images/battery.jpg" },
    { name: "Spark Plugs (Set of 4)",  price: 60,  img: "Images/sparkplug.jpg" }
  ],
  "Filters": [
    { name: "Oil Filter",   price: 160, img: "Images/oilfilter.webp" },
    { name: "Cabin Filter", price: 60,  img: "Images/cabinfilter.png" },
    { name: "Air Filter",   price: 45,  img: "Images/airfilter.png" }
  ]
};

const read  = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function getCart()  { return read('cart', []); }
function saveCart(c){ write('cart', c); }

function getUser()     { return read('user', { loggedIn:false, name:'Guest' }); }
function getPoints()   { return read('points', 0); }
function setPoints(v)  { write('points', v); }
function hasOrdered()  { return read('hasOrdered', false); }
function setHasOrdered(v){ write('hasOrdered', v); }

const money = n => `$${n.toFixed(2)}`;
const brokerFee = 5;
const FIRST_DISCOUNT = 0.10;   // 10% first purchase if logged in
const PT_VALUE       = 0.10;   // 1 point = $0.10
const EARN_RATE      = 0.1;    // earn points: subtotal * 0.1

// Shop Page

function renderShop(){
  const root = document.getElementById('shop-root');
  if (!root) return;

  const pill = document.getElementById('points-pill');
  if (pill) pill.textContent = `${getPoints()} pts`;
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.textContent = `Welcome, ${getUser().name}`;

  const cart = getCart();

  Object.entries(products).forEach(([cat, items])=>{
    const section = document.createElement('section');
    section.className = 'shop-cat';
    section.innerHTML = `<h3>${cat}</h3><div class="shop-grid"></div>`;
    const grid = section.querySelector('.shop-grid');

    items.forEach((p)=>{
      const card = document.createElement('article');
      card.className = 'product';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}">
        <div class="pbody">
          <div class="pname">${p.name}</div>
          <div class="pprice">${money(p.price)}</div>
        </div>
      `;

      if (cart.find(x => x.name === p.name)) card.classList.add('sel');

      card.addEventListener('click', ()=>{
        const c = getCart();
        const i = c.findIndex(x => x.name === p.name);
        const nowSelected = !card.classList.contains('sel');

        if (nowSelected) {
          card.classList.add('sel');
          if (i === -1) c.push({ name:p.name, price:p.price, img:p.img, qty:1 });
        } else {
          card.classList.remove('sel');
          if (i !== -1) c.splice(i,1);
        }
        saveCart(c);
      });

      grid.appendChild(card);
    });

    root.appendChild(section);
  });
}

// Cart Page

function renderCart(){
  const body = document.getElementById('cart-body');
  if (!body) return;

  const pill = document.getElementById('points-pill');
  if (pill) pill.textContent = `${getPoints()} pts`;
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.textContent = `Welcome, ${getUser().name}`;

  const empty  = document.getElementById('cart-empty');
  const filled = document.getElementById('cart-filled');

  const cart = getCart();
  body.innerHTML = '';

  if (cart.length === 0){
    empty.style.display = '';
    filled.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  filled.style.display = '';

  let sub = 0;
  cart.forEach((row,i)=>{
    const line = row.price * row.qty;
    sub += line;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${row.img}" alt="" style="width:56px;height:42px;object-fit:contain"></td>
      <td>${row.name}</td>
      <td class="right">${money(row.price)}</td>
      <td><input type="number" min="1" value="${row.qty}" style="width:64px" aria-label="quantity"></td>
      <td class="right">${money(line)}</td>
      <td><button class="btn small secondary">Remove</button></td>
    `;

    const qtyInput = tr.querySelector('input');
    qtyInput.addEventListener('change', ()=>{
      const v = Math.max(1, parseInt(qtyInput.value||'1',10));
      cart[i].qty = v;
      saveCart(cart);
      renderCart();
    });

    tr.querySelector('button').addEventListener('click', ()=>{
      cart.splice(i,1);
      saveCart(cart);
      renderCart();
    });

    body.appendChild(tr);
  });

  document.getElementById('cart-sub').textContent = money(sub);

  const toCheckout = document.getElementById('to-checkout');
  if (toCheckout) toCheckout.addEventListener('click', ()=> location.href='checkout.html');
}

// Checkout page

function renderCheckout(){
  const list = document.getElementById('co-items');
  if (!list) return;

  const navPts = document.getElementById('nav-points');
  if (navPts) navPts.textContent = `${getPoints()} pts`;

  const user = getUser();
  const cart = getCart();

  if (cart.length === 0){
    list.innerHTML = `<li class="note">Your cart is empty. Visit the shop first.</li>`;
  } else {
    list.innerHTML = '';
  }

  // Lines & subtotal
  let sub = 0;
  cart.forEach(it=>{
    const line = it.price * it.qty;
    sub += line;
    const li = document.createElement('li');
    li.innerHTML = `<span>${it.name} × ${it.qty}</span><strong>${money(line)}</strong>`;
    list.appendChild(li);
  });

  // Discounts & points
  const firstEligible = user.loggedIn && !hasOrdered();
  const firstDisc = firstEligible ? sub * FIRST_DISCOUNT : 0;

  const ptsHave  = user.loggedIn ? getPoints() : 0;
  const ptsValue = ptsHave * PT_VALUE;

  const rowPts = document.getElementById('row-points');
  if (rowPts) rowPts.style.display = user.loggedIn ? '' : 'none';
  const ptsHaveSpan = document.getElementById('pts-have');
  if (ptsHaveSpan) ptsHaveSpan.textContent = `${ptsHave} pts (${money(ptsValue)})`;

  document.getElementById('sum-sub').textContent    = money(sub);
  document.getElementById('sum-broker').textContent = money(brokerFee);
  document.getElementById('sum-first').textContent  = `-${money(firstDisc)}`;

  const usePts   = document.getElementById('use-points');
  const sumPts   = document.getElementById('sum-pts');
  const sumTotal = document.getElementById('sum-total');
  const note     = document.getElementById('co-note');

  const recompute = ()=>{
    const pointsUsed = (usePts && usePts.checked)
      ? Math.min(ptsValue, Math.max(0, sub - firstDisc + brokerFee))
      : 0;

    if (sumPts) sumPts.textContent = `-${money(pointsUsed)}`;
    const total = Math.max(0, sub - firstDisc - pointsUsed + brokerFee);
    sumTotal.textContent = money(total);

    if (!user.loggedIn){
      note.textContent = "Only registered customers receive the first-purchase discount and can earn/use loyalty points.";
    } else if (!firstEligible){
      note.textContent = "You can earn and use loyalty points. First-purchase 10% discount applies to your first order only.";
    } else {
      note.textContent = "10% first-purchase discount applied. You can also choose to use your loyalty points.";
    }
    return { total, pointsUsed };
  };

  if (usePts) usePts.addEventListener('change', recompute);
  let totals = recompute();

  document.getElementById('place-order').addEventListener('click', ()=>{
    if (cart.length === 0){ alert('Your cart is empty.'); return; }

    totals = recompute();
    const { total, pointsUsed } = totals;

    // Earn points 
    let earn = 0;
    if (user.loggedIn){
      earn = Math.floor(sub * EARN_RATE);
      const remaining = Math.max(0, getPoints() - Math.round(pointsUsed / PT_VALUE));
      setPoints(remaining + earn);
    }
    if (user.loggedIn && !hasOrdered()) setHasOrdered(true);

    const orders = read('orders', []);
    const order = {
      id: Date.now(),
      items: cart,
      sub, firstDisc, brokerFee, pointsUsed, total,
      name: document.getElementById('co-name').value || getUser().name || 'Guest',
      phone: document.getElementById('co-phone').value || '',
      carModel: document.getElementById('co-model').value || '',
      carYear: document.getElementById('co-year').value || '',
      earned: earn,
      date: new Date().toLocaleString()
    };
    orders.push(order);
    write('orders', orders);

    saveCart([]);

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Receipt #${order.id}</title>
      <style>
        body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:24px}
        h2{margin:0 0 10px}
        .row{display:flex;justify-content:space-between}
        .box{border:1px solid #ddd;border-radius:10px;padding:12px;margin:10px 0}
        ul{list-style:none;margin:0;padding:0}
        li{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:6px 0}
        .total strong{font-size:18px}
      </style></head><body>
      <h2>AutoParts Pro — Receipt</h2>
      <div class="box">
        <div class="row"><div><strong>Name:</strong> ${order.name}</div><div><strong>Date:</strong> ${order.date}</div></div>
        <div class="row"><div><strong>Phone:</strong> ${order.phone||'-'}</div><div><strong>Car:</strong> ${order.carModel||'-'} ${order.carYear||''}</div></div>
      </div>
      <div class="box"><ul>
        ${order.items.map(i=>`<li><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></li>`).join('')}
      </ul></div>
      <div class="box">
        <div class="row"><span>Subtotal</span><strong>${money(order.sub)}</strong></div>
        <div class="row"><span>First Purchase Discount</span><strong>-${money(order.firstDisc)}</strong></div>
        <div class="row"><span>Points Discount</span><strong>-${money(order.pointsUsed)}</strong></div>
        <div class="row"><span>Broker Fee</span><strong>${money(order.brokerFee)}</strong></div>
        <hr/>
        <div class="row total"><span>Total Paid</span><strong>${money(order.total)}</strong></div>
        <div class="row"><span>Points Earned</span><strong>${order.earned} pts</strong></div>
      </div>
      <button onclick="window.print()">Print</button>
      </body></html>
    `);
    win.document.close();

    location.href = 'index.html';
  });
}

(function init(){
  const page = document.body.getAttribute('data-page');

  const pill = document.getElementById('points-pill') || document.querySelector('.points');
  if (pill) pill.textContent = `${getPoints()} pts`;

  if (page === 'shop')     renderShop();
  if (page === 'cart')     renderCart();
  if (page === 'checkout') renderCheckout();
})();
