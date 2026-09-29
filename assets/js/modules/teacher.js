/**
 * Teacher Workspace Module Controller for CBC-RMS
 * Supports dedicated sub-views for: dashboard, materials, assessments, groups.
 */

class TeacherModule {
    static async render(container, activeTab = 'dashboard') {
        const materials = await window.dbEngine.getAll('materials');
        const assessments = await window.dbEngine.getAll('assessments');
        const submissions = await window.dbEngine.getAll('submissions');
        const groups = await window.dbEngine.getAll('discussion_groups');

        switch (activeTab) {
            case 'materials':
                this.renderMaterialsView(container, materials);
                break;
            case 'assessments':
                this.renderAssessmentsView(container, assessments, submissions);
                break;
            case 'groups':
                this.renderGroupsView(container, groups);
                break;
            case 'dashboard':
            default:
                this.renderOverviewView(container, materials, assessments, submissions);
                break;
        }
    }

    /* 1. Educator Overview Tab */
    static renderOverviewView(container, materials, assessments, submissions) {
        const currentUser = window.authManager.getCurrentUser();
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Educator Portal</h1>
                    <p class="page-subtitle">Welcome back, ${currentUser ? currentUser.full_name : 'Teacher'} — Class Curriculum & Assessment Hub</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary btn-sm" onclick="TeacherModule.showAssessmentModal()">
                        <i class="fas fa-plus-circle"></i> Create Assessment
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="TeacherModule.showUploadModal()">
                        <i class="fas fa-file-upload"></i> Upload Resource
                    </button>
                </div>
            </div>

            <!-- Teacher Metrics -->
            <div class="metrics-grid">
                <div class="metric-card" onclick="window.app.switchTab('materials')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(99, 102, 241, 0.15); color: var(--primary);">
                        <i class="fas fa-folder-open"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${materials.length}</div>
                        <div class="lbl">Uploaded Materials</div>
                    </div>
                </div>

                <div class="metric-card" onclick="window.app.switchTab('assessments')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(6, 182, 212, 0.15); color: var(--secondary);">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${assessments.length}</div>
                        <div class="lbl">Class Assessments</div>
                    </div>
                </div>

                <div class="metric-card" onclick="window.app.switchTab('assessments')" style="cursor:pointer;">
                    <div class="metric-icon" style="background: rgba(16, 185, 129, 0.15); color: var(--success);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="metric-info">
                        <div class="val">${submissions.length}</div>
                        <div class="lbl">Submissions Received</div>
                    </div>
                </div>
            </div>

            <!-- Quick Materials Table -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-book-reader"></i> My Uploaded Curriculum Resources</div>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.switchTab('materials')">View All Materials</button>
                </div>
                ${this.renderMaterialsTableHTML(materials)}
            </div>
        `;
    }

    /* 2. My Materials & Versioning Tab */
    static renderMaterialsView(container, materials) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">My Materials & Version Control</h1>
                    <p class="page-subtitle">Publish learning guides, track version revisions (v1.0, v1.1), and manage downloads</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="TeacherModule.showUploadModal()">
                    <i class="fas fa-file-upload"></i> Upload New Resource
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-code-branch"></i> Curriculum Resource Version Control</div>
                </div>
                ${this.renderMaterialsTableHTML(materials)}
            </div>
        `;
    }

    /* 3. Assessments & Grading Tab */
    static renderAssessmentsView(container, assessments, submissions) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Assessments & Student Grading</h1>
                    <p class="page-subtitle">Create CBC assessment tasks, score student submissions, and provide feedback</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="TeacherModule.showAssessmentModal()">
                    <i class="fas fa-plus-circle"></i> Create New Assessment
                </button>
            </div>

