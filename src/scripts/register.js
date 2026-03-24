document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#register form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name')?.value?.trim();
    const address = document.getElementById('address')?.value?.trim();
    const phone = document.getElementById('phone')?.value?.trim();
    const certificate = document.getElementById('certificate')?.value?.trim();
    const latitude = document.getElementById('latitude')?.value?.trim();
    const longitude = document.getElementById('longitude')?.value?.trim();

    if (!name || !address || !phone) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      name,
      address,
      number: phone,
      licenceID: certificate || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,

    };

    try {
      const res = await fetch('/register_pharmacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const message = error.detail || error.message || 'Registration failed';
        throw new Error(message);
      }

      const data = await res.json();
      alert('Registration successful!');
      form.reset();
      // redirect to a login or search page
      window.location.href = 'phalogin.html';

      console.log('Registered pharmacy:', data);
    } catch (err) {
      console.error(err);
      alert('Failed to register pharmacy: ' + (err.message || err));
    }
  });
});
