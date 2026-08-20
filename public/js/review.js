async function postJson(url) {
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'משהו השתבש, נסו שוב');
  return data;
}

document.querySelectorAll('.ticket').forEach((ticket) => {
  const itemId = ticket.dataset.itemId;
  const errorBox = ticket.querySelector('.review-error');
  const approveBtn = ticket.querySelector('.approve-btn');
  const rejectBtn = ticket.querySelector('.reject-btn');

  const handle = async (action) => {
    errorBox.style.display = 'none';
    try {
      await postJson(`/api/items/${itemId}/${action}`);
      window.location.reload();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  };

  if (approveBtn) approveBtn.addEventListener('click', () => handle('approve'));
  if (rejectBtn) rejectBtn.addEventListener('click', () => handle('reject'));
});
