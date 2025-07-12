const pipePlaceSound = new Audio('placing_block.wav');

const pipeTypes = [
  { type: "straight-horizontal", directions: [[0, -1], [0, 1]] },
  { type: "straight-vertical", directions: [[-1, 0], [1, 0]] },
  { type: "corner-tl", directions: [[1, 0], [0, 1]] },
  { type: "corner-tr", directions: [[1, 0], [0, -1]] },
  { type: "corner-bl", directions: [[-1, 0], [0, 1]] },
  { type: "corner-br", directions: [[-1, 0], [0, -1]] },
  { type: "cross", directions: [[-1, 0], [1, 0], [0, -1], [0, 1]] }
];

const startPipeType = { type: "start-pipe", directions: [[-1, 0], [1, 0], [0, -1], [0, 1]] };
const endPipeType = { type: "end-pipe", directions: [[-1, 0], [1, 0], [0, -1], [0, 1]] };

const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true;
// backgroundMusic.volume = 0.5; // Adjust volume as needed

window.addEventListener('DOMContentLoaded', () => {
  backgroundMusic.play().catch(() => {
    // Some browsers require user interaction before playing audio
    document.body.addEventListener('click', () => {
      backgroundMusic.play();
    }, { once: true });
  });
});

const winningSound = new Audio('winning.mp3');

let score = 0;
let timeLeft = 60;
let gameRunning = false;
let checkInterval;
const startPos = [0, 0];
const endPos = [9, 9];

const grid = document.getElementById("grid");
const inventory = document.getElementById("inventory");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const finalScore = document.getElementById("finalScore");
const gameOverScreen = document.getElementById("gameOverScreen");

function createPipeInventory(type) {
  const div = document.createElement("div");
  div.className = `pipe-inventory ${type}`;
  div.setAttribute("draggable", "true");
  div.setAttribute("data-type", type);
  div.addEventListener("dragstart", () => div.classList.add("dragging"));
  div.addEventListener("dragend", () => div.classList.remove("dragging"));
  return div;
}

function createPipe(type) {
  const div = document.createElement("div");
  div.className = `pipe ${type}`;
  div.setAttribute("data-type", type);
  return div;
}

function generateInventory() {
  inventory.innerHTML = "";
  for (let i = 0; i < 40; i++) {
    const random = pipeTypes[Math.floor(Math.random() * pipeTypes.length)];
    inventory.appendChild(createPipeInventory(random.type));
  }
}

function getCell(r, c) {
  return grid.querySelector(`[data-row='${r}'][data-col='${c}']`);
}

function createGrid() {
  grid.innerHTML = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener("dragover", e => gameRunning && e.preventDefault());
      cell.addEventListener("drop", e => {
        if (!gameRunning) return;
        const dragging = document.querySelector(".dragging");
        if (!dragging || cell.querySelector(".pipe")) return;
        const type = dragging.getAttribute("data-type");
        const pipe = createPipe(type);
        cell.appendChild(pipe);
        dragging.remove();
        score++;
        scoreDisplay.textContent = score;
        // Play sound effect when a pipe is placed
        pipePlaceSound.currentTime = 0;
        pipePlaceSound.play();
      });
      grid.appendChild(cell);
    }
  }
  getCell(...startPos).appendChild(createPipe("start-pipe"));
  getCell(...endPos).appendChild(createPipe("end-pipe"));
}

function getPipeDirections(type) {
  if (type === "start-pipe") return startPipeType.directions;
  if (type === "end-pipe") return endPipeType.directions;
  const pipe = pipeTypes.find(p => p.type === type);
  return pipe ? pipe.directions : [];
}

function checkPipes() {
  const visited = Array.from({ length: 10 }, () => Array(10).fill(false));
  const queue = [startPos];
  visited[startPos[0]][startPos[1]] = true;

  while (queue.length) {
    const [r, c] = queue.shift();
    if (r === endPos[0] && c === endPos[1]) {
  if (!getCell(r, c).classList.contains("success")) {
    score += 10;
    scoreDisplay.textContent = score;
  }
  getCell(r, c).classList.add("success");
  return;
}
    const cell = getCell(r, c);
    const pipe = cell.querySelector(".pipe");
    if (!pipe) continue;
    const directions = getPipeDirections(pipe.dataset.type);

    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && !visited[nr][nc]) {
        const next = getCell(nr, nc);
        const nextPipe = next.querySelector(".pipe");
        if (!nextPipe) continue;
        const nextDirs = getPipeDirections(nextPipe.dataset.type);
        if (nextDirs.some(([ndr, ndc]) => nr + ndr === r && nc + ndc === c)) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
  }
}

let difficulty = "medium"; // default

function startGame(selectedDifficulty = "medium") {
  difficulty = selectedDifficulty;
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  gameRunning = true;
  score = 0;

  // Set time and inventory size based on difficulty
  if (difficulty === "easy") {
    timeLeft = 90;
    inventorySize = 60;
  } else if (difficulty === "medium") {
    timeLeft = 60;
    inventorySize = 40;
  } else if (difficulty === "hard") {
    timeLeft = 40;
    inventorySize = 25;
  }

  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;
  createGrid();
  generateInventory();
  checkInterval = setInterval(() => {
    if (--timeLeft <= 0) {
      endGame();
    } else {
      timerDisplay.textContent = timeLeft;
      checkPipes();
    }
  }, 1000);
}

// Update generateInventory to use inventorySize
let inventorySize = 40; // default

function generateInventory() {
  inventory.innerHTML = "";
  for (let i = 0; i < inventorySize; i++) {
    const random = pipeTypes[Math.floor(Math.random() * pipeTypes.length)];
    inventory.appendChild(createPipeInventory(random.type));
  }
}

function restartGame() {
  clearInterval(checkInterval);
  gameRunning = true;
  score = 0;
  timeLeft = 60;
  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  createGrid();
  generateInventory();
  checkInterval = setInterval(() => {
    if (--timeLeft <= 0) {
      endGame();
    } else {
      timerDisplay.textContent = timeLeft;
      checkPipes();
    }
  }, 1000);
}

function endGame() {
  clearInterval(checkInterval);
  gameRunning = false;
  document.getElementById("gameContainer").style.display = "none";
  gameOverScreen.style.display = "block";
  finalScore.textContent = `Final Score: ${score}`;
  showConfetti(); // Show confetti when game ends
  winningSound.currentTime = 0;
  winningSound.play();
}

// This function creates simple confetti using colored divs
function showConfetti() {
  // Create 50 confetti pieces
  for (let i = 0; i < 50; i++) {
    // Create a div for each confetti piece
    const confetti = document.createElement('div');
    // Give it a class for styling
    confetti.className = 'confetti';
    // Random horizontal position (0% to 100%)
    confetti.style.left = `${Math.random() * 100}%`;
    // Random color
    const colors = ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32', '#FF8C00'];
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    // Random size
    const size = Math.random() * 8 + 8; // 8px to 16px
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    // Random delay for falling
    confetti.style.animationDelay = `${Math.random()}s`;
    // Add to the body
    document.body.appendChild(confetti);

    // Remove confetti after animation ends (3 seconds)
    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }
}