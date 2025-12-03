class BlockBlaster {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.nextCanvas = null;
        this.nextCtx = null;
        this.blockSize = 30;
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.dropTime = 0;
        this.dropInterval = 800;
        this.isMobile = this.detectMobile();
        
        this.pieces = [
            // I piece
            {
                shape: [[1,1,1,1]],
                color: '#00f5ff'
            },
            // O piece
            {
                shape: [[1,1],[1,1]],
                color: '#ffff00'
            },
            // T piece
            {
                shape: [[0,1,0],[1,1,1]],
                color: '#800080'
            },
            // S piece
            {
                shape: [[0,1,1],[1,1,0]],
                color: '#00ff00'
            },
            // Z piece
            {
                shape: [[1,1,0],[0,1,1]],
                color: '#ff0000'
            },
            // J piece
            {
                shape: [[1,0,0],[1,1,1]],
                color: '#0000ff'
            },
            // L piece
            {
                shape: [[0,0,1],[1,1,1]],
                color: '#ffa500'
            }
        ];
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    init() {
        this.setupEventListeners();
        this.initBoard();
    }
    
    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
            }
        });
        
        // Mobile controls
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }
    
    setupMobileControls() {
        document.getElementById('leftBtn').addEventListener('click', () => {
            if (this.gameRunning) this.movePiece(-1, 0);
        });
        
        document.getElementById('rightBtn').addEventListener('click', () => {
            if (this.gameRunning) this.movePiece(1, 0);
        });
        
        document.getElementById('downBtn').addEventListener('click', () => {
            if (this.gameRunning) this.movePiece(0, 1);
        });
        
        document.getElementById('upBtn').addEventListener('click', () => {
            if (this.gameRunning) this.rotatePiece();
        });
        
        document.getElementById('rotateBtn').addEventListener('click', () => {
            if (this.gameRunning) this.rotatePiece();
        });
    }
    
    initBoard() {
        this.board = [];
        for (let y = 0; y < this.boardHeight; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.boardWidth; x++) {
                this.board[y][x] = 0;
            }
        }
    }







    
    
    startGame() {
        document.getElementById('firstScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        
        if (this.isMobile) {
            document.getElementById('mobileControls').style.display = 'flex';
        }
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPieceCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.initBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = true;
        this.dropTime = 0;
        
        this.spawnPiece();
        this.spawnNextPiece();
        this.updateUI();
        this.gameLoop();
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = this.createPiece();
        }
        this.currentPiece.x = Math.floor(this.boardWidth / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;
        
        if (this.checkCollision()) {
            this.gameOver();
        }
    }
    
    spawnNextPiece() {
        this.nextPiece = this.createPiece();
        this.drawNextPiece();
    }
    
    createPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        const piece = JSON.parse(JSON.stringify(this.pieces[pieceIndex]));
        piece.x = 0;
        piece.y = 0;
        return piece;
    }
    
    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                this.placePiece();
                this.clearLines();
                this.spawnPiece();
                this.spawnNextPiece();
            }
        }
    }
    
    rotatePiece() {
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = this.rotateMatrix(this.currentPiece.shape);
        
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= this.boardWidth || 
                        newY >= this.boardHeight || 
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            let fullLine = true;
            for (let x = 0; x < this.boardWidth; x++) {
                if (!this.board[y][x]) {
                    fullLine = false;
                    break;
                }
            }
            
            if (fullLine) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.boardWidth).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateUI();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(x * this.blockSize, y * this.blockSize, 
                                    this.blockSize - 1, this.blockSize - 1);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            this.ctx.fillStyle = this.currentPiece.color;
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const drawX = (this.currentPiece.x + x) * this.blockSize;
                        const drawY = (this.currentPiece.y + y) * this.blockSize;
                        this.ctx.fillRect(drawX, drawY, this.blockSize - 1, this.blockSize - 1);
                    }
                }
            }
        }
        
        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.boardWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.boardHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#111';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            this.nextCtx.fillStyle = this.nextPiece.color;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * 20) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * 20) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextCtx.fillRect(offsetX + x * 20, offsetY + y * 20, 19, 19);
                    }
                }
            }
        }
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        const currentTime = Date.now();
        
        if (currentTime - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = currentTime;
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('gameOverPopup').style.display = 'flex';
    }
    
    restartGame() {
        document.getElementById('gameOverPopup').style.display = 'none';
        this.startGame();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new BlockBlaster();
});

