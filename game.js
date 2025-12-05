// 游戏画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// 游戏状态
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let lives = 3;
let enemyCount = 0;
let gameSpeed = 1;

// 输入控制
const keys = {};
const mouse = { x: 0, y: 0, clicked: false };

// 游戏对象数组
let bullets = [];
let enemies = [];
let explosions = [];
let powerUps = [];

// 玩家坦克
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    angle: 0,
    speed: 3,
    color: '#4CAF50',
    health: 100,
    maxHealth: 100,
    shootCooldown: 0,
    shootDelay: 15
};

// 事件监听
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        mouse.clicked = true;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        mouse.clicked = false;
    }
});

// UI按钮
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    enemyCount = 0;
    bullets = [];
    enemies = [];
    explosions = [];
    powerUps = [];
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.shootCooldown = 0;
    
    initClouds();
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    updateUI();
    spawnEnemy();
    gameLoop();
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('enemies').textContent = enemies.length;
}

// 绘制坦克
function drawTank(tank) {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.angle);
    
    if (tank === player) {
        // 玩家坦克 - 写实风格
        const w = tank.width;
        const h = tank.height;
        
        // 履带（底部）
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(-w/2 - 2, h/2 - 4, w + 4, 6);
        ctx.fillRect(-w/2 - 2, -h/2 - 2, w + 4, 6);
        
        // 履带细节
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        for (let i = -w/2; i < w/2; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, h/2 - 4);
            ctx.lineTo(i, h/2 + 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(i, -h/2 - 2);
            ctx.lineTo(i, -h/2 + 4);
            ctx.stroke();
        }
        
        // 坦克主体（带渐变）
        const gradient = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
        gradient.addColorStop(0, '#4a7c59');
        gradient.addColorStop(0.5, '#5a8c69');
        gradient.addColorStop(1, '#3d6b4d');
        ctx.fillStyle = gradient;
        ctx.fillRect(-w/2, -h/2, w, h);
        
        // 主体边框和阴影
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w/2, -h/2, w, h);
        
        // 高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-w/2, -h/2, w, h/3);
        
        // 炮塔（圆形）
        ctx.fillStyle = '#5a8c69';
        ctx.beginPath();
        ctx.arc(0, 0, w/2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 炮塔高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(-w/6, -h/6, w/4, 0, Math.PI * 2);
        ctx.fill();
        
        // 炮管（更粗更长）
        const barrelLength = 25;
        const barrelWidth = 7;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(w/2 - 3, -barrelWidth/2, barrelLength, barrelWidth);
        
        // 炮管细节
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(w/2 - 3, -barrelWidth/2, barrelLength, barrelWidth);
        
        // 炮管口
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(w/2 + barrelLength, 0, barrelWidth/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 玩家标识（星星）
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const starSize = 4;
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const x = Math.cos(angle) * starSize;
            const y = Math.sin(angle) * starSize;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else {
        // 敌人坦克 - 简单风格
        ctx.fillStyle = tank.color;
        ctx.fillRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(tank.width / 2 - 5, -3, 20, 6);
    }
    
    ctx.restore();
}

// 绘制子弹
function drawBullet(bullet) {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 绘制爆炸效果
function drawExplosion(explosion) {
    ctx.save();
    ctx.globalAlpha = explosion.alpha;
    ctx.fillStyle = explosion.color;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 绘制生命值条
function drawHealthBar(tank) {
    if (tank.health >= tank.maxHealth) return;
    
    const barWidth = tank.width + 10;
    const barHeight = 5;
    const x = tank.x - barWidth / 2;
    const y = tank.y - tank.height / 2 - 10;
    
    // 背景
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // 生命值
    const healthPercent = tank.health / tank.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
}

// 创建子弹
function createBullet(x, y, angle, owner) {
    const speed = 8;
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4,
        owner: owner,
        color: owner === player ? '#FFD700' : '#FF4444',
        damage: owner === player ? 25 : 10
    };
}

// 创建爆炸
function createExplosion(x, y, size = 30) {
    explosions.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: size,
        alpha: 1,
        color: '#FF6B35'
    });
}

// 生成敌人
function spawnEnemy() {
    if (gameState !== 'playing') return;
    
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
        case 0: // 上
            x = Math.random() * canvas.width;
            y = -30;
            break;
        case 1: // 右
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            break;
        case 2: // 下
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            break;
        case 3: // 左
            x = -30;
            y = Math.random() * canvas.height;
            break;
    }
    
    enemies.push({
        x: x,
        y: y,
        width: 30,
        height: 30,
        angle: 0,
        speed: 1 + Math.random() * 1.5,
        color: '#F44336',
        health: 50 + Math.floor(score / 100) * 10,
        maxHealth: 50 + Math.floor(score / 100) * 10,
        shootCooldown: 0,
        shootDelay: 60 + Math.random() * 60,
        targetAngle: 0
    });
}

// 更新玩家
function updatePlayer() {
    // 移动控制
    let dx = 0;
    let dy = 0;
    
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    
    // 标准化对角线移动
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    // 更新位置
    player.x += dx * player.speed;
    player.y += dy * player.speed;
    
    // 边界检测
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
    
    // 炮管朝向鼠标
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    // 射击
    if (player.shootCooldown > 0) {
        player.shootCooldown--;
    }
    
    if ((keys[' '] || mouse.clicked) && player.shootCooldown === 0) {
        const bulletX = player.x + Math.cos(player.angle) * (player.width / 2 + 15);
        const bulletY = player.y + Math.sin(player.angle) * (player.height / 2 + 15);
        bullets.push(createBullet(bulletX, bulletY, player.angle, player));
        player.shootCooldown = player.shootDelay;
        mouse.clicked = false;
    }
}

