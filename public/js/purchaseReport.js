document.querySelectorAll('.toggle').forEach((toggle) => {
  const boughtBtn = toggle.querySelector('.bought-btn');
  const notBoughtBtn = toggle.querySelector('.not-bought-btn');

  const setBought = (bought) => {
    toggle.dataset.bought = bought ? 'true' : 'false';
    boughtBtn.classList.toggle('active', bought);
    boughtBtn.classList.toggle('bought', bought);
    notBoughtBtn.classList.toggle('active', !bought);
  };

  boughtBtn.addEventListener('click', () => setBought(true));
  notBoughtBtn.addEventListener('click', () => setBought(false));
});

const submitBtn = document.getElementById('submit-report-btn');
if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    if (!confirm('פעולה זו תסגור את המחזור הנוכחי ותפתח רשימות חדשות לכולם. להמשיך?')) return;

    const items = Array.from(document.querySelectorAll('.checklist-row')).map((row) => {
      const toggle = row.querySelector('.toggle');
      const noteInput = row.querySelector('.note-input');
      return {
        mainListItemId: Number(row.dataset.mainListItemId),
        bought: toggle ? toggle.dataset.bought === 'true' : false,
        note: noteInput ? noteInput.value.trim() : '',
      };
    });

    const errorBox = document.getElementById('report-error');
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    try {
      const res = await fetch('/api/purchase-report/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'משהו השתבש, נסו שוב');
      window.location.href = data.redirect;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
    }
  });
}
