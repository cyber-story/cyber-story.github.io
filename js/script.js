const tg = Telegram.WebApp;
let currentStepIndex = 0;
let stepsData = [];
let currentStep = null; // Глобальная переменная для хранения текущей карточки с типом "next"

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
    //         { id: 'yes', type: 'default', text: 'Да' },
    //         { id: 'no', type: 'default', text: 'Нет' }
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
    
    document.getElementById('container').innerHTML = `
    <div class="image-block" id="image-block"></div>
    <div class="text-block" id="text-block"></div>
    <div class="cards-container" id="cards-container"></div>
    <button class="continue-button" id="continue-button">Продолжить</button>
    `;

    currentStepIndex = 0;
    playerState.hp = 5; // Сбрасываем здоровье
    playerState.inventory = []; // Очищаем инвентарь
    playerState.usedCards = []; // Очищаем использованные карточки
    renderStep(stepsData[currentStepIndex]);
});

// Функция для отрисовки шага
function renderStep(step) {
    const imageBlock = document.getElementById('image-block');
    const textBlock = document.getElementById('text-block');
    const cardsContainer = document.getElementById('cards-container');
    const continueButton = document.getElementById('continue-button');

    // Устанавливаем фоновое изображение для блока с картинкой
    imageBlock.style.backgroundImage = `url('${step.background}')`;

    // Устанавливаем текст описания
    textBlock.textContent = step.description;

    // Очищаем контейнер с карточками
    cardsContainer.innerHTML = '';

    // Сбрасываем текущую карточку с типом "next"
    currentStep = null;

    // Удаляем старый обработчик события кнопки "Продолжить"
    const newContinueButton = continueButton.cloneNode(true); // Клонируем кнопку
    continueButton.replaceWith(newContinueButton); // Заменяем старую кнопку на клон

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
        cardElement.dataset.cardId = cardId; // Добавляем идентификатор карточки в DOM

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
    newContinueButton.disabled = true; // Сбрасываем состояние кнопки
    newContinueButton.addEventListener('click', () => {
        if (currentStep) {
            currentStepIndex = currentStep.nextIndex;
            if (stepsData[currentStepIndex]) {
                renderStep(stepsData[currentStepIndex]);
            } else {
                alert('История завершена!');
            }
        } else {
            alert('Сначала переверните карточку с типом "next"!');
        }
    });

    // Обновляем отображение состояния игрока (только здоровье)
    const playerStateElement = document.querySelector('.player-state');
    if (playerStateElement) {
        playerStateElement.innerHTML = `
            <p>Здоровье: ${playerState.hp}</p>
        `;
    }
}


// Обработчик клика по карточке
function handleCardClick(card, cardElement, cardsContainer, cardId) {
    // Если карточка уже перевёрнута, ничего не делаем
    if (cardElement.classList.contains('flipped')) {
        return;
    }

    // Если карточка уже перевёрнута, ничего не делаем
    if (cardElement.classList.contains('freeze-flip')) {
        return;
    }

    // Переворачиваем карточку
    cardElement.classList.add('flipped');

    // Если карточка имеет тип "next", сохраняем её данные
    if (card.type === 'next') {
        currentStep = card; // Сохраняем данные карточки
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
                alert('Вы погибли!');
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
            <p>Инвентарь: ${playerState.inventory.join(', ') || 'пусто'}</p>
        `;
    }
}