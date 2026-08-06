document.addEventListener('DOMContentLoaded', function () {

    // ===== TAB SWITCHING =====
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('panel-' + tab.dataset.panel).classList.add('active');
        });
    });

    // ===== HELPER: Grade from percentage =====
    function getGrade(pct) {
        if (pct >= 90) return 'A+ (Outstanding)';
        if (pct >= 80) return 'A (Excellent)';
        if (pct >= 70) return 'B+ (Very Good)';
        if (pct >= 60) return 'B (First Division)';
        if (pct >= 50) return 'C (Second Division)';
        if (pct >= 40) return 'D (Pass)';
        return 'F (Fail)';
    }

    // ===== PANEL 1: MARKS =====
    const subjectRows = document.getElementById('subjectRows');
    const defaultSubjects = ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer'];
    let subjectCount = 6;

    function renderSubjectRows() {
        subjectRows.innerHTML = '';
        for (let i = 0; i < subjectCount; i++) {
            const name = i < defaultSubjects.length ? defaultSubjects[i] : `Subject ${i + 1}`;
            const row = document.createElement('div');
            row.className = 'subject-row';
            row.innerHTML = `
                <label>${name}</label>
                <input type="number" class="marks-obtained" placeholder="0" min="0" value="">
                <input type="number" class="marks-max" placeholder="100" min="1" value="100">
            `;
            subjectRows.appendChild(row);
        }
    }
    renderSubjectRows();

    document.getElementById('addSubjectBtn').addEventListener('click', () => {
        if (subjectCount < 15) { subjectCount++; renderSubjectRows(); }
    });
    document.getElementById('removeSubjectBtn').addEventListener('click', () => {
        if (subjectCount > 1) { subjectCount--; renderSubjectRows(); }
    });

    document.getElementById('calcMarksBtn').addEventListener('click', () => {
        const obtained = document.querySelectorAll('.marks-obtained');
        const max = document.querySelectorAll('.marks-max');
        let totalObt = 0, totalMax = 0;

        for (let i = 0; i < obtained.length; i++) {
            const o = parseFloat(obtained[i].value) || 0;
            const m = parseFloat(max[i].value) || 100;
            totalObt += o;
            totalMax += m;
        }

        if (totalMax === 0) return;
        const pct = (totalObt / totalMax) * 100;
        
        const result = document.getElementById('resultMarks');
        result.style.display = 'block';
        document.getElementById('marksPercent').textContent = pct.toFixed(2) + '%';
        document.getElementById('marksDetail').textContent = `${totalObt} out of ${totalMax} marks`;
        document.getElementById('marksGrade').textContent = getGrade(pct);
        result.scrollIntoView({ behavior: 'smooth' });
    });

    // ===== PANEL 2: SEMESTER =====
    const semesterRows = document.getElementById('semesterRows');
    let semCount = 6;

    function renderSemesterRows() {
        semesterRows.innerHTML = '';
        for (let i = 0; i < semCount; i++) {
            const row = document.createElement('div');
            row.className = 'subject-row';
            row.innerHTML = `
                <label>Semester ${i + 1}</label>
                <input type="number" class="sem-value" placeholder="0" min="0" step="0.01" value="" style="grid-column: span 2;">
            `;
            semesterRows.appendChild(row);
        }
    }
    renderSemesterRows();

    document.getElementById('addSemBtn').addEventListener('click', () => {
        if (semCount < 12) { semCount++; renderSemesterRows(); }
    });
    document.getElementById('removeSemBtn').addEventListener('click', () => {
        if (semCount > 1) { semCount--; renderSemesterRows(); }
    });

    document.getElementById('calcSemBtn').addEventListener('click', () => {
        const vals = document.querySelectorAll('.sem-value');
        const inputType = document.getElementById('semInputType').value;
        let total = 0, count = 0;

        vals.forEach(v => {
            const n = parseFloat(v.value);
            if (!isNaN(n) && n > 0) { total += n; count++; }
        });

        if (count === 0) return;
        let avg = total / count;
        let pct;

        if (inputType === 'sgpa') {
            // Convert average SGPA to percentage using CBSE formula
            pct = avg * 9.5;
            document.getElementById('semDetail').textContent = `Average SGPA: ${avg.toFixed(2)} → Percentage (×9.5)`;
        } else {
            pct = avg;
            document.getElementById('semDetail').textContent = `Average of ${count} semester(s)`;
        }

        const result = document.getElementById('resultSem');
        result.style.display = 'block';
        document.getElementById('semPercent').textContent = pct.toFixed(2) + '%';
        document.getElementById('semGrade').textContent = getGrade(pct);
        result.scrollIntoView({ behavior: 'smooth' });
    });

    // ===== PANEL 3: GRADE/CGPA =====
    const boardSelect = document.getElementById('boardSelect');
    const customMultiplierRow = document.getElementById('customMultiplierRow');

    boardSelect.addEventListener('change', () => {
        customMultiplierRow.style.display = boardSelect.value === 'custom' ? 'block' : 'none';
    });

    document.getElementById('calcGradeBtn').addEventListener('click', () => {
        const cgpa = parseFloat(document.getElementById('cgpaInput').value);
        if (isNaN(cgpa) || cgpa <= 0) return;

        let pct, formula;
        const board = boardSelect.value;

        if (board === 'cbse') {
            pct = cgpa * 9.5;
            formula = `CGPA ${cgpa} × 9.5 (CBSE)`;
        } else if (board === 'vtu') {
            pct = (cgpa - 0.75) * 10;
            formula = `(CGPA ${cgpa} − 0.75) × 10 (VTU)`;
        } else {
            const mult = parseFloat(document.getElementById('customMultiplier').value) || 9.5;
            pct = cgpa * mult;
            formula = `CGPA ${cgpa} × ${mult} (Custom)`;
        }

        const result = document.getElementById('resultGrade');
        result.style.display = 'block';
        document.getElementById('gradePercent').textContent = pct.toFixed(2) + '%';
        document.getElementById('gradeDetail').textContent = formula;
        document.getElementById('gradeGradeBadge').textContent = getGrade(pct);
        result.scrollIntoView({ behavior: 'smooth' });
    });

    // ===== PANEL 4: GENERAL =====
    document.getElementById('calcGenBtn').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('genValue').value);
        const total = parseFloat(document.getElementById('genTotal').value);

        if (isNaN(value) || isNaN(total) || total === 0) return;

        const pct = (value / total) * 100;

        const result = document.getElementById('resultGen');
        result.style.display = 'block';
        document.getElementById('genPercent').textContent = pct.toFixed(2) + '%';
        document.getElementById('genDetail').textContent = `${value} out of ${total}`;
        document.getElementById('genGrade').textContent = getGrade(pct);
        result.scrollIntoView({ behavior: 'smooth' });
    });
});
