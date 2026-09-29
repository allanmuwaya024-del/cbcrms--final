/**
 * Admin Workspace Module Controller for CBC-RMS
 * Supports dedicated sub-views for: dashboard, users, departments, materials, logs, backups.
 */

class AdminModule {
    static async render(container, activeTab = 'dashboard') {
        const users = await window.dbEngine.getAll('users');
        const departments = await window.dbEngine.getAll('departments');
        const materials = await window.dbEngine.getAll('materials');
        const logs = await window.dbEngine.getAll('system_logs');
        const backups = await window.dbEngine.getAll('backup_records');

        switch (activeTab) {
            case 'users':
                this.renderUsersView(container, users);
                break;
            case 'departments':
                this.renderDepartmentsView(container, departments);
                break;
            case 'materials':
                this.renderMaterialsView(container, materials);
                break;
            case 'logs':
                this.renderLogsView(container, logs);
                break;
            case 'backups':
                this.renderBackupsView(container, backups);
                break;
            case 'dashboard':
            default:
                this.renderDashboardView(container, users, departments, materials, logs);
                break;
        }
    }

    /* 1. Dashboard Tab */
    static renderDashboardView(container, users, departments, materials, logs) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Administrator Dashboard</h1>
                    <p class="page-subtitle">Hope Community High School — System Control & Audit Center</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.dbEngine.exportSQLBackup()">
                        <i class="fas fa-database"></i> Download SQL Backup
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="AdminModule.showAddUserModal()">
                        <i class="fas fa-user-plus"></i> Add New User
                    </button>
                </div>
            </div>

            <!-- Metrics Grid -->
            <div class="metrics-grid">
                <div class="metric-card" onclick="window.app.switchTab('users')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(99, 102, 241, 0.15); color: var(--primary);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${users.length}</div>
                        <div class="lbl">Registered Users</div>
                    </div>
                </div>

                <div class="metric-card" onclick="window.app.switchTab('departments')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(6, 182, 212, 0.15); color: var(--secondary);">
                        <i class="fas fa-sitemap"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${departments.length}</div>
                        <div class="lbl">Departments</div>
                    </div>
                </div>

                <div class="metric-card" onclick="window.app.switchTab('materials')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--success);">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${materials.length}</div>
                        <div class="lbl">Curriculum Materials</div>
                    </div>
                </div>

                <div class="metric-card" onclick="window.app.switchTab('logs')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--warning);">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${logs.length}</div>
                        <div class="lbl">Audit Trail Logs</div>
                    </div>
                </div>
            </div>

            <!-- Quick Recent Users Table -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-user-shield"></i> System Accounts Overview</div>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.switchTab('users')">Manage All Users</button>
                </div>
                ${this.renderUsersTableHTML(users.slice(0, 5))}
            </div>
        `;
    }

    /* 2. User Management Tab */
    static renderUsersView(container, users) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">User Management</h1>
                    <p class="page-subtitle">Add, edit, enable/disable system user accounts & bulk import</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <input type="file" id="bulk-user-file" accept=".csv, .json" style="display: none;">
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('bulk-user-file').click()">
                        <i class="fas fa-file-import"></i> Bulk Import (CSV/JSON)
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="AdminModule.showAddUserModal()">
                        <i class="fas fa-user-plus"></i> Add New User
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-users-cog"></i> All User Accounts</div>
                    <input type="text" class="form-input" id="user-search-input" placeholder="Search name, username, email..." style="width:250px;">
                </div>
                <div id="users-table-container">
                    ${this.renderUsersTableHTML(users)}
                </div>
            </div>
        `;

