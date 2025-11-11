document.addEventListener('DOMContentLoaded', () => {
    let tasks = [];

    function addTask() {
        const input = document.getElementById('taskInput').value.trim();
        const deadlineInput = document.getElementById('taskDeadline').value;

        if (!input) return alert("Enter a task.");
        let deadline = null;
        if (deadlineInput) {
            const parsed = new Date(deadlineInput);
            if (!isNaN(parsed.getTime())) deadline = parsed.getTime();
            else alert("Invalid date/time.");
        }

        tasks.push({ text: input, deadline, createdAt: Date.now() });
        document.getElementById('taskInput').value = '';
        document.getElementById('taskDeadline').value = '';

        logEvent('task_created', { task: input, totalTasks: tasks.length });
        saveData();
        renderTasks();
    }

    function renderTasks() {
        const list = document.getElementById('taskList');
        list.innerHTML = '';

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.textContent = task.text;

            if (task.deadline) {
                const timerEl = document.createElement('span');
                timerEl.id = `timer-${index}`;
                timerEl.style.marginLeft = '10px';
                li.appendChild(timerEl);
            }

            const completeBtn = document.createElement('button');
            completeBtn.textContent = 'Complete';
            completeBtn.onclick = () => completeTask(index);
            li.appendChild(completeBtn);

            const failBtn = document.createElement('button');
            failBtn.textContent = 'Fail';
            failBtn.onclick = () => failTask(index);
            li.appendChild(failBtn);

            list.appendChild(li);
        });
    }

    function completeTask(index) {
        const task = tasks[index];
        tasks.splice(index, 1);

        logEvent('task_completed', { task: task.text, remainingTasks: tasks.length });
        saveData();
        renderTasks();
    }

    function failTask(index) {
        const task = tasks[index];
        tasks.splice(index, 1);

        logEvent('task_failed', { task: task.text, remainingTasks: tasks.length });
        saveData();
        renderTasks();
    }

    function saveData() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('logs', JSON.stringify(JSON.parse(localStorage.getItem('logs') || '[]')));
    }

    function loadData() {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        renderTasks();
    }

    function logEvent(type, details = {}) {
        const logs = JSON.parse(localStorage.getItem('logs') || '[]');
        logs.push({ type, timestamp: new Date().toISOString(), ...details });
        localStorage.setItem('logs', JSON.stringify(logs));
    }

    function downloadData() {
        const logs = JSON.parse(localStorage.getItem('logs') || '[]');
        const data = JSON.stringify(logs, null, 2); // Pretty-print with 2 spaces
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'user_data.json';
        a.click();
    }


    function resetLogs() {
        localStorage.setItem('logs', '[]');
        alert('Experiment logs cleared!');
    }
    window.resetLogs = resetLogs;

    // --- Global timer updater ---
    setInterval(() => {
        tasks.forEach((task, index) => {
            if (task.deadline) {
                const diff = task.deadline - Date.now();
                if (diff <= 0) {
                    logEvent('task_deadline_reached', { task: task.text, remainingTasks: tasks.length });
                    failTask(index);
                }
            }
        });
    }, 1000);

    window.addTask = addTask;
    window.downloadData = downloadData;
    loadData();
});
