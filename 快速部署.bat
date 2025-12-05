@echo off
chcp 65001 >nul
echo ========================================
echo   坦克大战游戏 - 快速部署助手
echo ========================================
echo.
echo 请选择部署方式：
echo.
echo [1] 使用 Netlify Drop（最简单，推荐）
echo [2] 使用 GitHub Pages（需要 GitHub 账号）
echo [3] 查看部署指南
echo.
set /p choice=请输入选项 (1/2/3): 

if "%choice%"=="1" (
    echo.
    echo 正在打开 Netlify Drop...
    start https://app.netlify.com/drop
    echo.
    echo 请将整个"坦克大战"文件夹拖拽到打开的网页上
    echo 等待几秒钟即可获得链接！
    pause
) else if "%choice%"=="2" (
    echo.
    echo 请按照以下步骤操作：
    echo 1. 在 GitHub 上创建新仓库
    echo 2. 复制仓库地址
    echo 3. 运行以下命令（替换为你的仓库地址）：
    echo    git remote add origin 你的仓库地址
    echo    git push -u origin main
    echo.
    echo 详细步骤请查看：GitHub部署步骤.txt
    pause
) else if "%choice%"=="3" (
    echo.
    echo 正在打开部署指南...
    start 部署指南.md
    pause
) else (
    echo 无效选项！
    pause
)

