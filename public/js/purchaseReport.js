const submitBtn = document.getElementById('submit-report-btn');
if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    if (!confirm('פעולה זו תסגור את המחזור הנוכחי ותפתח רשימות חדשות לכולם. להמשיך?')) return;

    const items = Array.from(document.querySelectorAll('.checklist-row')).map((row) => {
      const checkbox = row.querySelector('.bought-checkbox');
      const noteInput = row.querySelector('.note-input');
      return {
        mainListItemId: Number(row.dataset.mainListItemId),
        bought: checkbox ? checkbox.checked : false,
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