            <!-- Assessments Table -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-list-alt"></i> Class Assessments</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Assessment Title</th>
                                <th>Class Target</th>
                                <th>Due Date</th>
                                <th>Total Marks</th>
                                <th>Created Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assessments.map(a => `
                                <tr>
                                    <td><strong>${a.title}</strong><br><small>${a.description}</small></td>
                                    <td><span class="badge badge-info">${a.class_level}</span></td>
                                    <td><small>${a.due_date}</small></td>
                                    <td><strong>${a.total_marks} pts</strong></td>
                                    <td><small>${new Date(a.created_at).toLocaleDateString()}</small></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Submissions Table -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-graduation-cap"></i> Student Work Scoring Portal</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Submission ID</th>
                                <th>Student</th>
                                <th>Student Comments</th>
                                <th>Score / Grade</th>
                                <th>Teacher Feedback</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${submissions.map(s => `
                                <tr>
                                    <td>#${s.submission_id}</td>
                                    <td>Student #${s.student_id}</td>
                                    <td>${s.comments}</td>
                                    <td><strong>${s.grade !== null ? s.grade + ' pts' : '<span class="badge badge-warning">Ungraded</span>'}</strong></td>
                                    <td><small>${s.teacher_comments || 'No feedback yet'}</small></td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" onclick="TeacherModule.showGradeModal(${s.submission_id})">
                                            <i class="fas fa-edit"></i> Score Submission
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

    /* 4. Discussion Groups Tab */
    static renderGroupsView(container, groups) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Discussion Groups & Peer Study</h1>
                    <p class="page-subtitle">Moderate subject learning groups and interactive student Q&A threads</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="TeacherModule.showGroupModal()">
                    <i class="fas fa-comments"></i> Create Discussion Group
                </button>
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Group Name</th>
                                <th>Subject</th>
                                <th>Members</th>
                                <th>Created At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groups.length > 0 ? groups.map(g => `
                                <tr>
                                    <td>#${g.group_id}</td>
                                    <td><strong>${g.group_name}</strong></td>
                                    <td><span class="badge badge-info">Subject #${g.subject_id}</span></td>
                                    <td><span class="badge badge-success">4 Members</span></td>
                                    <td><small>${new Date(g.created_at).toLocaleDateString()}</small></td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="window.app.showToast('Opening group chat...', 'info')">
                                            <i class="fas fa-comment-alt"></i> Open Chat
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td>#1</td>
                                    <td><strong>S.1 Biology Cell Study Circle</strong></td>
                                    <td><span class="badge badge-info">Biology</span></td>
                                    <td><span class="badge badge-success">6 Members</span></td>
                                    <td><small>Active Today</small></td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="window.app.showToast('Group chat active', 'info')">
                                            <i class="fas fa-comment-alt"></i> Moderation Forum
                                        </button>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /* Helper: Materials Table HTML Component */
    static renderMaterialsTableHTML(materials) {
        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Resource Title</th>
                            <th>Subject & Class</th>
                            <th>Type</th>
                            <th>Version</th>
                            <th>Status</th>
                            <th>Downloads</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materials.map(m => `
                            <tr>
                                <td><strong>${m.title}</strong><br><small class="text-muted">${m.description}</small></td>
                                <td><span class="badge badge-info">${m.class_level}</span></td>
                                <td><code>${m.material_type}</code></td>
                                <td><span class="badge badge-primary">v${m.version}</span></td>
                                <td><span class="badge badge-${m.is_active ? 'success' : 'warning'}">${m.is_active ? 'Verified' : 'Pending'}</span></td>
                                <td>${m.download_count || 0}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="TeacherModule.showRevisionModal(${m.material_id})">
                                        <i class="fas fa-code-branch"></i> Revise (v${(parseFloat(m.version) + 0.1).toFixed(1)})
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static showUploadModal() {
        window.app.openModal('Upload Curriculum Resource', `
            <form id="form-upload-material">
                <div class="form-group">
                    <label class="form-label">Material Title</label>
                    <input type="text" class="form-input" id="mat-title" required placeholder="e.g. S.1 Chemistry - Atomic Structure">
                </div>
                <div class="form-group">
                    <label class="form-label">Class Level</label>
                    <select class="form-select" id="mat-class">
                        <option value="S.1">Senior 1 (S.1)</option>
                        <option value="S.2">Senior 2 (S.2)</option>
                        <option value="S.3">Senior 3 (S.3)</option>
                        <option value="S.4">Senior 4 (S.4)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Resource Category</label>
                    <select class="form-select" id="mat-type">
                        <option value="student_guide">Student Learning Guide</option>
                        <option value="teacher_guide">Teacher Activity Guide</option>
                        <option value="assessment">Competence Assessment</option>
                        <option value="scoring_guide">Scoring & Rubric Guide</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" id="mat-desc" rows="3" placeholder="Brief summary of learning outcomes..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Publish Resource</button>
            </form>
        `);

        document.getElementById('form-upload-material').addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentUser = window.authManager.getCurrentUser();
            await window.dbEngine.add('materials', {
                title: document.getElementById('mat-title').value,
                description: document.getElementById('mat-desc').value,
                file_path: 'uploads/materials/' + document.getElementById('mat-title').value.toLowerCase().replace(/\s+/g, '_') + '.pdf',
                file_size: 1540000,
                file_type: 'pdf',
                material_type: document.getElementById('mat-type').value,
                subject_id: 1,
                class_level: document.getElementById('mat-class').value,
                version: '1.0',
                is_active: 1,
                uploaded_by: currentUser ? currentUser.user_id : 2,
                download_count: 0,
                uploaded_at: new Date().toISOString()
            });

            window.app.closeModal();
            window.app.showToast('Material published successfully!', 'success');
            window.app.refreshCurrentPage();
        });
    }