        document.getElementById('bulk-user-file').addEventListener('change', (e) => AdminModule.handleBulkImport(e));
        document.getElementById('user-search-input').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = users.filter(u => u.full_name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
            document.getElementById('users-table-container').innerHTML = this.renderUsersTableHTML(filtered);
        });
    }

    /* 3. Departments Tab */
    static renderDepartmentsView(container, departments) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Academic Departments</h1>
                    <p class="page-subtitle">Manage school departments and Head of Department (HOD) assignments</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="AdminModule.showAddDepartmentModal()">
                    <i class="fas fa-plus"></i> Add Department
                </button>
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Department Name</th>
                                <th>Description</th>
                                <th>Head of Department (HOD)</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${departments.map(d => `
                                <tr>
                                    <td>#${d.department_id}</td>
                                    <td><strong>${d.department_name}</strong></td>
                                    <td>${d.description}</td>
                                    <td><span class="badge badge-info"><i class="fas fa-user-tie"></i> ${d.head_of_department || 'Unassigned'}</span></td>
                                    <td>
                                        <button class="btn btn-danger btn-sm" onclick="AdminModule.deleteDepartment(${d.department_id})">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* 4. Material Approvals Tab */
    static renderMaterialsView(container, materials) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Material Approvals & Verification</h1>
                    <p class="page-subtitle">Verify, publish, and audit submitted CBC curriculum resources</p>
                </div>
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title & Summary</th>
                                <th>Class Level</th>
                                <th>Version</th>
                                <th>Status</th>
                                <th>Uploaded By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materials.map(m => `
                                <tr>
                                    <td>#${m.material_id}</td>
                                    <td><strong>${m.title}</strong><br><small class="text-muted">${m.description}</small></td>
                                    <td><span class="badge badge-info">${m.class_level}</span></td>
                                    <td><span class="badge badge-primary">v${m.version}</span></td>
                                    <td><span class="badge badge-${m.is_active ? 'success' : 'warning'}">${m.is_active ? 'Published' : 'Pending Review'}</span></td>
                                    <td>User #${m.uploaded_by}</td>
                                    <td>
                                        <button class="btn btn-${m.is_active ? 'secondary' : 'success'} btn-sm" onclick="AdminModule.toggleMaterialStatus(${m.material_id})">
                                            <i class="fas fa-${m.is_active ? 'eye-slash' : 'check-circle'}"></i> ${m.is_active ? 'Unpublish' : 'Verify & Approve'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* 5. Security Audit Logs Tab */
    static renderLogsView(container, logs) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Security Audit Logs</h1>
                    <p class="page-subtitle">Full system activity tracking, authentication logs, and IP address recording</p>
                </div>
                <button class="btn btn-danger btn-sm" onclick="AdminModule.clearLogs()">
                    <i class="fas fa-trash-alt"></i> Clear Log History
                </button>
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Log ID</th>
                                <th>Timestamp</th>
                                <th>Action Type</th>
                                <th>Description</th>
                                <th>IP Address</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.slice().reverse().map(l => `
                                <tr>
                                    <td>#${l.log_id}</td>
                                    <td><small>${new Date(l.timestamp).toLocaleString()}</small></td>
                                    <td><code>${l.action_type}</code></td>
                                    <td>${l.description}</td>
                                    <td><small>${l.ip_address || '127.0.0.1'}</small></td>
                                    <td><span class="badge badge-${l.status === 'SUCCESS' ? 'success' : 'danger'}">${l.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* 6. System Backups Tab */
    static renderBackupsView(container, backups) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">System Database Backups</h1>
                    <p class="page-subtitle">Generate SQL database dumps, restore snapshots, and manage backup history</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="window.dbEngine.exportSQLBackup()">
                    <i class="fas fa-download"></i> Generate Fresh SQL Backup
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-history"></i> Backup Archive History</div>
                </div>

                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Backup Filename</th>
                                <th>Size</th>
                                <th>Created Timestamp</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${backups.length > 0 ? backups.map(b => `
                                <tr>
                                    <td><code>${b.filename}</code></td>
                                    <td>${b.file_size ? (b.file_size / 1024).toFixed(1) + ' KB' : 'Auto Dump'}</td>
                                    <td><small>${new Date(b.created_at).toLocaleString()}</small></td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="window.dbEngine.exportSQLBackup()">
                                            <i class="fas fa-download"></i> Download SQL
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="4" style="text-align:center; padding: 20px; color: var(--text-muted);">
                                        Click "Generate Fresh SQL Backup" above to export system data as standard MySQL .sql file.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* Helper: Users Table HTML Component */
    static renderUsersTableHTML(users) {
        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>#${u.user_id}</td>
                                <td><strong>${u.full_name}</strong></td>
                                <td><code>${u.username}</code></td>
                                <td>${u.email}</td>
                                <td><span class="badge badge-${u.role === 'admin' ? 'danger' : (u.role === 'teacher' ? 'primary' : 'success')}">${u.role.toUpperCase()}</span></td>
                                <td><span class="badge badge-${u.is_active ? 'success' : 'warning'}">${u.is_active ? 'Active' : 'Disabled'}</span></td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="AdminModule.toggleUserStatus(${u.user_id})">
                                        <i class="fas fa-${u.is_active ? 'ban' : 'check'}"></i> ${u.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="AdminModule.deleteUser(${u.user_id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static async toggleUserStatus(userId) {
        const user = await window.dbEngine.getById('users', userId);
        if (user) {
            user.is_active = user.is_active ? 0 : 1;
            await window.dbEngine.put('users', user);
            window.app.showToast(`User ${user.username} status updated`, 'info');
            window.app.refreshCurrentPage();
        }
    }

    static async deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            await window.dbEngine.delete('users', userId);
            window.app.showToast('User removed successfully', 'danger');
            window.app.refreshCurrentPage();
        }
    }

    static async toggleMaterialStatus(materialId) {
        const mat = await window.dbEngine.getById('materials', materialId);
        if (mat) {
            mat.is_active = mat.is_active ? 0 : 1;
            await window.dbEngine.put('materials', mat);
            window.app.showToast(`Material status updated to ${mat.is_active ? 'Published' : 'Unpublished'}`, 'info');
            window.app.refreshCurrentPage();
        }
    }

    static async clearLogs() {
        if (confirm('Clear security audit log trail?')) {
            const logs = await window.dbEngine.getAll('system_logs');
            for (const l of logs) {
                await window.dbEngine.delete('system_logs', l.log_id);
            }
            window.app.showToast('Security audit trail cleared.', 'warning');
            window.app.refreshCurrentPage();
        }
    }

    static showAddUserModal() {
        window.app.openModal('Add New System User', `
            <form id="form-add-user">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="new-fullname" required placeholder="e.g. Samuel Musoke">
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" id="new-username" required placeholder="e.g. smusoke">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="new-email" required placeholder="e.g. smusoke@hopecommunity.edu">
                </div>
                <div class="form-group">
                    <label class="form-label">System Role</label>
                    <select class="form-select" id="new-role">
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Administrator</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
            </form>
        `);

        document.getElementById('form-add-user').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('new-fullname').value;
            const username = document.getElementById('new-username').value;
            const email = document.getElementById('new-email').value;
            const role = document.getElementById('new-role').value;

            await window.dbEngine.add('users', {
                full_name: fullName,
                username: username,
                email: email,
                role: role,
                password: 'Password123',
                is_active: 1,
                department_id: role === 'teacher' ? 1 : null
            });

            window.app.closeModal();
            window.app.showToast(`Account created for ${fullName}`, 'success');
            window.app.refreshCurrentPage();
        });
    }

    static showAddDepartmentModal() {
        window.app.openModal('Add Academic Department', `
            <form id="form-add-dept">
                <div class="form-group">
                    <label class="form-label">Department Name</label>
                    <input type="text" class="form-input" id="dept-name" required placeholder="e.g. Vocational Studies">
                </div>
                <div class="form-group">
                    <label class="form-label">Head of Department (HOD)</label>
                    <input type="text" class="form-input" id="dept-hod" required placeholder="e.g. Ms. Jane Kiggundu">
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" id="dept-desc" rows="3" placeholder="Subjects included..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Add Department</button>
            </form>
        `);

        document.getElementById('form-add-dept').addEventListener('submit', async (e) => {
            e.preventDefault();
            await window.dbEngine.add('departments', {
                department_name: document.getElementById('dept-name').value,
                head_of_department: document.getElementById('dept-hod').value,
                description: document.getElementById('dept-desc').value
            });

            window.app.closeModal();
            window.app.showToast('Department added!', 'success');
            window.app.refreshCurrentPage();
        });
    }

    static async deleteDepartment(deptId) {
        if (confirm('Delete this department?')) {
            await window.dbEngine.delete('departments', deptId);
            window.app.showToast('Department deleted', 'danger');
            window.app.refreshCurrentPage();
        }
    }

    static async handleBulkImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target.result;
            let importedUsers = [];
            if (file.name.endsWith('.json')) {
                importedUsers = window.UserDataParser.parseJSON(text);
            } else {
                importedUsers = window.UserDataParser.parseCSV(text);
            }

            for (const user of importedUsers) {
                await window.dbEngine.add('users', user);
            }

            window.app.showToast(`Successfully imported ${importedUsers.length} users!`, 'success');
            window.app.refreshCurrentPage();
        };
        reader.readAsText(file);
    }
}

window.AdminModule = AdminModule;
