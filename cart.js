import CartManager from './cart-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');

    // Отрисовка товаров в корзине
    function renderCartItems() {
        const cartItems = CartManager.getCartItems();
        cartItemsContainer.innerHTML = '';

        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <img class="empty-cart-img" src="./images/emptycart.png" alt="Пустая корзина">
                    <div class="empty-cart-text">Корзина пуста</div>
                    <div class="empty-cart-subtext">Мы подобрали для вас товар на главной странице</div>
                    <a href="index.html"><button class="kzdec">На главную</button></a>
                </div>
            `;
            totalPriceElement.textContent = '0';
            return;
        }

        let totalPrice = 0;
        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p>Цена: ${item.price} ₽</p>
                    <p>Количество: ${item.quantity}</p>
                </div>
                <div class="cart-item-price">${item.price * item.quantity} ₽</div>
                <span class="remove-item" data-id="${item.id}">&times;</span>
            `;
            cartItemsContainer.appendChild(itemElement);
            totalPrice += item.price * item.quantity;
        });

        totalPriceElement.textContent = totalPrice;
    }

    // Обработчик удаления товара
    cartItemsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item')) {
            CartManager.removeItem(e.target.dataset.id);
            renderCartItems();
        }
    });

    cartItemsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item')) {
            console.log('Removing item with ID:', e.target.dataset.id);
            CartManager.removeItem(e.target.dataset.id);
            renderCartItems();
        }
    });

    // Инициализация
    renderCartItems();




    const orderButton = document.getElementById('orderButton');
    const cityInput = document.getElementById('city');
    const errorMessage = document.createElement('div');
    
    // Создаем элемент для ошибки
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Выберите город';
    cityInput.parentNode.insertBefore(errorMessage, cityInput.nextSibling);

    orderButton.addEventListener('click', function(e) {
        e.preventDefault(); // Предотвращаем стандартное поведение
        
        // Проверяем поле города
        if(!cityInput.value.trim()) {
            errorMessage.style.display = 'block';
            cityInput.focus();
            return;
        }

        // Если валидация пройдена - редирект
        const telegramURL = 'https://www.tbank.ru/cf/6fqrRlHMmE6';
        window.open(telegramURL, '_blank', 'noopener,noreferrer');
    });

    // Скрываем ошибку при вводе
    cityInput.addEventListener('input', function() {
        if(this.value.trim()) {
            errorMessage.style.display = 'none';
        }
    });
});