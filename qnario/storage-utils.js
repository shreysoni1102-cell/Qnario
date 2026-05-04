export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('qnario_current_user') || 'null');
    } catch {
        return null;
    }
}

export function setCurrentUser(user) {
    localStorage.setItem('qnario_current_user', JSON.stringify(user));
}

export function clearCurrentUser() {
    localStorage.removeItem('qnario_current_user');
}

export function getPapersByTeacher(email) {
    try {
        const papers = JSON.parse(localStorage.getItem('qnario_papers') || '{}');
        return papers[email] || [];
    } catch {
        return [];
    }
}

export function savePaper(paper) {
    try {
        const papers = JSON.parse(localStorage.getItem('qnario_papers') || '{}');
        if (!papers[paper.teacherEmail]) papers[paper.teacherEmail] = [];
        papers[paper.teacherEmail].push(paper);
        localStorage.setItem('qnario_papers', JSON.stringify(papers));
    } catch {
        // fail silently
    }
}

export function deletePaper(paperId, teacherEmail) {
    try {
        const papers = JSON.parse(localStorage.getItem('qnario_papers') || '{}');
        if (!papers[teacherEmail]) return;
        papers[teacherEmail] = papers[teacherEmail].filter(p => p.id !== paperId);
        localStorage.setItem('qnario_papers', JSON.stringify(papers));
    } catch {
        // fail silently
    }
}

export function generateId(prefix = "ID") {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
