// Get the cart count element
const cartCountElement = document.getElementById('cart-count');

// Initialize the cart
let cart = {};

// Function to update the cart count
function updateCartCount() {
    const cartCount = Object.keys(cart).length;
    cartCountElement.textContent = cartCount;
}

// Function to add an item to the cart
function addToCart(name, price) {
    if (cart[name]) {
        cart[name].quantity++;
    } else {
        cart[name] = { price, quantity: 1 };
    }
    updateCartCount();
    showNotification(`Added ${name} to cart!`);
    saveCartToLocalStorage();
}

// Function to remove an item from the cart
function removeFromCart(name) {
    if (cart[name]) {
        delete cart[name];
    }
    updateCartCount();
    saveCartToLocalStorage();
}

// Function to save the cart to local storage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Function to load the cart from local storage
function loadCartFromLocalStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
        updateCartCount();
    }
}

// Load the cart from local storage when the page loads
loadCartFromLocalStorage();

// Function to display the cart table
function displayCartTable() {
    const cartTableBody = document.getElementById('cart-body');
    cartTableBody.innerHTML = '';
    for (const name in cart) {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = name;
        row.appendChild(nameCell);
        const priceCell = document.createElement('td');
        priceCell.textContent = `$${cart[name].price}`;
        row.appendChild(priceCell);
        const quantityCell = document.createElement('td');
        quantityCell.textContent = cart[name].quantity;
        row.appendChild(quantityCell);
        const totalCell = document.createElement('td');
        totalCell.textContent = `$${cart[name].price * cart[name].quantity}`;
        row.appendChild(totalCell);
        cartTableBody.appendChild(row);
    }
}

// Display the cart table when the cart page loads
if (document.getElementById('cart-table')) {
    displayCartTable();
}

// Function to initiate checkout
function initiateCheckout() {
    // Redirect to the checkout page
    window.location.href = 'checkout.html';
}

// Function to complete purchase
function completePurchase() {
    // Clear the cart
    cart = {};
    saveCartToLocalStorage();
    updateCartCount();
    // Redirect to the purchase confirmation page
    window.location.href = 'purchase-confirmation.html';
}

// Add event listener to the purchase button
if (document.getElementById('purchase-btn')) {
    document.getElementById('purchase-btn').addEventListener('click', completePurchase);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerHTML = `
        <span>${message}</span>
        <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M10 2C5.14 2 1 5.14 1 10s4.14 8 9 8 9-4.14 9-8S14.86 2 10 2z" fill="#fff" />
        </svg>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
