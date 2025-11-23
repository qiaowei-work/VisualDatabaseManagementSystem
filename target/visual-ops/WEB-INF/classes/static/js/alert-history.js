/**
 * 报警历史模块JS
 * 处理报警历史页面的交互逻辑
 */

// 页面加载完成后执行
$(document).ready(function() {
    // 初始化页面
    initAlertHistoryPage();
    
    // 绑定刷新按钮事件
    $('#refreshBtn').on('click', function() {
        refreshAlertHistory();
    });
});

/**
 * 初始化报警历史页面
 */
function initAlertHistoryPage() {
    console.log('初始化报警历史页面');
    // 设置用户名显示
    updateUsernameDisplay();
    
    // 可以在这里添加其他初始化逻辑
}

/**
 * 更新用户名显示
 */
function updateUsernameDisplay() {
    const username = localStorage.getItem('currentUsername') || '用户';
    $('#currentUsername').text(username);
    $('#headerUsername').text(username);
}

/**
 * 刷新报警历史数据
 */
function refreshAlertHistory() {
    console.log('刷新报警历史数据');
    
    // 显示加载状态
    showLoadingState();
    
    // 模拟数据加载
    // 实际项目中这里会调用后端API获取数据
    setTimeout(function() {
        // 隐藏加载状态
        hideLoadingState();
        
        // 可以在这里添加数据更新逻辑
        console.log('报警历史数据刷新完成');
    }, 800);
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    // 可以添加加载动画或提示
    console.log('显示加载状态');
}

/**
 * 隐藏加载状态
 */
function hideLoadingState() {
    // 隐藏加载动画或提示
    console.log('隐藏加载状态');
}

/**
 * 退出登录功能
 */
function logout() {
    // 清除本地存储的用户信息
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentUserRole');
    
    // 重定向到登录页面或首页
    window.location.href = '/';
}