/**
 * IndexedDB Database Engine & Relational Storage for CBC-RMS
 * Handles 16 stores matching MySQL install.sql schema with seed initialization.
 */

const DB_NAME = 'CBC_RMS_DB';
const DB_VERSION = 1;

class CBCDatabase {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 1. Departments
                if (!db.objectStoreNames.contains('departments')) {
                    const store = db.createObjectStore('departments', { keyPath: 'department_id', autoIncrement: true });
                    store.createIndex('department_name', 'department_name', { unique: true });
                }

                // 2. Users
                if (!db.objectStoreNames.contains('users')) {
                    const store = db.createObjectStore('users', { keyPath: 'user_id', autoIncrement: true });
                    store.createIndex('username', 'username', { unique: true });
                    store.createIndex('role', 'role', { unique: false });
                }

                // 3. Subjects
                if (!db.objectStoreNames.contains('subjects')) {
                    const store = db.createObjectStore('subjects', { keyPath: 'subject_id', autoIncrement: true });
                    store.createIndex('subject_code', 'subject_code', { unique: true });
                }

                // 4. Materials
                if (!db.objectStoreNames.contains('materials')) {
                    const store = db.createObjectStore('materials', { keyPath: 'material_id', autoIncrement: true });
                    store.createIndex('subject_id', 'subject_id', { unique: false });
                    store.createIndex('uploaded_by', 'uploaded_by', { unique: false });
                }

                // 5. Material Versions
                if (!db.objectStoreNames.contains('material_versions')) {
                    db.createObjectStore('material_versions', { keyPath: 'version_id', autoIncrement: true });
                }

                // 6. User Enrollments
                if (!db.objectStoreNames.contains('user_enrollments')) {
                    db.createObjectStore('user_enrollments', { keyPath: 'enrollment_id', autoIncrement: true });
                }

                // 7. Teacher Allocations
                if (!db.objectStoreNames.contains('teacher_allocations')) {
                    db.createObjectStore('teacher_allocations', { keyPath: 'allocation_id', autoIncrement: true });
                }

                // 8. Assessments
                if (!db.objectStoreNames.contains('assessments')) {
                    db.createObjectStore('assessments', { keyPath: 'assessment_id', autoIncrement: true });
                }

                // 9. Submissions
                if (!db.objectStoreNames.contains('submissions')) {
                    const store = db.createObjectStore('submissions', { keyPath: 'submission_id', autoIncrement: true });
                    store.createIndex('student_id', 'student_id', { unique: false });
                    store.createIndex('assessment_id', 'assessment_id', { unique: false });
                }

                // 10. Discussion Groups
                if (!db.objectStoreNames.contains('discussion_groups')) {
                    db.createObjectStore('discussion_groups', { keyPath: 'group_id', autoIncrement: true });
                }

                // 11. Group Members
                if (!db.objectStoreNames.contains('group_members')) {
                    db.createObjectStore('group_members', { keyPath: 'member_id', autoIncrement: true });
                }

                // 12. Group Messages
                if (!db.objectStoreNames.contains('group_messages')) {
                    db.createObjectStore('group_messages', { keyPath: 'message_id', autoIncrement: true });
                }

                // 13. Inquiries
                if (!db.objectStoreNames.contains('inquiries')) {
                    db.createObjectStore('inquiries', { keyPath: 'inquiry_id', autoIncrement: true });
                }

                // 14. System Logs
                if (!db.objectStoreNames.contains('system_logs')) {
                    db.createObjectStore('system_logs', { keyPath: 'log_id', autoIncrement: true });
                }

                // 15. Backup Records
                if (!db.objectStoreNames.contains('backup_records')) {
                    db.createObjectStore('backup_records', { keyPath: 'backup_id', autoIncrement: true });
                }

