const tg = Telegram.WebApp;
let currentStepIndex = 0;
let stepsData = [];

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
    tg.showPopup({
        title: 'Начало истории',
        message: 'Вы готовы начать свою историю?',
        buttons: [
            { id: 'yes', type: 'ok', text: 'Да' },
            { id: 'no', type: 'cancel', text: 'Нет' }
        ]
    }, function(buttonId) {
        if (buttonId === 'yes') {
            currentStepIndex = 0;
            renderStep(stepsData[currentStepIndex]);
        }
    });
});

// Функция для отрисовки шага
function renderStep(step) {
    document.body.innerHTML = `
        <div class="username" id="username">${usernameElement.textContent}</div>
        <div class="narrative-text">${step.description}</div>
        <div class="cards-container" id="cards-container"></div>
        <button class="continue-button" id="continue-button" disabled>Продолжить</button>
    `;

    const cardsContainer = document.getElementById('cards-container');
    const continueButton = document.getElementById('continue-button');

    // Перемешиваем карточки
    const shuffledCards = step.cards.sort(() => Math.random() - 0.5);

    // Создаем карточки
    shuffledCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${card.action}</div>
                <div class="card-back">${card.result}</div>
            </div>
        `;
        cardElement.addEventListener('click', () => handleCardClick(card, cardElement));
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
function handleCardClick(card, cardElement) {
    if (cardElement.classList.contains('flipped')) return; // Карточка уже перевернута

    cardElement.classList.add('flipped');
    const continueButton = document.getElementById('continue-button');

    if (card.type === 'next') {
        continueButton.disabled = false;
    } else if (card.type === 'try') {
        // Можно перевернуть следующую карточку
    }
}