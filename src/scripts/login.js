// Login logic — checks the licence certificate number against the database.
// On success, stores pharmacyID in localStorage and redirects to pharmacy.html.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#login form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const certificate = document.getElementById('certificate')?.value?.trim();
    if (!certificate) {
      alert(t('alert_enter_certificate'));
      return;
    }

    try {
      const res = await fetch('/login_pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate })
      });
      if (!res.ok) {
        const errorResponse = await res.json().catch(() => ({}));
        const message = errorResponse.detail || errorResponse.message || 'Invalid license certificate number.';
        throw new Error(message);
      }
      const data = await res.json();
      localStorage.setItem('currentPharmacyID', data.pharmacyID);
      alert(t('alert_login_success'));
      window.location.href = 'pharmacy.html';
    } catch (err) {
      console.error(err);
      alert(t('alert_login_failed') + (err.message || err));
    }
  });
});