                // 16. Notifications
                if (!db.objectStoreNames.contains('notifications')) {
                    db.createObjectStore('notifications', { keyPath: 'notification_id', autoIncrement: true });
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                this.isReady = true;
                await this.seedDefaultData();
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB Error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async getById(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async add(storeName, item) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.add(item);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async put(storeName, item) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(item);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async seedDefaultData() {
        const users = await this.getAll('users');
        if (users.length === 0) {
            console.log('Seeding initial CBC-RMS dataset...');
            
            // Seed Departments
            await this.add('departments', { department_name: 'Sciences', description: 'Physics, Chemistry, Biology, Agriculture', head_of_department: 'Dr. Sarah Mukasa' });
            await this.add('departments', { department_name: 'Mathematics', description: 'General Mathematics, Additional Mathematics', head_of_department: 'Mr. John Kateregga' });
            await this.add('departments', { department_name: 'Humanities', description: 'History, Geography, CRE, IRE', head_of_department: 'Ms. Grace Nambasa' });
            await this.add('departments', { department_name: 'Languages', description: 'English, Literature, Luganda, Swahili', head_of_department: 'Mr. Peter Okello' });

            // Seed Users
            await this.add('users', { user_id: 1, username: 'admin', password: 'Admin@123', full_name: 'System Administrator', email: 'admin@hopecommunity.edu', role: 'admin', department_id: 1, is_active: 1 });
            await this.add('users', { user_id: 2, username: 'teacher1', password: 'Password123', full_name: 'Dr. Sarah Mukasa', email: 'smukasa@hopecommunity.edu', role: 'teacher', department_id: 1, is_active: 1 });
            await this.add('users', { user_id: 3, username: 'teacher2', password: 'Password123', full_name: 'Mr. John Kateregga', email: 'jkateregga@hopecommunity.edu', role: 'teacher', department_id: 2, is_active: 1 });
            await this.add('users', { user_id: 4, username: 'student1', password: 'Password123', full_name: 'Brighton Kasasa', email: 'bkasasa@student.edu', role: 'student', department_id: null, is_active: 1 });
            await this.add('users', { user_id: 5, username: 'student2', password: 'Password123', full_name: 'Patricia Namatovu', email: 'pnamatovu@student.edu', role: 'student', department_id: null, is_active: 1 });

            // Seed Subjects
            await this.add('subjects', { subject_id: 1, subject_name: 'Biology', subject_code: 'BIO101', department_id: 1, class_level: 'S.1', description: 'Cell biology & human physiology' });
            await this.add('subjects', { subject_id: 2, subject_name: 'Chemistry', subject_code: 'CHE101', department_id: 1, class_level: 'S.1', description: 'Matter & chemical reactions' });
            await this.add('subjects', { subject_id: 3, subject_name: 'General Mathematics', subject_code: 'MAT201', department_id: 2, class_level: 'S.2', description: 'Algebra & Geometry' });
            await this.add('subjects', { subject_id: 4, subject_name: 'History & Political Edu', subject_code: 'HIS301', department_id: 3, class_level: 'S.3', description: 'East African & World History' });

            // Seed Materials
            await this.add('materials', {
                material_id: 1,
                title: 'S.1 Biology Learner Guide - Cell Structure',
                description: 'Competence Based Learning Guide on Plant & Animal Cells',
                file_path: 'uploads/materials/s1_bio_cells.pdf',
                file_size: 2450000,
                file_type: 'pdf',
                material_type: 'student_guide',
                subject_id: 1,
                class_level: 'S.1',
                version: '1.0',
                is_active: 1,
                uploaded_by: 2,
                verified_by: 1,
                verified_at: new Date().toISOString(),
                download_count: 14,
                uploaded_at: new Date().toISOString()
            });

            // Seed Assessments
            await this.add('assessments', {
                assessment_id: 1,
                title: 'S.1 Biology Practical - Microscope Observation',
                description: 'Prepare an onion epidermal slide and sketch cell components.',
                subject_id: 1,
                class_level: 'S.1',
                due_date: '2026-10-15',
                total_marks: 20,
                created_by: 2,
                created_at: new Date().toISOString()
            });

            // Seed Initial Submissions
            await this.add('submissions', {
                submission_id: 1,
                assessment_id: 1,
                student_id: 4,
                file_path: 'uploads/submissions/bkasasa_bio_task1.pdf',
                comments: 'Completed microscope practical and attached cell diagram.',
                grade: 18.5,
                teacher_comments: 'Excellent clarity on cell wall identification!',
                scored_by: 2,
                scored_at: new Date().toISOString(),
                submitted_at: new Date().toISOString(),
                sync_status: 'synced'
            });

            // Seed System Log
            await this.add('system_logs', {
                log_id: 1,
                user_id: 1,
                action_type: 'SYSTEM_INIT',
                description: 'CBC-RMS PWA system initialized with seed data',
                ip_address: '127.0.0.1',
                user_agent: navigator.userAgent,
                status: 'SUCCESS',
                timestamp: new Date().toISOString()
            });

            console.log('Database seeding complete.');
        }
    }

    /**
     * Generates a downloadable MySQL .sql backup script matching install.sql structure.
     */
    async exportSQLBackup() {
        let sql = `-- CBC-RMS Database SQL Backup\n-- Exported on: ${new Date().toLocaleString()}\n\n`;
        sql += `CREATE DATABASE IF NOT EXISTS cbc_rms;\nUSE cbc_rms;\n\n`;

        const stores = ['departments', 'users', 'subjects', 'materials', 'assessments', 'submissions', 'system_logs'];
        
        for (const storeName of stores) {
            const data = await this.getAll(storeName);
            if (data.length > 0) {
                sql += `-- Data for ${storeName}\n`;
                for (const row of data) {
                    const keys = Object.keys(row).join(', ');
                    const values = Object.values(row).map(val => typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : (val === null ? 'NULL' : val)).join(', ');
                    sql += `INSERT INTO ${storeName} (${keys}) VALUES (${values});\n`;
                }
                sql += `\n`;
            }
        }

        const blob = new Blob([sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cbc_rms_backup_${new Date().toISOString().slice(0,10)}.sql`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

window.dbEngine = new CBCDatabase();