    static showRevisionModal(materialId) {
        window.app.openModal('Revise & Upload New Version', `
            <form id="form-revise-material">
                <div class="form-group">
                    <label class="form-label">Version Notes / Revision Summary</label>
                    <textarea class="form-textarea" id="rev-notes" required rows="3" placeholder="Describe curriculum updates in this version..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Update to Next Version</button>
            </form>
        `);

        document.getElementById('form-revise-material').addEventListener('submit', async (e) => {
            e.preventDefault();
            const mat = await window.dbEngine.getById('materials', materialId);
            if (mat) {
                const oldVer = mat.version;
                const newVer = (parseFloat(mat.version) + 0.1).toFixed(1);
                mat.version = newVer;
                await window.dbEngine.put('materials', mat);

                await window.dbEngine.add('material_versions', {
                    material_id: materialId,
                    version_number: oldVer,
                    change_notes: document.getElementById('rev-notes').value,
                    uploaded_by: window.authManager.getCurrentUser().user_id,
                    archived_at: new Date().toISOString()
                });

                window.app.closeModal();
                window.app.showToast(`Material updated to v${newVer}`, 'success');
                window.app.refreshCurrentPage();
            }
        });
    }

    static showGradeModal(submissionId) {
        window.app.openModal('Score & Provide Feedback', `
            <form id="form-grade-sub">
                <div class="form-group">
                    <label class="form-label">Score / Marks (out of 20)</label>
                    <input type="number" step="0.5" class="form-input" id="grade-val" required placeholder="e.g. 17.5">
                </div>
                <div class="form-group">
                    <label class="form-label">Teacher Feedback / Comments</label>
                    <textarea class="form-textarea" id="grade-comment" rows="3" placeholder="Great presentation of findings..."></textarea>
                </div>
                <button type="submit" class="btn btn-success" style="width:100%;">Submit Score</button>
            </form>
        `);

        document.getElementById('form-grade-sub').addEventListener('submit', async (e) => {
            e.preventDefault();
            const sub = await window.dbEngine.getById('submissions', submissionId);
            if (sub) {
                sub.grade = parseFloat(document.getElementById('grade-val').value);
                sub.teacher_comments = document.getElementById('grade-comment').value;
                sub.scored_by = window.authManager.getCurrentUser().user_id;
                sub.scored_at = new Date().toISOString();
                await window.dbEngine.put('submissions', sub);

                window.app.closeModal();
                window.app.showToast('Student submission scored successfully!', 'success');
                window.app.refreshCurrentPage();
            }
        });
    }

    static showAssessmentModal() {
        window.app.openModal('Create Competence Assessment', `
            <form id="form-add-assessment">
                <div class="form-group">
                    <label class="form-label">Assessment Title</label>
                    <input type="text" class="form-input" id="ass-title" required placeholder="e.g. S.2 Math Algebra Assignment">
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" class="form-input" id="ass-date" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Total Marks</label>
                    <input type="number" class="form-input" id="ass-marks" value="20" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Publish Assessment</button>
            </form>
        `);

        document.getElementById('form-add-assessment').addEventListener('submit', async (e) => {
            e.preventDefault();
            await window.dbEngine.add('assessments', {
                title: document.getElementById('ass-title').value,
                description: 'Competence assessment task',
                subject_id: 1,
                class_level: 'S.1',
                due_date: document.getElementById('ass-date').value,
                total_marks: parseInt(document.getElementById('ass-marks').value),
                created_by: window.authManager.getCurrentUser().user_id,
                created_at: new Date().toISOString()
            });

            window.app.closeModal();
            window.app.showToast('New assessment created!', 'success');
            window.app.refreshCurrentPage();
        });
    }

    static showGroupModal() {
        window.app.openModal('Create Discussion Group', `
            <form id="form-add-group">
                <div class="form-group">
                    <label class="form-label">Group Name</label>
                    <input type="text" class="form-input" id="grp-name" required placeholder="e.g. S.3 History Discussion Circle">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Create Group</button>
            </form>
        `);

        document.getElementById('form-add-group').addEventListener('submit', async (e) => {
            e.preventDefault();
            await window.dbEngine.add('discussion_groups', {
                group_name: document.getElementById('grp-name').value,
                subject_id: 1,
                created_by: window.authManager.getCurrentUser().user_id,
                created_at: new Date().toISOString()
            });

            window.app.closeModal();
            window.app.showToast('Discussion group created!', 'success');
            window.app.refreshCurrentPage();
        });
    }
}

window.TeacherModule = TeacherModule;
