// Registration logic — reads the token from sessionStorage and POSTs to /register_pharmacy.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#register form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const verificationToken = sessionStorage.getItem('registrationToken');
    if (!verificationToken) {
      alert(t('alert_verify_first'));
      window.location.href = 'index.html';
      return;
    }

    const name = document.getElementById('name')?.value?.trim();
    const address = document.getElementById('address')?.value?.trim();
    const phone = document.getElementById('phone')?.value?.trim();
    const certificate = document.getElementById('certificate')?.value?.trim();
    const latitude = document.getElementById('latitude')?.value?.trim();
    const longitude = document.getElementById('longitude')?.value?.trim();

    if (!name || !address || !phone) {
      alert(t('alert_fill_required'));
      return;
    }

    const payload = {
      name,
      address,
      number: phone,
      licenceID: certificate || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      verificationToken,
    };

    try {
      const res = await fetch('/register_pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const message = error.detail || error.message || 'Registration failed';
        throw new Error(message);
      }

      const data = await res.json();
      console.log('Registered pharmacy:', data);
      alert(t('alert_register_success'));
      form.reset();
      window.location.href = 'phalogin.html';
    } catch (err) {
      console.error(err);
      alert(t('alert_register_failed') + (err.message || err));
    }
  });
});
