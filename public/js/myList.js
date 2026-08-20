async function postJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body, e.g. 204 */ }
  if (!res.ok) {
    const message = (data && data.error) || 'משהו השתבש, נסו שוב';
    throw new Error(message);
  }
  return data;
}

const addForm = document.getElementById('add-item-form');
if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('add-item-error');
    errorBox.style.display = 'none';
    const formData = new FormData(addForm);
    try {
      await postJson('/api/items', 'POST', {
        productName: formData.get('productName'),
        quantity: formData.get('quantity'),
        notes: formData.get('notes'),
      });
      window.location.reload();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });
}

document.querySelectorAll('.edit-item-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticket = form.closest('.ticket');
    const itemId = ticket.dataset.itemId;
    const errorBox = form.querySelector('.item-error');
    errorBox.style.display = 'none';
    const formData = new FormData(form);
    try {
      await postJson(`/api/items/${itemId}`, 'PUT', {
        productName: formData.get('productName'),
        quantity: formData.get('quantity'),
        notes: formData.get('notes'),
      });
      window.location.reload();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });

  const deleteBtn = form.querySelector('.delete-item-btn');
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('למחוק את הפריט הזה?')) return;
    const ticket = form.closest('.ticket');
    const itemId = ticket.dataset.itemId;
    try {
      await postJson(`/api/items/${itemId}`, 'DELETE');
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  });
});