// 更新敌人
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // AI: 朝向玩家移动
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.targetAngle = Math.atan2(dy, dx);
        enemy.angle = enemy.targetAngle;
        
        // 移动
        if (distance > 100) {
            enemy.x += Math.cos(enemy.angle) * enemy.speed;
            enemy.y += Math.sin(enemy.angle) * enemy.speed;
        }
        
        // 边界检测
        enemy.x = Math.max(enemy.width / 2, Math.min(canvas.width - enemy.width / 2, enemy.x));
        enemy.y = Math.max(enemy.height / 2, Math.min(canvas.height - enemy.height / 2, enemy.y));
        
        // 敌人射击
        if (enemy.shootCooldown > 0) {
            enemy.shootCooldown--;
        } else if (distance < 400 && Math.random() < 0.02) {
            const bulletX = enemy.x + Math.cos(enemy.angle) * (enemy.width / 2 + 15);
            const bulletY = enemy.y + Math.sin(enemy.angle) * (enemy.height / 2 + 15);
            bullets.push(createBullet(bulletX, bulletY, enemy.angle, enemy));
            enemy.shootCooldown = enemy.shootDelay;
        }
    });
    
    // 定期生成新敌人
    if (enemies.length < 3 + Math.floor(score / 200) && Math.random() < 0.01) {
        spawnEnemy();
    }
}

// 更新子弹
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // 移除超出边界的子弹
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
            return;
        }
        
        // 子弹与坦克碰撞
        if (bullet.owner === player) {
            // 玩家子弹击中敌人
            enemies.forEach((enemy, enemyIndex) => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.width / 2 + bullet.radius) {
                    enemy.health -= bullet.damage;
                    createExplosion(bullet.x, bullet.y, 20);
                    bullets.splice(index, 1);
                    
                    if (enemy.health <= 0) {
                        createExplosion(enemy.x, enemy.y, 40);
                        enemies.splice(enemyIndex, 1);
                        score += 10;
                        updateUI();
                    }
                }
            });
        } else {
            // 敌人子弹击中玩家
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.width / 2 + bullet.radius) {
                player.health -= bullet.damage;
                createExplosion(bullet.x, bullet.y, 20);
                bullets.splice(index, 1);
                
                if (player.health <= 0) {
                    lives--;
                    player.health = player.maxHealth;
                    updateUI();
                    
                    if (lives <= 0) {
                        gameOver();
                    }
                }
            }
        }
    });
}

// 更新爆炸效果
function updateExplosions() {
    explosions.forEach((explosion, index) => {
        explosion.radius += 2;
        explosion.alpha -= 0.05;
        
        if (explosion.radius >= explosion.maxRadius || explosion.alpha <= 0) {
            explosions.splice(index, 1);
        }
    });
}

// 游戏结束
function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// 云朵数组（用于背景）
let clouds = [];

// 初始化云朵
function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 150 + 20,
            size: 30 + Math.random() * 40,
            speed: 0.1 + Math.random() * 0.2
        });
    }
}

// 绘制云朵
function drawCloud(x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.2, y, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.5, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

// 更新云朵
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.size * 2) {
            cloud.x = -cloud.size * 2;
            cloud.y = Math.random() * 150 + 20;
        }
    });
}

// 绘制草地细节
function drawGrassDetails() {
    ctx.strokeStyle = 'rgba(34, 139, 34, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = canvas.height - 50 + Math.random() * 50;
        const height = 3 + Math.random() * 5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 2, y - height);
        ctx.stroke();
    }
}

// 绘制游戏
function draw() {
    // 绘制天空渐变
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#98D8E8');
    skyGradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
    
    // 绘制云朵
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.size);
    });
    
    // 绘制地平线
    const horizonY = canvas.height * 0.7;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(canvas.width, horizonY);
    ctx.stroke();
    
    // 绘制草地渐变
    const grassGradient = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
    grassGradient.addColorStop(0, '#7CB342');
    grassGradient.addColorStop(0.3, '#8BC34A');
    grassGradient.addColorStop(0.6, '#9CCC65');
    grassGradient.addColorStop(1, '#689F38');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);
    
    // 绘制草地纹理
    ctx.fillStyle = 'rgba(76, 175, 80, 0.4)';
    for (let i = 0; i < canvas.width; i += 20) {
        const height = 2 + Math.random() * 3;
        ctx.fillRect(i, horizonY, 15, height);
    }
    
    // 绘制草地细节（草叶）
    drawGrassDetails();
    
    // 绘制一些随机的小草
    ctx.strokeStyle = 'rgba(34, 139, 34, 0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = horizonY + Math.random() * (canvas.height - horizonY);
        const height = 5 + Math.random() * 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 3, y - height / 2, x + (Math.random() - 0.5) * 2, y - height);
        ctx.stroke();
    }
    
    // 更新云朵（始终更新，让背景有动画效果）
    updateClouds();
    
    if (gameState === 'playing') {
        // 绘制玩家
        drawTank(player);
        drawHealthBar(player);
        
        // 绘制敌人
        enemies.forEach(enemy => {
            drawTank(enemy);
            drawHealthBar(enemy);
        });
        
        // 绘制子弹
        bullets.forEach(bullet => {
            drawBullet(bullet);
        });
        
        // 绘制爆炸
        explosions.forEach(explosion => {
            drawExplosion(explosion);
        });
    }
}

// 背景动画循环
function backgroundLoop() {
    draw();
    requestAnimationFrame(backgroundLoop);
}

// 游戏主循环
function gameLoop() {
    if (gameState === 'playing') {
        updatePlayer();
        updateEnemies();
        updateBullets();
        updateExplosions();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// 初始化
initClouds();
updateUI();
backgroundLoop(); // 启动背景动画循环

