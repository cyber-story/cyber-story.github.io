const tg = Telegram.WebApp;
let currentStepIndex = 0;
let stepsData = [];

// Состояние игрока
const playerState = {
    hp: 5, // Здоровье
    inventory: [], // Инвентарь
    usedCards: [], // Использованные карточки
};

// Загрузка данных из robot.json
fetch('data/robot.json')
    .then(response => response.json())
    .then(data => {
        stepsData = data;
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));

// Показываем username пользователя
const usernameElement = document.getElementById('username');
if (tg.initDataUnsafe.user) {
    const username = tg.initDataUnsafe.user.username || 'User';
    usernameElement.textContent = `@${username}`;
} else {
    usernameElement.textContent = 'Гость';
}

// Функция для кнопки "Начать свою историю"
document.getElementById('start-button').addEventListener('click', () => {
    // tg.showPopup({
    //     title: 'Начало истории',
    //     message: 'Вы готовы начать свою историю?',
    //     buttons: [
    //         { id: 'yes', type: 'ok', text: 'Да' },
    //         { id: 'no', type: 'cancel', text: 'Нет' }
    //     ]
    // }, function(buttonId) {
    //     if (buttonId === 'yes') {
    //         currentStepIndex = 0;
    //         playerState.hp = 5; // Сбрасываем здоровье
    //         playerState.inventory = []; // Очищаем инвентарь
    //         playerState.usedCards = []; // Очищаем использованные карточки
    //         renderStep(stepsData[currentStepIndex]);
    //     }
    // });
    currentStepIndex = 0;
            playerState.hp = 5; // Сбрасываем здоровье
            playerState.inventory = []; // Очищаем инвентарь
            playerState.usedCards = []; // Очищаем использованные карточки
            renderStep(stepsData[currentStepIndex]);
});

// Функция для отрисовки шага
function renderStep(step) {
    // Устанавливаем фоновое изображение для body
    document.body.style.backgroundImage = `url('${step.background}')`;

    document.body.innerHTML = `
        <div class="username" id="username">${usernameElement.textContent}</div>
        <div class="narrative-text">${step.description}</div>
        <div class="cards-container" id="cards-container"></div>
        <button class="continue-button" id="continue-button" disabled>Продолжить</button>
        <div class="player-state">
            <p>Здоровье: ${playerState.hp}</p>
            <!--p>Инвентарь: ${playerState.inventory.join(', ') || 'пусто'}</p-->
        </div>
    `;

    const cardsContainer = document.getElementById('cards-container');
    const continueButton = document.getElementById('continue-button');

    // Перемешиваем карточки
    const shuffledCards = step.cards.sort(() => Math.random() - 0.5);

    // Создаем карточки
    shuffledCards.forEach((card, cardIndex) => {
        // Уникальный идентификатор карточки
        const cardId = `${step.index}.${cardIndex + 1}`;

        // Если карточка уже использована, пропускаем её
        if (playerState.usedCards.includes(cardId)) {
            return;
        }

        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${card.action}</div>
                <div class="card-back">${card.result}</div>
            </div>
        `;

        cardElement.addEventListener('click', () => handleCardClick(card, cardElement, cardsContainer, cardId));
        cardsContainer.appendChild(cardElement);
    });

    // Обработчик кнопки "Продолжить"
    continueButton.addEventListener('click', () => {
        const cards = Array.from(cardsContainer.children);

        // Ищем перевёрнутую карточку с типом "next"
        const nextCardElement = cards.find(cardElement => {
            const isFlipped = cardElement.classList.contains('flipped');
            const cardAction = cardElement.querySelector('.card-front').textContent;
            const cardData = step.cards.find(card => card.action === cardAction);
            return isFlipped && cardData && cardData.type === 'next';
        });

        if (nextCardElement) {
            const cardAction = nextCardElement.querySelector('.card-front').textContent;
            const nextCard = step.cards.find(card => card.action === cardAction);

            if (nextCard) {
                currentStepIndex = nextCard.nextIndex;
                if (stepsData[currentStepIndex]) {
                    renderStep(stepsData[currentStepIndex]);
                } else {
                    alert('История завершена!');
                }
            }
        } else {
            alert('Сначала переверните карточку с типом "next"!');
        }
    });
}

// Обработчик клика по карточке
function handleCardClick(card, cardElement, cardsContainer, cardId) {
    // Если карточка уже перевёрнута, ничего не делаем
    if (cardElement.classList.contains('flipped')) {
        return;
    }

    // Если у карточки есть класс "freeze-flip", ничего не делаем
    if (cardElement.classList.contains('freeze-flip')) {
        return;
    }

    // Переворачиваем карточку
    cardElement.classList.add('flipped');

    // Если карточка имеет тип "next", блокируем переворот других карточек
    if (card.type === 'next') {
        const continueButton = document.getElementById('continue-button');
        continueButton.disabled = false;

        // Добавляем класс "freeze-flip" ко всем карточкам
        const cards = Array.from(cardsContainer.children);
        cards.forEach(cardEl => {
            if (!cardEl.classList.contains('flipped')) {
                cardEl.classList.add('freeze-flip');
            }
        });
    }

    // Обрабатываем эффекты карточки
    if (card.effect) {
        if (card.effect.hp) {
            playerState.hp += card.effect.hp; // Изменяем здоровье
            if (playerState.hp <= 0) {
                currentStepIndex = 999; // Переход на шаг "Вы погибли"
                renderStep(stepsData[currentStepIndex]);
                return;
            }
        }
        if (card.effect.addToInventory) {
            playerState.inventory.push(card.effect.addToInventory); // Добавляем предмет в инвентарь
        }
    }

    // Если карточка одноразовая, добавляем её идентификатор в usedCards
    if (card.use === "once") {
        playerState.usedCards.push(cardId);
    }

    // Обновляем отображение состояния игрока
    const playerStateElement = document.querySelector('.player-state');
    if (playerStateElement) {
        playerStateElement.innerHTML = `
            <p>Здоровье: ${playerState.hp}</p>
            <!--p>Инвентарь: ${playerState.inventory.join(', ') || 'пусто'}</p-->
        `;
    }
}