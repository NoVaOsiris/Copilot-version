// cashier.js
const app = document.getElementById('cashier-app');
app.innerHTML = `
  <div class="product-list">
    ${PRODUCTS.map(p => `
      <button data-id="${p.id}" class="prod-btn">
        ${p.name}<br>${p.price}₽
      </button>`).join('')}
  </div>
  <div id="receipt">
    <h3>Чек</h3><ul id="items"></ul><p id="sum">Итог: 0₽</p>
    <button id="pay">Оплатить</button>
  </div>
`;
let items = [], sum = 0;
document.querySelectorAll('.prod-btn').forEach(btn => {
    btn.onclick = () => {
        const id = btn.dataset.id | 0;
        const prod = PRODUCTS.find(p => p.id === id);
        items.push(prod);
        sum += prod.price;
        render();
    };
});
function render() {
    document.getElementById('items').innerHTML =
        items.map((i, idx) => `<li>${i.name} — ${i.price}₽</li>`).join('');
    document.getElementById('sum').innerText = `Итог: ${sum}₽`;
}
document.getElementById('pay').onclick = () => {
    if (!items.length) return;
    // Отправляем каждую продажу
    Promise.all(items.map(i =>
        fetch('/sale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `product_id=${i.id}&quantity=1`
        }).then(r => r.json())
    )).then(() => { items = []; sum = 0; render(); alert('Продажа зарегистрирована'); });
};