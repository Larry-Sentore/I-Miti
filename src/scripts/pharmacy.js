// Pharmacy stock dashboard — add medicines to inventory and update existing stock.

document.addEventListener('DOMContentLoaded', () => {
  const stockForm = document.querySelector('#stock-form');
  const viewStockBtn = document.querySelector('#view-stock');
  const stockTableDiv = document.querySelector('#stock-table');
  if (!stockForm || !viewStockBtn) return;

  // Get current pharmacy ID from login
  const currentPharmacyID = localStorage.getItem('currentPharmacyID');
  if (!currentPharmacyID) {
    alert(t('alert_login_first'));
    window.location.href = 'phalogin.html';
    return;
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentPharmacyID');
      alert(t('alert_logout_success'));
      window.location.href = 'phalogin.html';
    });
  }

  stockForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const medicine = document.getElementById('medicine')?.value?.trim();
    const category = document.getElementById('category')?.value?.trim();
    const price = document.getElementById('price')?.value?.trim();

    if (!medicine || !category || !price) {
      alert(t('alert_fill_all_fields'));
      return;
    }

    const payload = {
        name: medicine,
        category,
        price: parseFloat(price),
        pharmacyID: parseInt(currentPharmacyID)
    };

    try {
      const res = await fetch('/add_medicine_to_inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to add medicine to inventory.');
      }

      await res.json();
      alert(t('alert_add_medicine_success'));
      stockForm.reset();
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert(t('alert_add_medicine_failed') + error.message);
    }
  });

  viewStockBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`/inventory/${currentPharmacyID}`);
        if (!res.ok) {
            throw new Error('Failed to fetch inventory.');
        }
        const inventory = await res.json();
        displayInventory(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        alert(t('alert_fetch_inventory_failed') + error.message);
    }
  });

  function displayInventory(inventory) {
    if (!inventory || inventory.length === 0) {
      stockTableDiv.innerHTML = '<p>' + t('table_empty_inventory') + '</p>';
      return;
    }

    const table = `
      <table>
        <thead>
          <tr>
            <th>${t('table_col_id')}</th>
            <th>${t('table_col_medicine')}</th>
            <th>${t('table_col_category')}</th>
            <th>${t('table_col_price')}</th>
            <th>${t('table_col_status')}</th>
            <th>${t('table_col_actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${inventory.map(item => `
            <tr data-inventory-id="${item.inventoryID}" data-medicine-id="${item.medicineID}">
              <td>${item.inventoryID}</td>
              <td>${item.medicineName}</td>
              <td>${item.category || t('table_na')}</td>
              <td>
                <input type="number" step="0.01" value="${item.price}" class="price-input" data-original="${item.price}">
              </td>
              <td>
                <select class="status-select" data-original="${item.status}">
                  <option value="available" ${item.status === 'available' ? 'selected' : ''}>${t('table_status_available')}</option>
                  <option value="out_of_stock" ${item.status === 'out_of_stock' ? 'selected' : ''}>${t('table_status_out_of_stock')}</option>
                  <option value="discontinued" ${item.status === 'discontinued' ? 'selected' : ''}>${t('table_status_discontinued')}</option>
                </select>
              </td>
              <td>
                <button class="update-btn" onclick="updateInventoryItem(${item.inventoryID}, ${item.medicineID})">${t('table_btn_update')}</button>
                <button class="cancel-btn" onclick="cancelChanges(this)" style="display:none;">${t('table_btn_cancel')}</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    stockTableDiv.innerHTML = table;

    // Show update/cancel buttons when a value changes
    document.querySelectorAll('.price-input, .status-select').forEach(element => {
      element.addEventListener('change', function() {
        const row = this.closest('tr');
        row.querySelector('.update-btn').style.display = 'inline-block';
        row.querySelector('.cancel-btn').style.display = 'inline-block';
      });
    });
  }

  window.updateInventoryItem = async function(inventoryID, medicineID) {
    const row = document.querySelector(`tr[data-inventory-id="${inventoryID}"]`);
    const priceInput = row.querySelector('.price-input');
    const statusSelect = row.querySelector('.status-select');

    const newPrice = parseFloat(priceInput.value);
    const newStatus = statusSelect.value;

    if (isNaN(newPrice) || newPrice < 0) {
      alert(t('alert_invalid_price'));
      return;
    }

    try {
      const priceRes = await fetch(`/medicines/${medicineID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: row.cells[1].textContent.trim(),
          category: row.cells[2].textContent.trim() === t('table_na') ? null : row.cells[2].textContent.trim(),
          price: newPrice
        })
      });

      if (!priceRes.ok) throw new Error('Failed to update medicine price.');

      const statusRes = await fetch(`/inventories/${inventoryID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyID: parseInt(currentPharmacyID),
          medicineID: medicineID,
          status: newStatus
        })
      });

      if (!statusRes.ok) throw new Error('Failed to update inventory status.');

      alert(t('alert_update_success'));
      row.querySelector('.update-btn').style.display = 'none';
      row.querySelector('.cancel-btn').style.display = 'none';
      priceInput.setAttribute('data-original', newPrice);
      statusSelect.setAttribute('data-original', newStatus);

    } catch (error) {
      console.error('Error updating medicine:', error);
      alert(t('alert_update_failed') + error.message);
    }
  };

  window.cancelChanges = function(button) {
    const row = button.closest('tr');
    const priceInput = row.querySelector('.price-input');
    const statusSelect = row.querySelector('.status-select');
    priceInput.value = priceInput.getAttribute('data-original');
    statusSelect.value = statusSelect.getAttribute('data-original');
    row.querySelector('.update-btn').style.display = 'none';
    button.style.display = 'none';
  };

});
