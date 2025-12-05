const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 15, paddleHeight = 80;
let playerY = canvas.height / 2 - paddleHeight / 2;
let opponentY = canvas.height / 2 - paddleHeight / 2;
let playerSpeed = 4;
let playerDirection = 1;
let isHolding = false;

const ballSize = 12;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 4, ballSpeedY = 3;

let score = 0;
let leaderboard = JSON.parse(localStorage.getItem("pongLeaderboard")) || [];

const scoreElement = document.getElementById("score");
const leaderboardElement = document.getElementById("leaderboard");
const gameOverScreen = document.getElementById("gameOverScreen");
const retryBtn = document.getElementById("retryBtn");

let gameStarted = false;
let gameOver = false;

// Load sounds
const bounceSound = new Audio("bounce.mp3");
const loseSound = new Audio("lose.mp3");

function playBounce() {
    bounceSound.currentTime = 0;
    bounceSound.play();
}

function playLose() {
    loseSound.currentTime = 0;
    loseSound.play();
}

function update() {
    if (!gameStarted || gameOver) return;

    // Player movement
    if (!isHolding) {
        playerY += playerSpeed * playerDirection;

        // Bounce off walls
        if (playerY < 0) {
            playerY = 0;
            playerDirection = 1;
            playBounce();
        }
        if (playerY + paddleHeight > canvas.height) {
            playerY = canvas.height - paddleHeight;
            playerDirection = -1;
            playBounce();
        }
    }

    // Opponent AI
    if (ballY < opponentY + paddleHeight / 2) opponentY -= playerSpeed;
    else if (ballY > opponentY + paddleHeight / 2) opponentY += playerSpeed;
    if (opponentY < 0) opponentY = 0;
    if (opponentY + paddleHeight > canvas.height) opponentY = canvas.height - paddleHeight;

    // Ball movement
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Bounce off top/bottom
    if (ballY < 0 || ballY > canvas.height) {
        ballSpeedY *= -1;
        playBounce();
    }

    // Bounce off player paddle
    if (ballX < paddleWidth && ballY > playerY && ballY < playerY + paddleHeight) {
        ballSpeedX *= -1;
        score++;
        updateScore();
        playBounce();
    }

    // Bounce off opponent paddle
    if (ballX > canvas.width - paddleWidth && ballY > opponentY && ballY < opponentY + paddleHeight) {
        ballSpeedX *= -1;
        playBounce();
    }

    // Reset ball if out of bounds (player loses)
    if (ballX < 0 || ballX > canvas.width) {
        saveScore(score);
        score = 0;
        updateScore();
        showGameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player paddle
    ctx.fillStyle = "white";
    ctx.fillRect(0, playerY, paddleWidth, paddleHeight);

    // Opponent paddle
    ctx.fillRect(canvas.width - paddleWidth, opponentY, paddleWidth, paddleHeight);

    // Ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

function saveScore(score) {
    if (score > 0) {
        const now = new Date();
        const entry = { score: score, date: now.toLocaleString() };
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem("pongLeaderboard", JSON.stringify(leaderboard));
        renderLeaderboard();
    }
}

function renderLeaderboard() {
    leaderboardElement.innerHTML = "";
    leaderboard.slice(0, 5).forEach((entry, i) => {
        const li = document.createElement("li");
        li.textContent = `${i + 1}. ${entry.score} (${entry.date})`;
        leaderboardElement.appendChild(li);
    });
}

function showGameOver() {
    gameOver = true;
    gameOverScreen.style.display = "flex";
    playLose(); // play lose sound
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    playerY = canvas.height / 2 - paddleHeight / 2;
    opponentY = canvas.height / 2 - paddleHeight / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 4;
    ballSpeedY = 3;
    gameOverScreen.style.display = "none";
}

retryBtn.addEventListener("click", resetGame);

// Controls
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (!gameStarted && !gameOver) {
            gameStarted = true;
        } else if (!gameOver) {
            if (!isHolding) {
                playerDirection *= -1;
            }
            isHolding = true;
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
        isHolding = false;
    }
});

renderLeaderboard();
gameLoop();
