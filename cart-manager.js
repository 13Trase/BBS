class CartManager {
    static getCartItems() {
        return JSON.parse(localStorage.getItem('cartItems')) || [];
    }

    static getAddedItems() {
        return JSON.parse(localStorage.getItem('addedItems')) || [];
    }


    static addItem(product) {
        const cartItems = this.getCartItems();
        const productId = Number(product.id); 
        const existingItem = cartItems.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({
                id: productId, 
                name: product.title,
                price: product.price,
                image: product.images[0],
                quantity: 1
            });
        }

        this._saveCart(cartItems);
    }

    static removeItem(productId) {
        const id = Number(productId); 
        const cartItems = this.getCartItems().filter(item => item.id !== id);
        this._saveCart(cartItems);
    }

    static _saveCart(cartItems) {
        const addedItems = cartItems.map(item => item.id.toString());
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        localStorage.setItem('addedItems', JSON.stringify(addedItems));
        this._triggerUpdate();
    }

    static _triggerUpdate() {
        window.dispatchEvent(new Event('cart-updated'));
    }

    static getTotalCount() {
        return this.getCartItems().reduce((sum, item) => sum + item.quantity, 0);
    }
}

export default CartManager;