import CartManager from './cart-manager.js';

class UserDB {
    constructor(dbName, storeName) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'username' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async addUser(user) {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
            tx.objectStore(this.storeName).add(user);
        });
    }

    async getUser(username) {
        const tx = this.db.transaction(this.storeName, 'readonly');
        return new Promise((resolve, reject) => {
            const request = tx.objectStore(this.storeName).get(username);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getUserByEmail(email) {
        const tx = this.db.transaction(this.storeName, 'readonly');
        return new Promise((resolve, reject) => {
            const index = tx.objectStore(this.storeName).index('email');
            const request = index.get(email);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

const userDB = new UserDB('EcommerceDB', 'users');

document.addEventListener('DOMContentLoaded', async () => {
    await userDB.openDB().catch(err => console.error('DB Error:', err));

    const elements = {
        profileBtn: document.getElementById('profileButton'),
        authModal: document.getElementById('authModal'),
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        closeBtn: document.querySelector('.close-btn'),
        switchToRegister: document.querySelector('.switch-to-register'),
        switchToLogin: document.querySelector('.switch-to-login'),
        loginUsername: document.getElementById('loginUsername'),
        loginPassword: document.getElementById('loginPassword'),
        loginBtn: document.getElementById('loginBtn'),
        loginMessage: document.getElementById('loginMessage'),
        regUsername: document.getElementById('regUsername'),
        regPassword: document.getElementById('regPassword'),
        repeatPassword: document.getElementById('repeatPassword'),
        regEmail: document.getElementById('email'),
        registerBtn: document.getElementById('registerBtn'),
        registerMessage: document.getElementById('registerMessage'),
        filterButton: document.getElementById('filterButton'),
        closeFilters: document.getElementById('closeFilters'),
        filters: document.getElementById('filters'),
        cards: document.querySelectorAll('.card'),
        searchInput: document.getElementById('searchInput'),
        minPriceInput: document.getElementById('minPrice'),
        maxPriceInput: document.getElementById('maxPrice'),
        cartCount: document.getElementById('cartCount'),
        cartButtons: document.querySelectorAll('.card__btn')
    };

    function showProfileInfo(user) {
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileCity').value = user.city || '';
        elements.loginForm.classList.remove('active');
        elements.registerForm.classList.remove('active');
        document.getElementById('profileInfo').style.display = 'block';
    }

    function hideProfileInfo() {
        document.getElementById('profileInfo').style.display = 'none';
    }

    elements.profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            showProfileInfo(currentUser);
        } else {
            elements.loginForm.classList.add('active');
            hideProfileInfo();
        }
        elements.authModal.style.display = 'block';
    });

    elements.closeBtn.addEventListener('click', () => {
        elements.authModal.style.display = 'none';
    });

    elements.switchToRegister.addEventListener('click', () => {
        elements.loginForm.classList.remove('active');
        elements.registerForm.classList.add('active');
    });

    elements.switchToLogin.addEventListener('click', () => {
        elements.registerForm.classList.remove('active');
        elements.loginForm.classList.add('active');
    });

    let cartItems = CartManager.getCartItems();
    let addedItems = CartManager.getAddedItems();

    function init() {
        initEventListeners();
        initCartButtons();
        syncCartButtons();
        updateCartCounter();
        initCardSliders();

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            setupProfileButton(currentUser);
        }
    }

    function initEventListeners() {
        elements.profileBtn?.addEventListener('click', handleProfileClick);
        elements.closeBtn?.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === elements.authModal) closeModal();
        });
        elements.switchToRegister?.addEventListener('click', showRegisterForm);
        elements.switchToLogin?.addEventListener('click', showLoginForm);
        elements.loginBtn?.addEventListener('click', handleLogin);
        elements.registerBtn?.addEventListener('click', handleRegister);
        elements.searchInput?.addEventListener('input', filterCards);
        elements.filterButton?.addEventListener('click', () => elements.filters.classList.toggle('active'));
        elements.closeFilters?.addEventListener('click', () => elements.filters.classList.remove('active'));
        elements.minPriceInput?.addEventListener('input', applyFilters);
        elements.maxPriceInput?.addEventListener('input', applyFilters);
        document.querySelectorAll('.filters input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', applyFilters);
        });
        window.addEventListener('cart-updated', () => {
            cartItems = CartManager.getCartItems();
            addedItems = CartManager.getAddedItems();
            syncCartButtons();
            updateCartCounter();
        });
    }

    function setupProfileButton(user) {
        const profileBtn = document.getElementById('profileButton');
        if (profileBtn) {
            if (user) {
                profileBtn.querySelector('img').alt = `Профиль: ${user.username}`;
            } else {
                profileBtn.querySelector('img').alt = 'Профиль';
            }
        }
    }
    async function handleProfileClick(e) {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            showProfileModal(currentUser);
        } else {
            elements.authModal.style.display = 'block';
            showLoginForm();
        }
    }

    async function handleLogin() {
        const username = elements.loginUsername.value.trim();
        const password = elements.loginPassword.value.trim();

        if (!validateLoginInputs(username, password)) return;

        const user = await userDB.getUser(username);
        if (user && user.password === password) {
            showMessage(elements.loginMessage, 'Успешный вход!', 'success');
            localStorage.setItem('currentUser', JSON.stringify(user));
            setTimeout(() => {
                closeModal();
                setupProfileButton(user);
            }, 1500);
        } else {
            showMessage(elements.loginMessage, 'Неверные данные!', 'error');
        }
    }

    async function handleRegister() {
        const username = elements.regUsername.value.trim();
        const password = elements.regPassword.value.trim();
        const repeatPass = elements.repeatPassword.value.trim();
        const email = elements.regEmail.value.trim();

        if (!validateRegisterInputs(username, password, repeatPass, email)) return;

        // Проверяем, существует ли пользователь с таким email
        const existingUserByEmail = await userDB.getUserByEmail(email);
        if (existingUserByEmail) {
            showMessage(elements.registerMessage, 'Пользователь с таким email уже существует!', 'error');
            return;
        }

        const existingUser = await userDB.getUser(username);
        if (existingUser) {
            showMessage(elements.registerMessage, 'Пользователь уже существует!', 'error');
            return;
        }

        const user = { username, password, email, city: '', orders: [] };
        await userDB.addUser(user);
        showMessage(elements.registerMessage, 'Регистрация успешна!', 'success');
        setTimeout(showLoginForm, 1500);
    }

    function validateLoginInputs(username, password) {
        if (!username || !password) {
            showMessage(elements.loginMessage, 'Заполните все поля!', 'error');
            return false;
        }
        return true;
    }

    function validateRegisterInputs(username, password, repeatPass, email) {
        if (!username || !password || !repeatPass || !email) {
            showMessage(elements.registerMessage, 'Заполните все поля!', 'error');
            return false;
        }

        if (password !== repeatPass) {
            showMessage(elements.registerMessage, 'Пароли не совпадают!', 'error');
            return false;
        }

        if (!validateEmail(email)) {
            showMessage(elements.registerMessage, 'Некорректный email!', 'error');
            return false;
        }

        return true;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showLoginForm() {
        elements.loginForm.classList.add('active');
        elements.registerForm.classList.remove('active');
        clearMessages();
    }

    function showRegisterForm() {
        elements.registerForm.classList.add('active');
        elements.loginForm.classList.remove('active');
        clearMessages();
    }

    function closeModal() {
        elements.authModal.style.display = 'none';
        elements.loginForm.reset();
        elements.registerForm.reset();
        clearMessages();
    }

    function showMessage(element, text, type) {
        element.textContent = text;
        element.className = `auth-message ${type}`;
        setTimeout(() => element.textContent = '', 3000);
    }

    function clearMessages() {
        elements.loginMessage.textContent = '';
        elements.registerMessage.textContent = '';
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser'); // Удаляем данные текущего пользователя
        hideProfileInfo(); // Скрываем информацию о профиле
        elements.loginForm.classList.add('active'); // Показываем форму входа
        elements.registerForm.classList.remove('active'); // Скрываем форму регистрации
        elements.authModal.style.display = 'block'; // Показываем модальное окно авторизации
        setupProfileButton(null); // Обновляем кнопку профиля
    });

    function updateCartCounter() {
        const total = CartManager.getTotalCount();
        elements.cartCount.textContent = total;
        elements.cartCount.style.display = total > 0 ? 'block' : 'none';
    }

    function syncCartButtons() {
        elements.cards.forEach(card => {
            const id = card.dataset.id;
            const button = card.querySelector('.card__btn');
            if (addedItems.includes(id)) {
                button.textContent = "В корзине";
                button.classList.add('added');
            } else {
                button.textContent = "В корзину";
                button.classList.remove('added');
            }
        });
    }

    function handleAddToCartClick(e) {
        e.preventDefault();
        const button = e.target;
        const card = button.closest('.card');

        if (!card || !card.dataset.id) {
            console.error('Карточка товара не найдена или отсутствует data-id');
            return;
        }

        const product = {
            id: card.dataset.id,
            title: card.querySelector('.title--title').textContent,
            price: parseFloat(card.querySelector('.card__price--dis').textContent),
            images: Array.from(card.querySelectorAll('.card__img img')).map(img => img.src)
        };

        if (addedItems.includes(card.dataset.id)) {
            CartManager.removeItem(card.dataset.id);
        } else {
            CartManager.addItem(product);
        }

        syncCartButtons();
        updateCartCounter();
    }

    function initCartButtons() {
        elements.cartButtons.forEach(button => {
            button.addEventListener('click', handleAddToCartClick);
        });
    }

    function filterCards() {
        const searchText = elements.searchInput.value.toLowerCase();

        elements.cards.forEach(card => {
            const title = card.querySelector('.title--title').textContent.toLowerCase();
            const subtitle = card.querySelector('.title--subtitle').textContent.toLowerCase();

            card.style.display = (title.includes(searchText) || subtitle.includes(searchText)) ? 'flex' : 'none';
        });
    }

    function applyFilters() {
        const selectedSizes = getSelectedValues('size');
        const selectedBrands = getSelectedValues('brand');
        const selectedCategories = getSelectedValues('category');
        const minPrice = parseFloat(elements.minPriceInput.value) || 0;
        const maxPrice = parseFloat(elements.maxPriceInput.value) || Infinity;

        elements.cards.forEach(card => {
            const subtitle = card.querySelector('.title--subtitle').textContent.toLowerCase();
            const brand = card.querySelector('.title--title').textContent.toLowerCase().trim();
            const category = card.querySelector('.title--subtitle').textContent.toLowerCase();
            const price = parseFloat(card.querySelector('.card__price--dis').textContent);

            const sizesInSubtitle = subtitle.replace('size:', '');
            const matchesSize = selectedSizes.length === 0 || selectedSizes.some(size => sizesInSubtitle.includes(size.toLowerCase()));
            const matchesBrand = selectedBrands.length === 0 || selectedBrands.some(selectedBrand => brand.includes(selectedBrand.toLowerCase().trim()));
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(c => category.includes(c.toLowerCase()));
            const matchesPrice = price >= minPrice && price <= maxPrice;

            card.style.display = (matchesSize && matchesBrand && matchesCategory && matchesPrice) ? 'flex' : 'none';
        });
    }

    function getSelectedValues(name) {
        const inputs = document.querySelectorAll(`.filters input[name="${name}"]:checked`);
        return Array.from(inputs).map(input => input.value);
    }

    function initCardSliders() {
        elements.cards.forEach(card => {
            const cardImg = card.querySelector('.card__img');
            const images = cardImg.querySelectorAll('img');
            const indicatorsContainer = card.querySelector('.card__indicators');
            let indicators = [];

            images.forEach((_, index) => {
                const indicator = document.createElement('div');
                indicator.classList.add('card__indicator');
                if (index === 0) indicator.classList.add('card__indicator--active');
                indicatorsContainer.appendChild(indicator);
                indicators.push(indicator);
            });

            cardImg.addEventListener('mousemove', (event) => {
                const rect = cardImg.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const width = rect.width;
                const part = width / images.length;

                images.forEach((img, index) => {
                    if (x >= part * index && x < part * (index + 1)) {
                        img.style.opacity = 1;
                        indicators[index].classList.add('card__indicator--active');
                    } else {
                        img.style.opacity = 0;
                        indicators[index].classList.remove('card__indicator--active');
                    }
                });
            });

            cardImg.addEventListener('mouseleave', () => {
                images.forEach((img, index) => {
                    if (index === 0) {
                        img.style.opacity = 1;
                        indicators[0].classList.add('card__indicator--active');
                    } else {
                        img.style.opacity = 0;
                        indicators[index].classList.remove('card__indicator--active');
                    }
                });
            });
        });
    }

    init();
});