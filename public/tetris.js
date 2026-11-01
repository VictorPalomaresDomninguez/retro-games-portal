document.addEventListener('DOMContentLoaded', () => {
    // API_URL vacío para usar rutas relativas (compatible con servidor unificado y despliegue)
    const API_URL = '';
    let pendingScore = 0;

    const canvas = document.getElementById('tetris');
    if (!canvas) {
        console.error("No se encontró el elemento canvas con id 'tetris'");
        return;
    }
    const ctx = canvas.getContext('2d');

    const BLOCK_SIZE = 20;
    const ROWS = 20;
    const COLS = 12;

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    // Definición de piezas (Tetrominós)
    const SHAPES = [
        [],
        [[1, 1, 1, 1]], // I
        [[1, 1], [1, 1]], // O
        [[0, 1, 0], [1, 1, 1]], // T
        [[1, 0, 0], [1, 1, 1]], // L
        [[0, 0, 1], [1, 1, 1]], // J
        [[0, 1, 1], [1, 1, 0]], // S
        [[1, 1, 0], [0, 1, 1]]  // Z
    ];

    const COLORS = [
        '#0f172a',
        '#38bdf8', // I
        '#facc15', // O
        '#c084fc', // T
        '#fb923c', // L
        '#60a5fa', // J
        '#4ade80', // S
        '#f87171'  // Z
    ];

    let score = 0;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let isPaused = false;
    let gameOver = false;

    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        shapeIndex: 0
    };

    function createPiece(type) {
        // Clonamos profundamente la matriz para no alterar la original de SHAPES
        return SHAPES[type].map(row => [...row]);
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            });
        });
    }

    function draw() {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawMatrix(board, { x: 0, y: 0 });
        drawMatrix(player.matrix, player.pos);

        if (isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
        }
    }

    function merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function rotate(matrix, dir) {
        // Clonamos la matriz actual antes de transformarla para evitar corrupción de datos
        const clonedMatrix = matrix.map(row => [...row]);
        const n = clonedMatrix.length;

        // Matriz transpuesta
        for (let y = 0; y < n; ++y) {
            for (let x = 0; x < y; ++x) {
                [clonedMatrix[x][y], clonedMatrix[y][x]] = [clonedMatrix[y][x], clonedMatrix[x][y]];
            }
        }

        // Invertir filas o columnas según la dirección
        if (dir > 0) {
            clonedMatrix.forEach(row => row.reverse());
        } else {
            clonedMatrix.reverse();
        }

        return clonedMatrix;
    }

    function playerRotate(dir) {
        const posX = player.pos.x;
        let offset = 1;
        
        // Guardamos una copia de seguridad por si hay colisión
        const originalMatrix = player.matrix;
        player.matrix = rotate(player.matrix, dir);

        while (collide(board, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                // Si no hay espacio para encajarla, revertimos la rotación
                player.matrix = originalMatrix;
                player.pos.x = posX;
                return;
            }
        }
    }

    function collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            merge(board, player);
            playerReset();
            sweepBoard();
            updateScore();
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(board, player)) {
            player.pos.x -= dir;
        }
    }

    function playerReset() {
        const pieces = '1234567';
        const rand = Math.floor(Math.random() * pieces.length);
        player.matrix = createPiece(parseInt(pieces[rand]));
        player.pos.y = 0;
        player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

        if (collide(board, player)) {
            gameOver = true;
            handleGameOver();
        }
    }

    function sweepBoard() {
        let rowCount = 1;
        outer: for (let y = ROWS - 1; y > 0; --y) {
            for (let x = 0; x < COLS; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            ++y;
            score += rowCount * 100;
            rowCount *= 2;
        }
    }

    function updateScore() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = score;
    }

    function handleGameOver() {
        pendingScore = score;
        const scoreVal = document.getElementById('final-score-val');
        if (scoreVal) scoreVal.innerText = score;

        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.add('active');

        const nameInput = document.getElementById('player-name-input');
        if (nameInput) nameInput.focus();
    }

    window.handleScoreSubmit = async function(event) {
        event.preventDefault();
        const nameInput = document.getElementById('player-name-input');
        const username = nameInput ? nameInput.value.trim() || 'Jugador Anónimo' : 'Jugador Anónimo';

        await saveScore(username, pendingScore);

        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        if (nameInput) nameInput.value = '';

        resetGame();
    };

    window.skipScoreSave = function() {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');

        const nameInput = document.getElementById('player-name-input');
        if (nameInput) nameInput.value = '';

        resetGame();
    };

    function resetGame() {
        board.forEach(row => row.fill(0));
        score = 0;
        updateScore();
        gameOver = false;
        isPaused = false;
        playerReset();
    }

    async function saveScore(username, score) {
        try {
            await fetch(`${API_URL}/api/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, game: 'tetris', score })
            });
        } catch (error) {
            console.error('Error al guardar puntuación:', error);
        }
    }

    function gameLoop(time = 0) {
        if (gameOver) return;

        const deltaTime = time - lastTime;
        lastTime = time;

        if (!isPaused) {
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
        }

        draw();
        requestAnimationFrame(gameLoop);
    }

    // Controles de teclado
    document.addEventListener('keydown', event => {
        if (event.key === 'p' || event.key === 'P') {
            isPaused = !isPaused;
            return;
        }

        if (isPaused || gameOver) return;

        if (event.key === 'ArrowLeft') {
            playerMove(-1);
        } else if (event.key === 'ArrowRight') {
            playerMove(1);
        } else if (event.key === 'ArrowDown') {
            playerDrop();
        } else if (event.key === 'q' || event.key === 'Q') {
            playerRotate(-1);
        } else if (event.key === 'w' || event.key === 'W') {
            playerRotate(1);
        }
    });

    // Iniciar juego
    resetGame();
    gameLoop();
});