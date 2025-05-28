import CartManager from './cart-manager.js';





document.addEventListener('DOMContentLoaded', function() {
    const addToCartBtn = document.querySelector('.card__btn');
    const cartCount = document.getElementById('cartCount');
    const mainImage = document.getElementById('mainImage');
    const thumbnailsContainer = document.querySelector('.thumbnails');
    const arrowLeft = document.querySelector('.arrow-left');
    const arrowRight = document.querySelector('.arrow-right');
    let productData = null;
    let currentImageIndex = 0;

    // Обновление состояния кнопки
    function updateCartButton() {
        if (!productData) return;

        const isInCart = CartManager.getAddedItems().includes(productData.id.toString());
        addToCartBtn.textContent = isInCart ? 'В корзине' : 'Добавить в корзину';
        addToCartBtn.classList.toggle('added', isInCart);
    }

    // Обработчик клика по кнопке
    addToCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!productData) return;

        if (CartManager.getAddedItems().includes(productData.id.toString())) {
            CartManager.removeItem(productData.id);
        } else {
            CartManager.addItem({
                id: productData.id,
                title: productData.title,
                price: productData.price,
                images: productData.images
            });
        }

        // Обновляем кнопку и счетчик
        updateCartButton();
        cartCount.textContent = CartManager.getTotalCount();
        cartCount.style.display = cartCount.textContent > 0 ? 'block' : 'none';
    });

    // Инициализация слайдера
    function initSlider() {
        if (!productData || !productData.images.length) return;

        mainImage.src = productData.images[0];
        thumbnailsContainer.innerHTML = '';

        productData.images.forEach((img, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = img;
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.addEventListener('click', () => changeImage(index));
            thumbnailsContainer.appendChild(thumbnail);
        });

        arrowLeft.addEventListener('click', prevImage);
        arrowRight.addEventListener('click', nextImage);
    }

    // Смена изображения
    function changeImage(index) {
        if (index < 0 || index >= productData.images.length) return;

        currentImageIndex = index;
        updateSlider();
    }

    // Предыдущее изображение
    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + productData.images.length) % productData.images.length;
        updateSlider();
    }

    // Следующее изображение
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % productData.images.length;
        updateSlider();
    }

    // Обновление слайдера
    function updateSlider() {
        mainImage.style.opacity = 0;
        setTimeout(() => {
            mainImage.src = productData.images[currentImageIndex];
            mainImage.style.opacity = 1;
        }, 200);

        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentImageIndex);
        });
    }

    // Загрузка данных товара
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            const productId = new URLSearchParams(window.location.search).get('id');
            productData = products.find(p => p.id == productId);

            if (!productData) {
                window.location.href = '404.html';
                return;
            }

            // Обновляем интерфейс
            document.getElementById('productTitle').textContent = productData.title;
            document.getElementById('productType').textContent = productData.details.type;
            document.getElementById('productBrand').textContent = productData.details.brand;
            document.getElementById('productSize').textContent = productData.details.size;
            document.getElementById('productGender').textContent = productData.details.gender;
            document.getElementById('productColor').textContent = productData.details.color;
            document.getElementById('productPrice').textContent = `${productData.price} ₽`;


            const avitoLinkElement = document.getElementById('avitoLink')
            if (productData.avitoLink) {
                avitoLinkElement.href = productData.avitoLink;

            } else {
                avitoLinkElement.style.display = 'none'; // Скрываем кнопку, если ссылки нет
            }


            const SellersLinkElement = document.getElementById('connectSeller')
            if (productData.connectSeller) {
                SellersLinkElement.href = productData.connectSeller;

            } else {
                SellersLinkElement.style.display = 'none'; // Скрываем кнопку, если ссылки нет
            }
            // Инициализация слайдера и кнопки
            initSlider();
            updateCartButton();
        })
        .catch(error => console.error('Ошибка загрузки товара:', error));

    // Синхронизация между вкладками
    window.addEventListener('cart-updated', updateCartButton);
});