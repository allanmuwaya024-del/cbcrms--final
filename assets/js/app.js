/**
 * Main Application Bootstrapper & UI Router for CBC-RMS
 * Handles role switching, sidebar tab routing, modal dialogs, and PWA registration.
 */

class AppController {
    constructor() {
        this.currentTab = 'dashboard';
    }

    async init() {
        console.log('Initializing CBC-RMS Application...');
        
        // 1. Initialize Database Engine
        await window.dbEngine.init();
        
        // 2. Initialize Auth State
        await window.authManager.init();

        // 3. Register Service Worker
        this.registerServiceWorker();

        // 4. Render UI Components
        this.renderRoleSwitcher();
        this.renderSidebarMenu();
        this.renderUserProfile();
        this.bindGlobalEvents();

        // 5. Render Main Workspace
        await this.refreshCurrentPage();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('PWA Service Worker registered:', reg.scope))
                .catch(err => console.log('Service Worker registration failed:', err));
        }

        // Online/Offline status listeners
        window.addEventListener('online', () => {
            document.getElementById('offline-banner').classList.remove('active');
            this.showToast('Network connection restored. Syncing offline data...', 'success');
        });

        window.addEventListener('offline', () => {
            document.getElementById('offline-banner').classList.add('active');
            this.showToast('Working in Offline Mode. Data will be saved locally.', 'warning');
        });

        if (!navigator.onLine) {
            document.getElementById('offline-banner').classList.add('active');
        }
    }

    renderRoleSwitcher() {
        const user = window.authManager.getCurrentUser();
        const roleButtons = document.querySelectorAll('.role-btn');
        roleButtons.forEach(btn => {
            const role = btn.getAttribute('data-role');
            if (user && user.role === role) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    renderSidebarMenu() {
        const user = window.authManager.getCurrentUser();
        const role = user ? user.role : 'admin';
        const menuContainer = document.getElementById('sidebar-menu-list');

        let menuItems = [];

        if (role === 'admin') {
            menuItems = [
                { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
                { id: 'users', label: 'User Management', icon: 'fas fa-users-cog' },
                { id: 'departments', label: 'Departments', icon: 'fas fa-sitemap' },
                { id: 'materials', label: 'Material Approvals', icon: 'fas fa-check-double' },
                { id: 'logs', label: 'Security Audit Logs', icon: 'fas fa-shield-alt' },
                { id: 'backups', label: 'System Backups', icon: 'fas fa-database' }
            ];
        } else if (role === 'teacher') {
            menuItems = [
                { id: 'dashboard', label: 'Overview', icon: 'fas fa-chart-pie' },
                { id: 'materials', label: 'My Materials & Versioning', icon: 'fas fa-folder-open' },
                { id: 'assessments', label: 'Assessments & Grading', icon: 'fas fa-tasks' },
                { id: 'groups', label: 'Discussion Groups', icon: 'fas fa-comments' }
            ];
        } else if (role === 'student') {
            menuItems = [
                { id: 'dashboard', label: 'My Learning Dashboard', icon: 'fas fa-columns' },
                { id: 'materials', label: 'Curriculum Library', icon: 'fas fa-book' },
                { id: 'submissions', label: 'Assessments & Scores', icon: 'fas fa-pen-nib' },
                { id: 'offline', label: 'Offline PWA Cache', icon: 'fas fa-wifi' }
            ];
        }

        // Ensure valid current tab for active role
        if (!menuItems.some(item => item.id === this.currentTab)) {
            this.currentTab = 'dashboard';
        }

        menuContainer.innerHTML = menuItems.map(item => `
            <div class="nav-item ${item.id === this.currentTab ? 'active' : ''}" data-tab="${item.id}" onclick="window.app.switchTab('${item.id}')">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </div>
        `).join('');
    }

    renderUserProfile() {
        const user = window.authManager.getCurrentUser();
        if (user) {
            document.getElementById('user-avatar').innerText = user.full_name.charAt(0).toUpperCase();
            document.getElementById('user-display-name').innerText = user.full_name;
            document.getElementById('user-display-role').innerText = user.role.toUpperCase() + ' (' + user.username + ')';
        }
    }

    async switchRole(role) {
        await window.authManager.switchRole(role);
        this.currentTab = 'dashboard';
        this.renderRoleSwitcher();
        this.renderSidebarMenu();
        this.renderUserProfile();
        await this.refreshCurrentPage();
        this.showToast(`Switched workspace to ${role.toUpperCase()}`, 'info');
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        this.refreshCurrentPage();
    }

    async refreshCurrentPage() {
        const user = window.authManager.getCurrentUser();
        const role = user ? user.role : 'admin';
        const contentArea = document.getElementById('main-content-area');

        if (role === 'admin') {
            await window.AdminModule.render(contentArea, this.currentTab);
        } else if (role === 'teacher') {
            await window.TeacherModule.render(contentArea, this.currentTab);
        } else if (role === 'student') {
            await window.StudentModule.render(contentArea, this.currentTab);
        }
    }

    bindGlobalEvents() {
        // Role Switcher toolbar buttons
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const role = e.target.getAttribute('data-role');
                this.switchRole(role);
            });
        });

        // Theme Toggle
        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            this.showToast(`Switched to ${newTheme.toUpperCase()} theme`, 'info');
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : (type === 'danger' ? 'exclamation-triangle' : 'info-circle')}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    openModal(title, bodyHTML) {
        document.getElementById('modal-title-text').innerText = title;
        document.getElementById('modal-body-container').innerHTML = bodyHTML;
        document.getElementById('global-modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('global-modal').classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    window.app.init();
});
