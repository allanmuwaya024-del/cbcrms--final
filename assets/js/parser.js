/**
 * Multi-Format Bulk User Importer & Data Parser for CBC-RMS
 * Parses CSV and JSON format files for automated account creation.
 */

class UserDataParser {
    static parseCSV(csvText) {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        let nameIdx = headers.findIndex(h => h.includes('name'));
        let userIdx = headers.findIndex(h => h.includes('user'));
        let emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
        let roleIdx = headers.findIndex(h => h.includes('role'));

        if (nameIdx === -1) nameIdx = 0;
        if (userIdx === -1) userIdx = 1;
        if (emailIdx === -1) emailIdx = 2;
        if (roleIdx === -1) roleIdx = 3;

        const users = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            if (cols.length <= Math.max(nameIdx, userIdx, emailIdx)) continue;

            const fullName = cols[nameIdx];
            const username = cols[userIdx] || fullName.toLowerCase().replace(/\s+/g, '');
            const email = cols[emailIdx] || `${username}@student.edu`;
            const role = (cols[roleIdx] && ['admin', 'teacher', 'student'].includes(cols[roleIdx].toLowerCase())) ? cols[roleIdx].toLowerCase() : 'student';

            if (fullName && username) {
                users.push({
                    full_name: fullName,
                    username: username,
                    email: email,
                    role: role,
                    password: 'Password123',
                    is_active: 1,
                    department_id: role === 'teacher' ? 1 : null
                });
            }
        }
        return users;
    }

    static parseJSON(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            if (!Array.isArray(data)) return [];
            return data.map(user => ({
                full_name: user.full_name || user.name || 'Unknown User',
                username: user.username || 'user' + Math.floor(Math.random() * 1000),
                email: user.email || 'user@school.edu',
                role: ['admin', 'teacher', 'student'].includes(user.role) ? user.role : 'student',
                password: user.password || 'Password123',
                is_active: 1,
                department_id: user.department_id || null
            }));
        } catch (e) {
            console.error('Invalid JSON file format:', e);
            return [];
        }
    }
}

window.UserDataParser = UserDataParser;
