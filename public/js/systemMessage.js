(function () {
  const modal = document.getElementById('system-message-modal');
  if (!modal) return;

  const textBox = document.getElementById('system-message-modal-text');
  const ackBtn = document.getElementById('system-message-ack-btn');
  let currentMessageId = null;

  async function checkForUnseenMessage() {
    try {
      const res = await fetch('/api/system-message/unseen');
      if (!res.ok) return;
      const { message } = await res.json();
      if (!message) return;

      currentMessageId = message.id;
      textBox.textContent = message.text;
      modal.style.display = 'flex';
    } catch (err) {
      // Non-critical -- if this fails the user simply won't see the popup this load.
    }
  }

  ackBtn.addEventListener('click', async () => {
    modal.style.display = 'none';
    if (currentMessageId == null) return;

    const messageId = currentMessageId;
    currentMessageId = null;
    try {
      await fetch('/api/system-message/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId }),
      });
    } catch (err) {
      // Non-critical -- worst case the same message pops up again next load.
    }
  });

  checkForUnseenMessage();
})();
