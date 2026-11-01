// ==========================================
// SNAKE.JS - Portal de Juegos Retro
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Al servir el frontend y la API desde el mismo servidor, dejamos API_URL vacío
    const API_URL = '';
    let pendingScore = 0;

    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) {
        console.error("No se encontró el elemento canvas con id 'snakeCanvas'");
        return;
    }
    const ctx = canvas.getContext('2d');

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    let snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    let food = { x: 5, y: 5 };
    let dx = 1;
    let dy = 0;
    let score = 0;
    let isPaused = false;
    let gameInterval = null;

    // Iniciar juego
    function initGame() {
        spawnFood();
        score = 0;
        updateScore();
        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        dx = 1;
        dy = 0;
        isPaused = false;
        
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 100);
    }

    function gameLoop() {
        if (isPaused) return;
        update();
        draw();
    }

    function update() {
        // Mover la cabeza
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Comprobar colisiones con las paredes
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            handleGameOver();
            return;
        }

        // Comprobar colisiones consigo mismo
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                handleGameOver();
                return;
            }
        }

        snake.unshift(head);

        // Comprobar si come la manzana
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            updateScore();
            spawnFood();
        } else {
            snake.pop();
        }
    }

    function draw() {
        // Fondo del canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar comida (Manzana)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

        // Dibujar serpiente
        snake.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? '#22c55e' : '#10b981';
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
        });

        // Mensaje visual si está en pausa
        if (isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
        }
    }

    function spawnFood() {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);

        // Evitar que la comida aparezca encima de la serpiente
        snake.forEach(part => {
            if (part.x === food.x && part.y === food.y) {
                spawnFood();
            }
        });
    }

    function updateScore() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = score;
    }

    function handleGameOver() {
        clearInterval(gameInterval);
        pendingScore = score;

        const scoreVal = document.getElementById('final-score-val');
        if (scoreVal) scoreVal.innerText = score;

        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.add('active');

        const nameInput = document.getElementById('player-name-input');
        if (nameInput) nameInput.focus();
    }

    // Funciones globales para el formulario de Game Over
    window.handleScoreSubmit = async function(event) {
        event.preventDefault();
        const nameInput = document.getElementById('player-name-input');
        const username = nameInput ? nameInput.value.trim() || 'Jugador Anónimo' : 'Jugador Anónimo';

        await saveScore(username, pendingScore);

        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        if (nameInput) nameInput.value = '';

        initGame();
    };

    window.skipScoreSave = function() {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');

        const nameInput = document.getElementById('player-name-input');
        if (nameInput) nameInput.value = '';

        initGame();
    };

    async function saveScore(username, score) {
        try {
            await fetch(`${API_URL}/api/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, game: 'snake', score })
            });
        } catch (error) {
            console.error('Error al guardar puntuación:', error);
        }
    }

    // Control de teclas
    document.addEventListener('keydown', e => {
        if (e.key === 'p' || e.key === 'P') {
            isPaused = !isPaused;
            return;
        }

        if (isPaused) return;

        if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dx === 0) {
            dx = -1;
            dy = 0;
        } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dy === 0) {
            dx = 0;
            dy = -1;
        } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dx === 0) {
            dx = 1;
            dy = 0;
        } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dy === 0) {
            dx = 0;
            dy = 1;
        }
    });

    // Iniciar partida al cargar
    initGame();
});