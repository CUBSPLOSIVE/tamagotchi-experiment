document.addEventListener('DOMContentLoaded', () => {
    let tasks = [];

    // --- Add new task ---
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

    // --- Render tasks ---
    function renderTasks() {
        const list = document.getElementById('taskList');
        list.innerHTML = '';

        tasks.forEach((task, index) => {
            const li = document.createElement('li');

            // Task text
            const taskSpan = document.createElement('span');
            taskSpan.textContent = task.text;
            li.appendChild(taskSpan);

            // Timer span
            if (task.deadline) {
                const timerEl = document.createElement('span');
                timerEl.id = `timer-${index}`;
                timerEl.style.marginLeft = '10px';
                li.appendChild(timerEl);
            }

            // Buttons container
            const btnContainer = document.createElement('div');
            btnContainer.className = 'task-buttons';

            const completeBtn = document.createElement('button');
            completeBtn.textContent = 'Complete';
            completeBtn.onclick = () => completeTask(index);

            const failBtn = document.createElement('button');
            failBtn.textContent = 'Fail';
            failBtn.onclick = () => failTask(index);

            btnContainer.appendChild(completeBtn);
            btnContainer.appendChild(failBtn);
            li.appendChild(btnContainer);

            list.appendChild(li);
        });
    }

    // --- Complete task ---
    function completeTask(index) {
        const task = tasks[index];
        tasks.splice(index, 1);

        logEvent('task_completed', { task: task.text, remainingTasks: tasks.length });
        saveData();
        renderTasks();
    }

    // --- Fail task ---
    function failTask(index) {
        const task = tasks[index];
        tasks.splice(index, 1);

        logEvent('task_failed', { task: task.text, remainingTasks: tasks.length });
        saveData();
        renderTasks();
    }

    // --- Save/load data ---
    function saveData() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        const logs = JSON.parse(localStorage.getItem('logs') || '[]');
        localStorage.setItem('logs', JSON.stringify(logs));
    }

    function loadData() {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        renderTasks();
    }

    // --- Logging ---
    function logEvent(eventType, details = {}) {
        const logs = JSON.parse(localStorage.getItem('logs') || '[]');
        const group = localStorage.getItem('experimentGroup') || 'unknown';
        logs.push({ eventType, group, timestamp: new Date().toISOString(), ...details });
        localStorage.setItem('logs', JSON.stringify(logs));
    }

    // --- Download logs as JSON ---
    function downloadData() {
        const logs = JSON.parse(localStorage.getItem('logs') || '[]');
        const data = JSON.stringify(logs, null, 2); // pretty-print
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'user_data.json';
        a.click();
    }

    // --- Reset logs ---
    function resetLogs() {
        localStorage.setItem('logs', '[]');
        alert('Experiment logs cleared!');
    }

    // --- Global timer updater ---
    setInterval(() => {
        tasks.forEach((task, index) => {
            if (task.deadline) {
                const diff = task.deadline - Date.now();
                const timerEl = document.getElementById(`timer-${index}`);

                if (diff <= 0) {
                    logEvent('task_deadline_reached', { task: task.text, remainingTasks: tasks.length });
                    failTask(index);
                    return;
                }

                if (timerEl) {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    timerEl.textContent = `Time left: ${hours}h ${minutes}m`;
                }
            }
        });
    }, 1000);

    // --- Expose functions globally ---
    window.addTask = addTask;
    window.downloadData = downloadData;
    window.resetLogs = resetLogs;

    loadData();
});
