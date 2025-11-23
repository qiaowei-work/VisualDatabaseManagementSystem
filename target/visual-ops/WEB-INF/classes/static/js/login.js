document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    const btnTextLogin = loginBtn.querySelector('.btn-text');
    const btnLoadingLogin = loginBtn.querySelector('.btn-loading');
    const btnTextRegister = registerBtn.querySelector('.btn-text');
    const btnLoadingRegister = registerBtn.querySelector('.btn-loading');

    // 从本地存储获取记住的用户名
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
        document.getElementById('username').value = rememberedUsername;
        document.getElementById('remember').checked = true;
    }

    // 表单切换事件
    showRegisterLink.addEventListener('click', function() {
        showRegisterForm();
    });

    showLoginLink.addEventListener('click', function() {
        showLoginForm();
    });

    // 登录表单提交
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // 注册表单提交
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegister();
    });

    function showRegisterForm() {
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'block';
        clearErrors();
    }

    function showLoginForm() {
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
        clearErrors();
    }

    function handleLogin() {
        // 获取表单数据
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        // 清除之前的错误信息
        clearErrors();

        // 前端验证
        if (!validateLoginForm(username, password)) {
            return;
        }

        // 显示加载状态
        setLoginLoading(true);

        // 发送登录请求
        fetch('/visual-ops/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {
                if (data.code === 200) {
                    // 登录成功
                    handleLoginSuccess(data.data, username, remember);
                } else {
                    // 登录失败
                    handleLoginFailure(data.message);
                }
            })
            .catch(error => {
                console.error('登录错误:', error);
                handleLoginFailure(error.message || '网络错误，请稍后重试');
            })
            .finally(() => {
                setLoginLoading(false);
            });
    }

    function handleRegister() {
        // 获取表单数据
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const email = document.getElementById('regEmail').value.trim();
        const realName = document.getElementById('regRealName').value.trim();

        // 清除之前的错误信息
        clearErrors();

        // 前端验证
        if (!validateRegisterForm(username, password, confirmPassword, email, realName)) {
            return;
        }

        // 显示加载状态
        setRegisterLoading(true);

        // 发送注册请求
        fetch('/visual-ops/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                confirmPassword: confirmPassword,
                email: email,
                realName: realName
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {
                if (data.code === 200) {
                    // 注册成功
                    handleRegisterSuccess(data.message);
                } else {
                    // 注册失败
                    handleRegisterFailure(data.message);
                }
            })
            .catch(error => {
                console.error('注册错误:', error);
                handleRegisterFailure(error.message || '网络错误，请稍后重试');
            })
            .finally(() => {
                setRegisterLoading(false);
            });
    }

    function validateLoginForm(username, password) {
        let isValid = true;

        if (!username) {
            showError('usernameError', '请输入用户名');
            isValid = false;
        }

        if (!password) {
            showError('passwordError', '请输入密码');
            isValid = false;
        } else if (password.length < 6) {
            showError('passwordError', '密码长度不能少于6位');
            isValid = false;
        }

        return isValid;
    }

    function validateRegisterForm(username, password, confirmPassword, email, realName) {
        let isValid = true;

        // 用户名验证
        if (!username) {
            showError('regUsernameError', '请输入用户名');
            isValid = false;
        } else if (username.length < 3 || username.length > 20) {
            showError('regUsernameError', '用户名长度必须在3-20个字符之间');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showError('regUsernameError', '用户名只能包含字母、数字和下划线');
            isValid = false;
        }

        // 密码验证
        if (!password) {
            showError('regPasswordError', '请输入密码');
            isValid = false;
        } else if (password.length < 6) {
            showError('regPasswordError', '密码长度不能少于6位');
            isValid = false;
        }

        // 确认密码验证
        if (!confirmPassword) {
            showError('regConfirmPasswordError', '请确认密码');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('regConfirmPasswordError', '两次输入的密码不一致');
            isValid = false;
        }

        // 邮箱验证
        if (!email) {
            showError('regEmailError', '请输入邮箱');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('regEmailError', '邮箱格式不正确');
            isValid = false;
        }

        return isValid;
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
    }

    function clearErrors() {
        const errorElements = document.querySelectorAll('.error-msg');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    function setLoginLoading(loading) {
        if (loading) {
            btnTextLogin.style.display = 'none';
            btnLoadingLogin.style.display = 'inline';
            loginBtn.disabled = true;
        } else {
            btnTextLogin.style.display = 'inline';
            btnLoadingLogin.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    function setRegisterLoading(loading) {
        if (loading) {
            btnTextRegister.style.display = 'none';
            btnLoadingRegister.style.display = 'inline';
            registerBtn.disabled = true;
        } else {
            btnTextRegister.style.display = 'inline';
            btnLoadingRegister.style.display = 'none';
            registerBtn.disabled = false;
        }
    }

    function handleLoginSuccess(data, username, remember) {
        // 保存token到localStorage
        localStorage.setItem('token', data.token);
        // 额外保存用户名到localStorage用于全局访问
        localStorage.setItem('username', username);

        // 如果选择了记住我，保存用户名
        if (remember) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }

        // 显示成功消息
        showMessage('登录成功，正在跳转...', 'success');

        // 启动预加载服务，异步加载常用页面资源
        if (window.preloadService) {
            console.log('启动页面预加载服务...');
            window.preloadService.startPreloading().then(results => {
                console.log('页面预加载任务完成', results);
            });
        }

        // 跳转到首页
        setTimeout(() => {
            window.location.href = '/visual-ops/';
        }, 1000);
    }

    function handleLoginFailure(message) {
        showMessage(message || '登录失败，请检查用户名和密码', 'error');
    }

    function handleRegisterSuccess(message) {
        showMessage(message || '注册成功，请登录', 'success');

        // 注册成功后切换到登录表单
        setTimeout(() => {
            showLoginForm();
            // 自动填充用户名
            const username = document.getElementById('regUsername').value;
            document.getElementById('username').value = username;
        }, 1500);
    }

    function handleRegisterFailure(message) {
        showMessage(message || '注册失败，请稍后重试', 'error');
    }

    function showMessage(message, type) {
        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
        `;

        document.body.appendChild(messageDiv);

        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);

        // 添加CSS动画
        if (!document.getElementById('messageStyles')) {
            const style = document.createElement('style');
            style.id = 'messageStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 回车键处理
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (loginFormContainer.style.display !== 'none' && !loginBtn.disabled) {
                handleLogin();
            } else if (registerFormContainer.style.display !== 'none' && !registerBtn.disabled) {
                handleRegister();
            }
        }
    });
});