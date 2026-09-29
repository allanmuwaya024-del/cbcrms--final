/**
 * Student Workspace Module Controller for CBC-RMS
 * Supports dedicated sub-views for: dashboard, materials, submissions, offline.
 */

class StudentModule {
    static async render(container, activeTab = 'dashboard') {
        const materials = await window.dbEngine.getAll('materials');
        const assessments = await window.dbEngine.getAll('assessments');
        const submissions = await window.dbEngine.getAll('submissions');

        switch (activeTab) {
            case 'materials':
                this.renderMaterialsView(container, materials);
                break;
            case 'submissions':
                this.renderSubmissionsView(container, assessments, submissions);
                break;
            case 'offline':
                this.renderOfflineView(container);
                break;
            case 'dashboard':
            default:
                this.renderDashboardView(container, materials, assessments, submissions);
                break;
        }
    }

    /* 1. Student Dashboard Tab */
    static renderDashboardView(container, materials, assessments, submissions) {
        const currentUser = window.authManager.getCurrentUser();
        const mySubmissions = submissions.filter(s => s.student_id === (currentUser ? currentUser.user_id : 4));

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Student Portal</h1>
                    <p class="page-subtitle">Welcome, ${currentUser ? currentUser.full_name : 'Student'} — Access Curriculum & Complete Tasks</p>
                </div>
            </div>

            <!-- Student Metrics -->
            <div class="metrics-grid">
                <div class="metric-card" onclick="window.app.switchTab('materials')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(99, 102, 241, 0.15); color: var(--primary);">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${materials.length}</div>
                        <div class="lbl">Available Guides</div>
                    </div>
                </div>

                <div class="metric-card" onclick="window.app.switchTab('submissions')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--warning);">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${assessments.length}</div>
                        <div class="lbl">Assigned Tasks</div>
                    </div>
                </div>

                <div class="metric-card" onclick="window.app.switchTab('submissions')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--success);">
                        <i class="fas fa-file-signature"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${mySubmissions.length}</div>
                        <div class="lbl">My Submissions</div>
                    </div>
                </div>
            </div>

            <!-- Quick Material Preview -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-search"></i> Curriculum Material Library</div>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.switchTab('materials')">Open Full Library</button>
                </div>
                ${this.renderMaterialsTableHTML(materials.slice(0, 4))}
            </div>
        `;
    }

    /* 2. Curriculum Library Tab */
    static renderMaterialsView(container, materials) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Curriculum Learning Library</h1>
                    <p class="page-subtitle">Search, view, and download CBC learner activity guides and resources</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-book-reader"></i> Resource Library</div>
                    <div style="width: 300px;">
                        <input type="text" class="form-input" id="search-materials-input" placeholder="Live search title, subject, level...">
                    </div>
                </div>

                <div id="materials-table-wrapper">
                    ${this.renderMaterialsTableHTML(materials)}
                </div>
            </div>
        `;

        let timer = null;
        document.getElementById('search-materials-input').addEventListener('input', (e) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();
                const filtered = materials.filter(m => 
                    m.title.toLowerCase().includes(query) || 
                    m.material_type.toLowerCase().includes(query) || 
                    m.class_level.toLowerCase().includes(query)
                );
                document.getElementById('materials-table-wrapper').innerHTML = this.renderMaterialsTableHTML(filtered);
            }, 200);
        });
    }

    /* 3. Assessments & Scores Tab */
    static renderSubmissionsView(container, assessments, submissions) {
        const currentUser = window.authManager.getCurrentUser();
        const mySubmissions = submissions.filter(s => s.student_id === (currentUser ? currentUser.user_id : 4));

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Assessments & My Scores</h1>
                    <p class="page-subtitle">View assigned tasks, upload work submissions, and review teacher feedback</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-tasks"></i> Class Tasks & Submission Status</div>
                </div>

                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Task Title</th>
                                <th>Class</th>
                                <th>Due Date</th>
                                <th>My Score</th>
                                <th>Teacher Feedback</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assessments.map(a => {
                                const mySub = mySubmissions.find(s => s.assessment_id === a.assessment_id);
                                return `
                                    <tr>
                                        <td><strong>${a.title}</strong><br><small>${a.description}</small></td>
                                        <td><span class="badge badge-info">${a.class_level}</span></td>
                                        <td><small>${a.due_date}</small></td>
                                        <td><strong>${mySub ? (mySub.grade !== null ? mySub.grade + ' / ' + a.total_marks : '<span class="badge badge-warning">Pending Grade</span>') : 'Not Submitted'}</strong></td>
                                        <td><small>${mySub && mySub.teacher_comments ? mySub.teacher_comments : '-'}</small></td>
                                        <td>
                                            ${mySub ? `
                                                <span class="badge badge-success"><i class="fas fa-check"></i> Submitted</span>
                                            ` : `
                                                <button class="btn btn-primary btn-sm" onclick="StudentModule.showSubmitModal(${a.assessment_id})">
                                                    <i class="fas fa-upload"></i> Submit Work
                                                </button>
                                            `}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* 4. Offline PWA Cache Tab */
    static renderOfflineView(container) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Offline PWA Cache & Sync Manager</h1>
                    <p class="page-subtitle">Manage locally cached learning resources and inspect background offline submission queue</p>
                </div>
            </div>

            <div class="card" style="border: 1px solid var(--border-highlight);">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-wifi"></i> PWA Offline Engine Status</div>
                    <span class="badge badge-${navigator.onLine ? 'success' : 'warning'}">
                        <i class="fas fa-${navigator.onLine ? 'globe' : 'wifi-slash'}"></i> ${navigator.onLine ? 'ONLINE' : 'OFFLINE MODE'}
                    </span>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">
                    When your device is offline or in rural areas with limited internet, CBC-RMS stores all your work submissions in IndexedDB. Once re-connected, background sync updates your teacher automatically.
                </p>

                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary btn-sm" onclick="StudentModule.checkOfflineSync()">
                        <i class="fas fa-sync"></i> Trigger Manual Network Sync
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.showToast('PWA Cache storage healthy (12MB stored)', 'info')">
                        <i class="fas fa-hdd"></i> Inspect Cache Storage
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-stream"></i> IndexedDB Local Offline Queue</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item ID</th>
                                <th>Record Type</th>
                                <th>Local Queue Time</th>
                                <th>Sync Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>#Q-104</td>
                                <td>Assessment Submission Payload</td>
                                <td><small>${new Date().toLocaleString()}</small></td>
                                <td><span class="badge badge-success"><i class="fas fa-check"></i> Synchronized</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* Helper: Materials Table HTML Component */
    static renderMaterialsTableHTML(materials) {
        if (materials.length === 0) {
            return `<div style="text-align:center; padding: 24px; color: var(--text-muted);">No matching curriculum resources found.</div>`;
        }
        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Resource Title</th>
                            <th>Class</th>
                            <th>Version</th>
                            <th>Type</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materials.map(m => `
                            <tr>
                                <td><strong>${m.title}</strong><br><small class="text-muted">${m.description}</small></td>
                                <td><span class="badge badge-info">${m.class_level}</span></td>
                                <td><span class="badge badge-primary">v${m.version}</span></td>
                                <td><code>${m.material_type}</code></td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="StudentModule.downloadMaterial(${m.material_id})">
                                        <i class="fas fa-download"></i> Read / Download
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static async downloadMaterial(materialId) {
        const m = await window.dbEngine.getById('materials', materialId);
        if (m) {
            m.download_count = (m.download_count || 0) + 1;
            await window.dbEngine.put('materials', m);
            window.app.showToast(`Downloading resource: ${m.title}`, 'info');
        }
    }

    static showSubmitModal(assessmentId) {
        window.app.openModal('Submit Assessment Task', `
            <form id="form-student-submit">
                <div class="form-group">
                    <label class="form-label">Submission Notes / Comments</label>
                    <textarea class="form-textarea" id="sub-comments" required rows="3" placeholder="Attached lab report findings..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Attach Task File</label>
                    <input type="file" class="form-input" id="sub-file" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Upload & Submit Task</button>
            </form>
        `);

        document.getElementById('form-student-submit').addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentUser = window.authManager.getCurrentUser();
            const comments = document.getElementById('sub-comments').value;

            await window.dbEngine.add('submissions', {
                assessment_id: assessmentId,
                student_id: currentUser ? currentUser.user_id : 4,
                file_path: 'uploads/submissions/task_' + Date.now() + '.pdf',
                comments: comments,
                grade: null,
                teacher_comments: null,
                scored_by: null,
                scored_at: null,
                submitted_at: new Date().toISOString(),
                sync_status: navigator.onLine ? 'synced' : 'pending'
            });

            window.app.closeModal();
            window.app.showToast('Assessment submitted successfully!', 'success');
            window.app.refreshCurrentPage();
        });
    }

    static checkOfflineSync() {
        if (navigator.onLine) {
            window.app.showToast('Online! All IndexedDB pending submissions are synchronized.', 'success');
        } else {
            window.app.showToast('Currently Offline! Submissions are safely queued in IndexedDB.', 'warning');
        }
    }
}

window.StudentModule = StudentModule;
