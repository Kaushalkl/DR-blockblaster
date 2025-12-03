class BubbleShooter {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.bubbleRadius = 15;
        this.colors = ['#ff4444', '#ffff44', '#44ff44', '#4444ff']; // red, yellow, green, blue
        this.grid = [];
        this.shooter = { x: 0, y: 0, angle: 0, nextBubble: null };
        this.projectile = null;
        this.score = 0;
        this.level = 1;
        this.maxLevel = 50;
        this.gameRunning = false;
        this.isMobile = this.detectMobile();
        this.mousePos = { x: 0, y: 0 };
        this.audioContext = null;
        
        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        this.setupEventListeners();
        this.updateGameplayText();
        this.initAudio();
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

    updateGameplayText() {
        const gameplayElement = document.getElementById('gameplayText');
        if (this.isMobile) {
            gameplayElement.textContent = 'Tap on the screen to aim and use the shoot button to fire bubbles. Match 3 or more bubbles of the same color to destroy them.';
        }
    }

    setupEventListeners() {
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.nextLevel();
        });

        if (this.isMobile) {
            document.getElementById('shootBtn').addEventListener('click', () => {
                this.shoot();
            });
        }
    }

    startGame() {
        document.getElementById('firstScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        
        if (this.isMobile) {
            document.getElementById('mobileControls').style.display = 'block';
        }

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        if (!this.isMobile) {
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('click', () => this.shoot());
        } else {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
            this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
        }

        this.setupLevel();
        this.gameRunning = true;
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.shooter.x = this.width / 2;
        this.shooter.y = this.height - 50;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        this.updateShooterAngle();
    }

    handleTouch(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mousePos.x = touch.clientX - rect.left;
        this.mousePos.y = touch.clientY - rect.top;
        this.updateShooterAngle();
    }

    updateShooterAngle() {
        const dx = this.mousePos.x - this.shooter.x;
        const dy = this.mousePos.y - this.shooter.y;
        this.shooter.angle = Math.atan2(dy, dx);
    }

    setupLevel() {
        this.grid = [];
        const rows = Math.min(8 + Math.floor(this.level / 5), 15);
        const cols = Math.floor(this.width / (this.bubbleRadius * 2));
        
        for (let row = 0; row < rows; row++) {
            this.grid[row] = [];
            const offset = row % 2 === 1 ? this.bubbleRadius : 0;
            for (let col = 0; col < cols - (row % 2); col++) {
                if (Math.random() < 0.8) {
                    this.grid[row][col] = {
                        x: col * this.bubbleRadius * 2 + this.bubbleRadius + offset,
                        y: row * this.bubbleRadius * 1.8 + this.bubbleRadius + 50,
                        color: this.colors[Math.floor(Math.random() * this.colors.length)],
                        row: row,
                        col: col
                    };
                }
            }
        }
        
        this.shooter.nextBubble = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.updateDisplay();
    }

    shoot() {
        if (this.projectile || !this.gameRunning) return;
        
        this.playSound(300, 0.1);
        
        const speed = 8;
        this.projectile = {
            x: this.shooter.x,
            y: this.shooter.y,
            vx: Math.cos(this.shooter.angle) * speed,
            vy: Math.sin(this.shooter.angle) * speed,
            color: this.shooter.nextBubble,
            radius: this.bubbleRadius
        };
        
        this.shooter.nextBubble = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    updateProjectile() {
        if (!this.projectile) return;
        
        this.projectile.x += this.projectile.vx;
        this.projectile.y += this.projectile.vy;
        
        // Wall bouncing
        if (this.projectile.x <= this.projectile.radius || this.projectile.x >= this.width - this.projectile.radius) {
            this.projectile.vx *= -1;
            this.playSound(200, 0.05);
        }
        
        // Check collision with bubbles
        for (let row = 0; row < this.grid.length; row++) {
            if (!this.grid[row]) continue;
            for (let col = 0; col < this.grid[row].length; col++) {
                const bubble = this.grid[row][col];
                if (!bubble) continue;
                
                const dx = this.projectile.x - bubble.x;
                const dy = this.projectile.y - bubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.projectile.radius + this.bubbleRadius) {
                    this.attachBubble(bubble.row, bubble.col);
                    return;
                }
            }
        }
        
        // Remove if it goes too high
        if (this.projectile.y < -50) {
            this.projectile = null;
        }
    }

    attachBubble(nearRow, nearCol) {
        const bestPos = this.findBestAttachPosition(nearRow, nearCol);
        if (!bestPos) {
            this.projectile = null;
            return;
        }
        
        // Create new bubble
        if (!this.grid[bestPos.row]) this.grid[bestPos.row] = [];
        
        const offset = bestPos.row % 2 === 1 ? this.bubbleRadius : 0;
        this.grid[bestPos.row][bestPos.col] = {
            x: bestPos.col * this.bubbleRadius * 2 + this.bubbleRadius + offset,
            y: bestPos.row * this.bubbleRadius * 1.8 + this.bubbleRadius + 50,
            color: this.projectile.color,
            row: bestPos.row,
            col: bestPos.col
        };
        
        this.projectile = null;
        this.playSound(400, 0.1);
        
        // Check for matches
        const matches = this.findMatches(bestPos.row, bestPos.col);
        if (matches.length >= 3) {
            this.removeMatches(matches);
            this.score += matches.length * 10;
            this.playSound(600, 0.2);
            this.dropFloatingBubbles();
        }
        
        this.updateDisplay();
        this.checkWinCondition();
    }

    findBestAttachPosition(nearRow, nearCol) {
        const directions = [
            [-1, 0], [-1, -1], [-1, 1],
            [0, -1], [0, 1],
            [1, 0], [1, -1], [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const row = nearRow + dr;
            const col = nearCol + dc;
            
            if (row < 0 || row >= 20) continue;
            if (col < 0 || col >= Math.floor(this.width / (this.bubbleRadius * 2))) continue;
            
            if (!this.grid[row] || !this.grid[row][col]) {
                return { row, col };
            }
        }
        
        return null;
    }

    findMatches(startRow, startCol) {
        const visited = new Set();
        const matches = [];
        const color = this.grid[startRow][startCol].color;
        const queue = [{ row: startRow, col: startCol }];
        
        while (queue.length > 0) {
            const { row, col } = queue.shift();
            const key = `${row}-${col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (!this.grid[row] || !this.grid[row][col] || this.grid[row][col].color !== color) continue;
            
            matches.push({ row, col });
            
            // Check neighbors
            const neighbors = this.getNeighbors(row, col);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row}-${neighbor.col}`;
                if (!visited.has(neighborKey)) {
                    queue.push(neighbor);
                }
            }
        }
        
        return matches;
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const directions = row % 2 === 0 ? 
            [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] :
            [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            neighbors.push({ row: newRow, col: newCol });
        }
        
        return neighbors;
    }

    removeMatches(matches) {
        for (const match of matches) {
            if (this.grid[match.row]) {
                this.grid[match.row][match.col] = null;
            }
        }
    }

    dropFloatingBubbles() {
        const connected = new Set();
        
        // Find all bubbles connected to the top
        for (let col = 0; col < (this.grid[0] || []).length; col++) {
            if (this.grid[0] && this.grid[0][col]) {
                this.markConnected(0, col, connected);
            }
        }
        
        // Remove unconnected bubbles
        let dropped = 0;
        for (let row = 0; row < this.grid.length; row++) {
            if (!this.grid[row]) continue;
            for (let col = 0; col < this.grid[row].length; col++) {
                if (this.grid[row][col] && !connected.has(`${row}-${col}`)) {
                    this.grid[row][col] = null;
                    dropped++;
                }
            }
        }
        
        if (dropped > 0) {
            this.score += dropped * 5;
            this.playSound(500, 0.3);
        }
    }

    markConnected(row, col, connected) {
        const key = `${row}-${col}`;
        if (connected.has(key)) return;
        if (!this.grid[row] || !this.grid[row][col]) return;
        
        connected.add(key);
        
        const neighbors = this.getNeighbors(row, col);
        for (const neighbor of neighbors) {
            this.markConnected(neighbor.row, neighbor.col, connected);
        }
    }

    checkWinCondition() {
        let bubbleCount = 0;
        for (let row = 0; row < this.grid.length; row++) {
            if (!this.grid[row]) continue;
            for (let col = 0; col < this.grid[row].length; col++) {
                if (this.grid[row][col]) bubbleCount++;
            }
        }
        
        if (bubbleCount === 0) {
            this.gameRunning = false;
            this.showGameOver(true);
        }
    }

    showGameOver(won = false) {
        const popup = document.getElementById('gameOverPopup');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const nextBtn = document.getElementById('nextLevelBtn');
        
        if (won) {
            title.textContent = 'Level Complete!';
            message.textContent = `Score: ${this.score}`;
            if (this.level < this.maxLevel) {
                nextBtn.style.display = 'inline-block';
            } else {
                title.textContent = 'Congratulations!';
                message.textContent = 'You completed all levels!';
                nextBtn.style.display = 'none';
            }
        } else {
            title.textContent = 'Game Over';
            message.textContent = `Final Score: ${this.score}`;
            nextBtn.style.display = 'none';
        }
        
        popup.style.display = 'flex';
    }

    nextLevel() {
        this.level++;
        document.getElementById('gameOverPopup').style.display = 'none';
        this.setupLevel();
        this.gameRunning = true;
    }

    resetGame() {
        this.level = 1;
        this.score = 0;
        document.getElementById('gameOverPopup').style.display = 'none';
        this.setupLevel();
        this.gameRunning = true;
    }

    updateDisplay() {
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('scoreDisplay').textContent = this.score;
        
        let bubbleCount = 0;
        for (let row = 0; row < this.grid.length; row++) {
            if (!this.grid[row]) continue;
            for (let col = 0; col < this.grid[row].length; col++) {
                if (this.grid[row][col]) bubbleCount++;
            }
        }
        document.getElementById('bubblesDisplay').textContent = bubbleCount;
    }

    drawBubble(x, y, color, radius = this.bubbleRadius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add shine effect
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fill();
    }

    drawShooter() {
        // Draw shooter base
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#666';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw aim arrow
        const arrowLength = 60;
        const arrowX = this.shooter.x + Math.cos(this.shooter.angle) * arrowLength;
        const arrowY = this.shooter.y + Math.sin(this.shooter.angle) * arrowLength;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.shooter.x, this.shooter.y);
        this.ctx.lineTo(arrowX, arrowY);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Arrow head
        const headSize = 15;
        const angle1 = this.shooter.angle + Math.PI * 0.8;
        const angle2 = this.shooter.angle - Math.PI * 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(arrowX + Math.cos(angle1) * headSize, arrowY + Math.sin(angle1) * headSize);
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(arrowX + Math.cos(angle2) * headSize, arrowY + Math.sin(angle2) * headSize);
        this.ctx.stroke();
        
        // Draw next bubble
        this.drawBubble(this.shooter.x, this.shooter.y, this.shooter.nextBubble, 20);
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw grid bubbles
        for (let row = 0; row < this.grid.length; row++) {
            if (!this.grid[row]) continue;
            for (let col = 0; col < this.grid[row].length; col++) {
                const bubble = this.grid[row][col];
                if (bubble) {
                    this.drawBubble(bubble.x, bubble.y, bubble.color);
                }
            }
        }
        
        // Draw projectile
        if (this.projectile) {
            this.drawBubble(this.projectile.x, this.projectile.y, this.projectile.color, this.projectile.radius);
        }
        
        // Draw shooter
        this.drawShooter();
    }

    gameLoop() {
        if (!this.gameRunning) return;
        
        this.updateProjectile();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new BubbleShooter();
});