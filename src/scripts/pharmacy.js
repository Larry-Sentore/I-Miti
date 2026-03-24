//This is where the pharmacy stock update functionality is implemented. It listens for input in the stock update form and updates the displayed stock information based on the input values.
//The input medication will be added to the medicine table aswell as the inventory table. The default status is available. 
//If the view stock button is clicked, it fetches the current stock information from the server and displays it in a table format, allowing the user to see the stock and update it's availability status.

document.addEventListener('DOMContentLoaded', () => {
  const stockForm = document.querySelector('#stock-form');
  const viewStockBtn = document.querySelector('#view-stock');
  const stockTableDiv = document.querySelector('#stock-table');
  if (!stockForm || !viewStockBtn) return;

  // Get current pharmacy ID from login
  const currentPharmacyID = localStorage.getItem('currentPharmacyID');
  if (!currentPharmacyID) {
    alert('Please login first');
    window.location.href = 'phalogin.html';
    return;
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentPharmacyID');
      alert('Logged out successfully!');
      window.location.href = 'phalogin.html';
    });
  }

  stockForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const medicine = document.getElementById('medicine')?.value?.trim();
    const category = document.getElementById('category')?.value?.trim();
    const price = document.getElementById('price')?.value?.trim();

    if (!medicine || !category || !price) {
      alert('Please fill in all fields.');
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to add medicine to inventory.');
      }

      const result = await res.json();
      alert('Medicine added to inventory successfully!');
      stockForm.reset();
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('Failed to add medicine: ' + error.message);
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
        alert('Failed to fetch inventory: ' + error.message);
    }
  });

  function displayInventory(inventory) {
    if (!inventory || inventory.length === 0) {
      stockTableDiv.innerHTML = '<p>No medicines in inventory.</p>';
      return;
    }

    const table = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Medicine Name</th>
            <th>Category</th>
            <th>Price (FBU)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${inventory.map(item => `
            <tr data-inventory-id="${item.inventoryID}" data-medicine-id="${item.medicineID}">
              <td>${item.inventoryID}</td>
              <td>${item.medicineName}</td>
              <td>${item.category || 'N/A'}</td>
              <td>
                <input type="number" step="0.01" value="${item.price}" class="price-input" data-original="${item.price}">
              </td>
              <td>
                <select class="status-select" data-original="${item.status}">
                  <option value="available" ${item.status === 'available' ? 'selected' : ''}>Available</option>
                  <option value="out_of_stock" ${item.status === 'out_of_stock' ? 'selected' : ''}>Out of Stock</option>
                  <option value="discontinued" ${item.status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
                </select>
              </td>
              <td>
                <button class="update-btn" onclick="updateInventoryItem(${item.inventoryID}, ${item.medicineID})">Update</button>
                <button class="cancel-btn" onclick="cancelChanges(this)" style="display:none;">Cancel</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    stockTableDiv.innerHTML = table;

    // Add event listeners to detect change
    document.querySelectorAll('.price-input, .status-select').forEach(element => {
      element.addEventListener('change', function() {
        const row = this.closest('tr');
        const updateBtn = row.querySelector('.update-btn');
        const cancelBtn = row.querySelector('.cancel-btn');
        updateBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
      });
    });
  }

  // Function for updating inventory items
  window.updateInventoryItem = async function(inventoryID, medicineID) {
    const row = document.querySelector(`tr[data-inventory-id="${inventoryID}"]`);
    const priceInput = row.querySelector('.price-input');
    const statusSelect = row.querySelector('.status-select');

    const newPrice = parseFloat(priceInput.value);
    const newStatus = statusSelect.value;

    if (isNaN(newPrice) || newPrice < 0) {
      alert('Please enter a valid price.');
      return;
    }

    try {
      // Update medicine price
      const priceRes = await fetch(`/medicines/${medicineID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: row.cells[1].textContent.trim(), 
          category: row.cells[2].textContent.trim() === 'N/A' ? null : row.cells[2].textContent.trim(),
          price: newPrice
        })
      });

      if (!priceRes.ok) {
        throw new Error('Failed to update medicine price.');
      }

      // Update inventory status
      const statusRes = await fetch(`/inventories/${inventoryID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pharmacyID: parseInt(currentPharmacyID),
          medicineID: medicineID,
          status: newStatus
        })
      });

      if (!statusRes.ok) {
        throw new Error('Failed to update inventory status.');
      }

      alert('Medicine updated successfully!');
      // Hide update/cancel buttons
      row.querySelector('.update-btn').style.display = 'none';
      row.querySelector('.cancel-btn').style.display = 'none';

      // Update values
      priceInput.setAttribute('data-original', newPrice);
      statusSelect.setAttribute('data-original', newStatus);

    } catch (error) {
      console.error('Error updating medicine:', error);
      alert('Failed to update medicine: ' + error.message);
    }
  };

  //function for canceling changes
  window.cancelChanges = function(button) {
    const row = button.closest('tr');
    const priceInput = row.querySelector('.price-input');
    const statusSelect = row.querySelector('.status-select');

    // Reset to original values
    priceInput.value = priceInput.getAttribute('data-original');
    statusSelect.value = statusSelect.getAttribute('data-original');

    // Hide buttons
    row.querySelector('.update-btn').style.display = 'none';
    button.style.display = 'none';
  };

});




