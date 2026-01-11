// Cart Management System
class Cart {
    constructor() {
        this.items = this.loadCart();
        this.deliveryCharge = 2000;
        this.updateCartUI();
    }

    loadCart() {
        const saved = localStorage.getItem('retralabs_cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('retralabs_cart', JSON.stringify(this.items));
        this.updateCartUI();
    }

    addItem(productKey, dosage, price, productName) {
        const existingItem = this.items.find(item => 
            item.productKey === productKey && item.dosage === dosage
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                productKey,
                dosage,
                price,
                productName,
                quantity: 1
            });
        }

        this.saveCart();
        this.showCartNotification();
    }

    removeItem(productKey, dosage) {
        this.items = this.items.filter(item => 
            !(item.productKey === productKey && item.dosage === dosage)
        );
        this.saveCart();
    }

    updateQuantity(productKey, dosage, quantity) {
        const item = this.items.find(item => 
            item.productKey === productKey && item.dosage === dosage
        );
        
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productKey, dosage);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTotal() {
        return this.getSubtotal() + this.deliveryCharge;
    }

    clearCart() {
        this.items = [];
        this.saveCart();
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    showCartNotification() {
        // Show a brief notification that item was added
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = 'Item added to cart!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Initialize cart
let cart;
if (typeof window !== 'undefined') {
    cart = new Cart();
    window.cart = cart;
}

// Add to cart button handlers
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest?.('.btn-add-to-research');
        if (addBtn && !addBtn.disabled) {
            e.preventDefault();
            if (!window.cart) return;

            const productKey = addBtn.getAttribute('data-product-key');
            const productName = addBtn.getAttribute('data-product-name') || 'Peptide';
            const dosage = parseInt(addBtn.getAttribute('data-dosage') || '0', 10);
            const price = parseInt(addBtn.getAttribute('data-price') || '0', 10);

            if (!productKey || !dosage || !price) return;

            window.cart.addItem(productKey, dosage, price, productName);
            window.location.href = '/cart';
            return;
        }

        if (e.target.classList.contains('btn-dosage') && !e.target.disabled) {
            e.preventDefault();
            const card = e.target.closest('.dosage-card');
            if (card && window.cart) {
                const productKey = card.getAttribute('data-product');
                const dosage = parseInt(card.getAttribute('data-dosage'));
                const priceText = card.querySelector('.dosage-price')?.textContent;
                
                if (priceText) {
                    const price = parseInt(priceText.replace(/[^\d]/g, ''));
                    // Get product name from productData if available, otherwise from card
                    let productName = 'Peptide';
                    if (typeof productData !== 'undefined' && productData[productKey]) {
                        productName = productData[productKey].name;
                    } else {
                        const label = card.querySelector('.dosage-label');
                        if (label) {
                            productName = label.textContent.trim();
                        }
                    }
                    
                    window.cart.addItem(productKey, dosage, price, productName);
                    
                    // Redirect to cart page
                    window.location.href = '/cart';
                }
            }
        }
    });
}
