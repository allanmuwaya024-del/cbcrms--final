/**
 * Authentication & Role Session Manager for CBC-RMS
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.STORAGE_KEY = 'cbcrms_user_session';
    }

    async init() {
        const storedSession = localStorage.getItem(this.STORAGE_KEY);
        if (storedSession) {
            this.currentUser = JSON.parse(storedSession);
        } else {
            // Default to Admin session on initial visit for easy testing
            await this.switchRole('admin');
        }
    }

    async login(username, password) {
        await window.dbEngine.isReady;
        const users = await window.dbEngine.getAll('users');
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.is_active === 1);

        if (user && user.password === password) {
            this.setUserSession(user);
            await window.dbEngine.add('system_logs', {
                user_id: user.user_id,
                action_type: 'LOGIN',
                description: `User ${user.username} logged in successfully`,
                ip_address: '127.0.0.1',
                user_agent: navigator.userAgent,
                status: 'SUCCESS',
                timestamp: new Date().toISOString()
            });
            return { success: true, user };
        } else {
            await window.dbEngine.add('system_logs', {
                user_id: null,
                action_type: 'LOGIN',
                description: `Failed login attempt for username: ${username}`,
                ip_address: '127.0.0.1',
                user_agent: navigator.userAgent,
                status: 'FAILED',
                timestamp: new Date().toISOString()
            });
            return { success: false, message: 'Invalid username or password' };
        }
    }

    async switchRole(role) {
        await window.dbEngine.isReady;
        const users = await window.dbEngine.getAll('users');
        const targetUser = users.find(u => u.role === role);
        if (targetUser) {
            this.setUserSession(targetUser);
            return targetUser;
        }
        return null;
    }

    setUserSession(user) {
        this.currentUser = {
            user_id: user.user_id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department_id: user.department_id
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.reload();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
}

window.authManager = new AuthManager();
