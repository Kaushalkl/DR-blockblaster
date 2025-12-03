class BlockBlasterGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('blockBlasterBest')) || 0;
        this.targetScore = 1000;
        this.grid = Array(10).fill().map(() => Array(10).fill(0));
        this.currentPieces = [];
        this.isDragging = false;
        this.draggedPiece = null;
        this.isMobile = this.detectMobile();
        
        this.pieceShapes = [
            // Single block
            [[1]],
            // Line pieces
            [[1, 1]],
            [[1], [1]],
            [[1, 1, 1]],
            [[1], [1], [1]],
            [[1, 1, 1, 1]],
            [[1], [1], [1], [1]],
            [[1, 1, 1, 1, 1]],
            [[1], [1], [1], [1], [1]],
            // L shapes
            [[1, 1], [1, 0]],
            [[1, 0], [1, 1]],
            [[1, 1], [0, 1]],
            [[0, 1], [1, 1]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 0, 0], [1, 1, 1]],
            [[0, 0, 1], [1, 1, 1]],
            [[1, 1, 1], [0, 0, 1]],
            // Squares
            [[1, 1], [1, 1]],
            [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            // T shapes
            [[1, 1, 1], [0, 1, 0]],
            [[0, 1], [1, 1], [0, 1]],
            [[0, 1, 0], [1, 1, 1]],
            [[1, 0], [1, 1], [1, 0]],
            // Z shapes
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1], [1, 1], [1, 0]],
            [[0, 1, 1], [1, 1, 0]],
            [[1, 0], [1, 1], [0, 1]]
        ];
        
        this.colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6'];
        
        this.initGame();
        this.createAudioContext();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    createAudioContext() {
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    initGame() {
        this.createGrid();
        this.generateNewPieces();
        this.updateDisplay();
        this.setupEventListeners();
        
        if (this.isMobile) {
            document.getElementById('mobileControls').style.display = 'block';
        }
    }
    
    createGrid() {
        const gridElement = document.getElementById('gameGrid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridElement.appendChild(cell);
            }
        }
    }
    
    generateNewPieces() {
        this.currentPieces = [];
        
        for (let i = 0; i < 3; i++) {
            const shapeIndex = Math.floor(Math.random() * this.pieceShapes.length);
            const colorIndex = Math.floor(Math.random() * this.colors.length);
            
            const piece = {
                shape: this.pieceShapes[shapeIndex],
                color: this.colors[colorIndex],
                id: i,
                used: false
            };
            
            this.currentPieces.push(piece);
            this.renderPiece(piece, i);
        }
    }
    
    renderPiece(piece, containerId) {
        const container = document.getElementById(`piece${containerId + 1}`);
        container.innerHTML = '';
        
        if (piece.used) return;
        
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';
        pieceElement.dataset.pieceId = piece.id;
        
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        
        pieceElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        pieceElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const block = document.createElement('div');
                if (piece.shape[row][col]) {
                    block.className = `piece-block ${piece.color}`;
                } else {
                    block.style.visibility = 'hidden';
                }
                pieceElement.appendChild(block);
            }
        }
        
        container.appendChild(pieceElement);
        this.addPieceEventListeners(pieceElement, piece);
    }
    
    addPieceEventListeners(element, piece) {
        if (this.isMobile) {
            element.addEventListener('touchstart', (e) => this.startDrag(e, piece));
            element.addEventListener('touchmove', (e) => this.drag(e));
            element.addEventListener('touchend', (e) => this.endDrag(e));
        } else {
            element.addEventListener('mousedown', (e) => this.startDrag(e, piece));
            element.addEventListener('mousemove', (e) => this.drag(e));
            element.addEventListener('mouseup', (e) => this.endDrag(e));
        }
    }
    
    startDrag(e, piece) {
        if (piece.used) return;
        
        e.preventDefault();
        this.isDragging = true;
        this.draggedPiece = piece;
        
        const element = e.target.closest('.piece');
        element.classList.add('dragging');
        
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));
        document.addEventListener('touchend', (e) => this.endDrag(e));
    }
    
    drag(e) {
        if (!this.isDragging || !this.draggedPiece) return;
        
        e.preventDefault();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (!clientX || !clientY) return;
        
        const element = document.querySelector('.piece.dragging');
        if (element) {
            element.style.left = clientX - 50 + 'px';
            element.style.top = clientY - 50 + 'px';
        }
        
        const gridPosition = this.getGridPosition(clientX, clientY);
        this.showPreview(gridPosition);
    }
    
    endDrag(e) {
        if (!this.isDragging || !this.draggedPiece) return;
        
        const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
        
        const gridPosition = this.getGridPosition(clientX, clientY);
        
        if (gridPosition && this.canPlacePiece(this.draggedPiece, gridPosition.row, gridPosition.col)) {
            this.placePiece(this.draggedPiece, gridPosition.row, gridPosition.col);
            this.playSound(440, 0.2);
        } else {
            this.playSound(220, 0.3);
        }
        
        this.clearPreview();
        this.isDragging = false;
        
        const element = document.querySelector('.piece.dragging');
        if (element) {
            element.classList.remove('dragging');
            element.style.left = '';
            element.style.top = '';
        }
        
        this.draggedPiece = null;
        
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('mouseup', this.endDrag);
        document.removeEventListener('touchmove', this.drag);
        document.removeEventListener('touchend', this.endDrag);
    }
    
    getGridPosition(clientX, clientY) {
        const gridElement = document.getElementById('gameGrid');
        const rect = gridElement.getBoundingClientRect();
        
        if (clientX < rect.left || clientX > rect.right || 
            clientY < rect.top || clientY > rect.bottom) {
            return null;
        }
        
        const cellWidth = rect.width / 10;
        const cellHeight = rect.height / 10;
        
        const col = Math.floor((clientX - rect.left) / cellWidth);
        const row = Math.floor((clientY - rect.top) / cellHeight);
        
        return { row, col };
    }
    
    showPreview(gridPosition) {
        this.clearPreview();
        
        if (!gridPosition || !this.draggedPiece) return;
        
        const canPlace = this.canPlacePiece(this.draggedPiece, gridPosition.row, gridPosition.col);
        const className = canPlace ? 'preview' : 'invalid';
        
        for (let row = 0; row < this.draggedPiece.shape.length; row++) {
            for (let col = 0; col < this.draggedPiece.shape[0].length; col++) {
                if (this.draggedPiece.shape[row][col]) {
                    const gridRow = gridPosition.row + row;
                    const gridCol = gridPosition.col + col;
                    
                    if (gridRow >= 0 && gridRow < 10 && gridCol >= 0 && gridCol < 10) {
                        const cell = document.querySelector(`[data-row="${gridRow}"][data-col="${gridCol}"]`);
                        if (cell) {
                            cell.classList.add(className);
                        }
                    }
                }
            }
        }
    }
    
    clearPreview() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('preview', 'invalid');
        });
    }
    
    canPlacePiece(piece, startRow, startCol) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[0].length; col++) {
                if (piece.shape[row][col]) {
                    const gridRow = startRow + row;
                    const gridCol = startCol + col;
                    
                    if (gridRow < 0 || gridRow >= 10 || gridCol < 0 || gridCol >= 10) {
                        return false;
                    }
                    
                    if (this.grid[gridRow][gridCol] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece(piece, startRow, startCol) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[0].length; col++) {
                if (piece.shape[row][col]) {
                    const gridRow = startRow + row;
                    const gridCol = startCol + col;
                    this.grid[gridRow][gridCol] = piece.color;
                    
                    const cell = document.querySelector(`[data-row="${gridRow}"][data-col="${gridCol}"]`);
                    if (cell) {
                        cell.classList.add('filled', piece.color, 'placed');
                    }
                }
            }
        }
        
        piece.used = true;
        this.renderPiece(piece, piece.id);
        
        const clearedLines = this.checkAndClearLines();
        if (clearedLines > 0) {
            this.score += clearedLines * 100 * this.level;
            this.playSound(660, 0.4);
        }
        
        this.updateDisplay();
        
        if (this.allPiecesUsed()) {
            this.generateNewPieces();
        }
        
        if (this.score >= this.targetScore) {
            this.levelComplete();
        }
        
        if (this.isGameOver()) {
            this.gameOver();
        }
    }
    
    checkAndClearLines() {
        let clearedLines = 0;
        let linesToClear = [];
        
        // Check rows
        for (let row = 0; row < 10; row++) {
            if (this.grid[row].every(cell => cell !== 0)) {
                linesToClear.push({type: 'row', index: row});
            }
        }
        
        // Check columns
        for (let col = 0; col < 10; col++) {
            if (this.grid.every(row => row[col] !== 0)) {
                linesToClear.push({type: 'col', index: col});
            }
        }
        
        // Clear lines with animation
        linesToClear.forEach(line => {
            if (line.type === 'row') {
                for (let col = 0; col < 10; col++) {
                    this.grid[line.index][col] = 0;
                    const cell = document.querySelector(`[data-row="${line.index}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('clearing');
                        setTimeout(() => {
                            cell.className = 'grid-cell';
                        }, 500);
                    }
                }
            } else {
                for (let row = 0; row < 10; row++) {
                    this.grid[row][line.index] = 0;
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${line.index}"]`);
                    if (cell) {
                        cell.classList.add('clearing');
                        setTimeout(() => {
                            cell.className = 'grid-cell';
                        }, 500);
                    }
                }
            }
            clearedLines++;
        });
        
        return clearedLines;
    }
    
    allPiecesUsed() {
        return this.currentPieces.every(piece => piece.used);
    }
    
    isGameOver() {
        return this.currentPieces.every(piece => piece.used || !this.canPlaceAnywhere(piece));
    }
    
    canPlaceAnywhere(piece) {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.canPlacePiece(piece, row, col)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    levelComplete() {
        this.level++;
        this.targetScore = this.level * 1000;
        this.showGameOverPopup(false);
    }
    
    gameOver() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('blockBlasterBest', this.bestScore.toString());
        }
        this.showGameOverPopup(true);
    }
    
    showGameOverPopup(isGameOver) {
        const popup = document.getElementById('gameOverPopup');
        const title = document.getElementById('gameOverTitle');
        const playAgainBtn = document.getElementById('playAgainButton');
        
        if (isGameOver) {
            title.textContent = 'Game Over!';
            playAgainBtn.textContent = 'Play Again';
        } else {
            title.textContent = 'Level Complete!';
            playAgainBtn.textContent = 'Next Level';
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        
        popup.style.display = 'flex';
        
        if (isGameOver) {
            this.playSound(200, 1);
        } else {
            this.playSound(800, 0.5);
        }
    }
    
    updateDisplay() {
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('targetDisplay').textContent = this.targetScore;
        document.getElementById('bestDisplay').textContent = this.bestScore;
    }
    
    resetGame() {
        this.level = 1;
        this.score = 0;
        this.targetScore = 1000;
        this.grid = Array(10).fill().map(() => Array(10).fill(0));
        this.createGrid();
        this.generateNewPieces();
        this.updateDisplay();
        document.getElementById('gameOverPopup').style.display = 'none';
    }
    
    nextLevel() {
        this.generateNewPieces();
        this.updateDisplay();
        document.getElementById('gameOverPopup').style.display = 'none';
    }
    
    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => {
            document.getElementById('firstScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'block';
            
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        });
        
        document.getElementById('playAgainButton').addEventListener('click', () => {
            const title = document.getElementById('gameOverTitle').textContent;
            if (title === 'Level Complete!') {
                this.nextLevel();
            } else {
                this.resetGame();
            }
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.resetGame();
        });
        
        if (this.isMobile) {
            document.getElementById('rotateButton').addEventListener('click', () => {
                // Rotation functionality could be added here
                this.playSound(330, 0.2);
            });
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new BlockBlasterGame();
});