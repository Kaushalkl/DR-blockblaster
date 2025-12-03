class BlockBlaster {
    constructor() {
        this.level = 1;
        this.maxLevel = 50;
        this.score = 0;
        this.grid = [];
        this.gridWidth = 10;
        this.gridHeight = 12;
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.selectedBlocks = [];
        this.isAnimating = false;
        this.isMobile = this.detectMobile();
        
        this.initializeGame();
        this.setupEventListeners();
        this.audioContext = null;
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    playSound(frequency, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }


    

    initializeGame() {
        this.generateLevel();
        this.renderGrid();
        this.updateDisplay();
    
        
        if (this.isMobile) {
            document.getElementById('mobileControls').style.display = 'flex';
        }
    }

    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => {
            document.getElementById('firstScreen').style.display = 'none';
            document.getElementById('secondScreen').style.display = 'block';
        });

        document.getElementById('nextLevelButton').addEventListener('click', () => {
            this.nextLevel();
        });

        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('hintButton').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetLevel();
        });
    }

    generateLevel() {
        this.grid = [];
        
        // Adjust grid size for mobile
        if (window.innerWidth <= 768) {
            this.gridWidth = 50;
            this.gridHeight = 50;
        }
        if (window.innerWidth <= 480) {
            this.gridWidth = 15;
            this.gridHeight = 12;
        }

        // Calculate difficulty based on level
        const difficulty = Math.min(this.level, 20);
        const colorCount = Math.min(3 + Math.floor(difficulty / 5), this.colors.length);
        const densityFactor = 0.7 + (difficulty * 0.01);

        for (let row = 0; row < this.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                if (Math.random() < densityFactor) {
                    const colorIndex = Math.floor(Math.random() * colorCount);
                    this.grid[row][col] = this.colors[colorIndex];
                } else {
                    this.grid[row][col] = null;
                }
            }
        }

        // Ensure the level is solvable by creating some guaranteed groups
        this.ensureSolvability();
    }

    ensureSolvability() {
        const guaranteedGroups = Math.max(2, Math.floor(this.level / 10));
        
        for (let i = 0; i < guaranteedGroups; i++) {
            const row = Math.floor(Math.random() * (this.gridHeight - 1));
            const col = Math.floor(Math.random() * (this.gridWidth - 1));
            const color = this.colors[Math.floor(Math.random() * 3)];
            
            // Create a 2x2 group
            this.grid[row][col] = color;
            this.grid[row][col + 1] = color;
            this.grid[row + 1][col] = color;
            this.grid[row + 1][col + 1] = color;
        }
    }

    renderGrid() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        // Update grid template based on current dimensions
        gameBoard.style.gridTemplateColumns = `repeat(${this.gridWidth}, ${this.isMobile ? '35px' : '40px'})`;
        gameBoard.style.gridTemplateRows = `repeat(${this.gridHeight}, ${this.isMobile ? '40px' : '35px'})`;

        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const blockElement = document.createElement('div');
                blockElement.className = 'block';
                blockElement.dataset.row = row;
                blockElement.dataset.col = col;

                if (this.grid[row][col]) {
                    blockElement.classList.add(this.grid[row][col]);
                    blockElement.addEventListener('click', (e) => this.handleBlockClick(e));
                    blockElement.addEventListener('mouseenter', (e) => this.handleBlockHover(e));
                    blockElement.addEventListener('mouseleave', () => this.clearHighlight());
                } else {
                    blockElement.style.visibility = 'hidden';
                }

                gameBoard.appendChild(blockElement);
            }
        }
    }

    handleBlockClick(event) {
        if (this.isAnimating) return;

        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        const connectedBlocks = this.getConnectedBlocks(row, col);
        
        if (connectedBlocks.length >= 2) {
            this.removeBlocks(connectedBlocks);
        }
    }

    handleBlockHover(event) {
        if (this.isAnimating) return;

        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        this.clearHighlight();
        const connectedBlocks = this.getConnectedBlocks(row, col);
        
        if (connectedBlocks.length >= 2) {
            this.highlightBlocks(connectedBlocks);
        }
    }

    getConnectedBlocks(startRow, startCol) {
        const color = this.grid[startRow][startCol];
        if (!color) return [];

        const visited = new Set();
        const connectedBlocks = [];
        const queue = [[startRow, startCol]];

        while (queue.length > 0) {
            const [row, col] = queue.shift();
            const key = `${row}-${col}`;

            if (visited.has(key)) continue;
            if (row < 0 || row >= this.gridHeight || col < 0 || col >= this.gridWidth) continue;
            if (this.grid[row][col] !== color) continue;

            visited.add(key);
            connectedBlocks.push({row, col});

            // Check adjacent cells
            queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
        }

        return connectedBlocks;
    }

    highlightBlocks(blocks) {
        blocks.forEach(block => {
            const element = document.querySelector(`[data-row="${block.row}"][data-col="${block.col}"]`);
            if (element) {
                element.classList.add('highlighted');
            }
        });
    }

    clearHighlight() {
        document.querySelectorAll('.block.highlighted').forEach(block => {
            block.classList.remove('highlighted');
        });
    }

    removeBlocks(blocks) {
        this.isAnimating = true;
        this.clearHighlight();

        // Calculate score
        const points = blocks.length * blocks.length * 10 * this.level;
        this.score += points;

        // Animate removal
        blocks.forEach(block => {
            const element = document.querySelector(`[data-row="${block.row}"][data-col="${block.col}"]`);
            if (element) {
                element.classList.add('removing');
            }
            this.grid[block.row][block.col] = null;
        });

        setTimeout(() => {
            this.applyGravity();
            this.compactColumns();
            this.renderGrid();
            this.updateDisplay();
            this.checkGameState();
            this.isAnimating = false;
        }, 500);
    }

    applyGravity() {
        for (let col = 0; col < this.gridWidth; col++) {
            const column = [];
            
            // Collect non-null blocks from bottom to top
            for (let row = this.gridHeight - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    column.push(this.grid[row][col]);
                }
            }

            // Clear the column
            for (let row = 0; row < this.gridHeight; row++) {
                this.grid[row][col] = null;
            }

            // Place blocks from bottom up
            for (let i = 0; i < column.length; i++) {
                this.grid[this.gridHeight - 1 - i][col] = column[i];
            }
        }
    }

    compactColumns() {
        const newGrid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            newGrid[row] = [];
        }

        let newCol = 0;
        for (let col = 0; col < this.gridWidth; col++) {
            let hasBlocks = false;
            
            // Check if column has any blocks
            for (let row = 0; row < this.gridHeight; row++) {
                if (this.grid[row][col] !== null) {
                    hasBlocks = true;
                    break;
                }
            }

            if (hasBlocks) {
                // Copy column to new position
                for (let row = 0; row < this.gridHeight; row++) {
                    newGrid[row][newCol] = this.grid[row][col];
                }
                newCol++;
            }
        }

        // Fill remaining columns with null
        for (let col = newCol; col < this.gridWidth; col++) {
            for (let row = 0; row < this.gridHeight; row++) {
                newGrid[row][col] = null;
            }
        }

        this.grid = newGrid;
    }

    checkGameState() {
        const hasBlocks = this.grid.some(row => row.some(cell => cell !== null));
        
        if (!hasBlocks) {
            // Level completed
            this.showGameOver(true);
        } else if (!this.hasValidMoves()) {
            // No valid moves left
            this.showGameOver(false);
        }
    }

    hasValidMoves() {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                if (this.grid[row][col]) {
                    const connectedBlocks = this.getConnectedBlocks(row, col);
                    if (connectedBlocks.length >= 2) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    showGameOver(levelCompleted) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const nextButton = document.getElementById('nextLevelButton');
        const finalScore = document.getElementById('finalScore');

        finalScore.textContent = this.score;

        if (levelCompleted) {
            if (this.level >= this.maxLevel) {
                title.textContent = 'Game Complete!';
                message.textContent = 'Congratulations! You completed all 50 levels!';
                nextButton.style.display = 'none';
            } else {
                title.textContent = 'Level Complete!';
                message.textContent = `Great job! You cleared level ${this.level}!`;
                nextButton.style.display = 'inline-block';
            }
        } else {
            title.textContent = 'Game Over';
            message.textContent = 'No more valid moves! Try again?';
            nextButton.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    nextLevel() {
        this.level++;
        document.getElementById('gameOverModal').style.display = 'none';
        this.generateLevel();
        this.renderGrid();
        this.updateDisplay();
    }

    resetGame() {
        this.level = 1;
        this.score = 0;
        document.getElementById('gameOverModal').style.display = 'none';
        this.generateLevel();
        this.renderGrid();
        this.updateDisplay();
    }

    resetLevel() {
        this.generateLevel();
        this.renderGrid();
        this.updateDisplay();
    }

    showHint() {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                if (this.grid[row][col]) {
                    const connectedBlocks = this.getConnectedBlocks(row, col);
                    if (connectedBlocks.length >= 2) {
                        this.highlightBlocks(connectedBlocks);
                        setTimeout(() => this.clearHighlight(), 2000);
                        return;
                    }
                }
            }
        }
    }

    updateDisplay() {
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('scoreDisplay').textContent = this.score;
        
        const blocksLeft = this.grid.flat().filter(cell => cell !== null).length;
        document.getElementById('blocksLeftDisplay').textContent = blocksLeft;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BlockBlaster();
});