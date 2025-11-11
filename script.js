document.addEventListener('DOMContentLoaded', function() {
    let points = 0;
    let streak = 0;
    let lastCompletionDate = null;
    let tasks = [];
    let health = 50; // Starting health

    // --- Add new task ---
    function addTask() {
        const taskInput = document.getElementById('taskInput').value.trim();
        const deadlineInput = document.getElementById('taskDeadline').value;

        if (!taskInput) return alert("Please enter a task.");

        let deadline = null;
        if (deadlineInput) {
            const parsed = new Date(deadlineInput);
            if (!isNaN(parsed.getTime())) deadline = parsed.getTime();
            else alert("Invalid date/time. Task will have no deadline.");
        }

        tasks.push({ text: taskInput, deadline, createdAt: Date.now() });
        document.getElementById('taskInput').value = '';
        document.getElementById('taskDeadline').value = '';

        logEvent('task_created', { task: taskInput, totalTasks: tasks.length });
        saveProgress();
        renderTasks();
    }

    // --- Render tasks ---
    function renderTasks() {
        const list = document.getElementById('taskList');
        list.innerHTML = '';

        tasks.forEach((task, index) => {
            const li = document.createElement('li');

            const taskSpan = document.createElement('span');
            taskSpan.textContent = task.text;
            li.appendChild(taskSpan);

            if (task.deadline) {
                const timerEl = document.createElement('span');
                timerEl.id = `timer-${index}`;
                timerEl.style.marginLeft = '10px';
                li.appendChild(timerEl);
            }

            const btnContainer = document.createElement('div');
            btnContainer.className = 'task-buttons';

            const completeBtn = document.createElement('button');
            completeBtn.textContent = "Complete";
            completeBtn.onclick = () => completeTask(index);

            const failBtn = document.createElement('button');
            failBtn.textContent = "Fail";
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

        points += 10;
        health = Math.min(100, health + 20); // dramatic health boost

        const today = new Date().toDateString();
        if (streak === 0 || lastCompletionDate !== today) {
            streak += 1;
            lastCompletionDate = today;
        }

        showHealthChange("+20 Health!");
        updateMood();
        updateDisplay(`Completed: ${task.text}`);

        logEvent('task_completed', {
            task: task.text,
            points,
            health,
            remainingTasks: tasks.length
        });

        saveProgress();
        renderTasks();
    }

    // --- Fail task ---
    function failTask(index) {
        const task = tasks[index];
        tasks.splice(index, 1);

        points = Math.max(0, points - 10);
        health = Math.max(0, health - 25); // dramatic health drop
        streak = 0;
        lastCompletionDate = null;

        showHealthChange("-25 Health!");
        updateMood();
        updateDisplay(`Task failed: ${task.text}`);

        logEvent('task_failed', {
            task: task.text,
            points,
            health,
            remainingTasks: tasks.length
        });

        saveProgress();
        renderTasks();
    }

    // --- Update pet mood based on health ---
    function updateMood() {
        let mood = "neutral";
        if (health >= 75) mood = "happy";
        else if (health < 40) mood = "sad";

        const petImage = document.getElementById("petImage");
        if (petImage) {
            switch (mood) {
                case "happy": petImage.src = "assets/happy.gif"; break;
                case "sad": petImage.src = "assets/sad.gif"; break;
                default: petImage.src = "assets/neutral.gif";
            }
        }
    }

    // --- Display companion status ---
    function updateDisplay(message) {
        const status = document.getElementById("companionStatus");
        if (status) status.textContent = `${message} | Points: ${points} | Health: ${health}`;
    }

    // --- Show temporary health change message ---
    function showHealthChange(message) {
        const status = document.getElementById("companionStatus");
        const temp = document.createElement("div");
        temp.textContent = message;
        temp.style.color = message.startsWith("+") ? "green" : "red";
        temp.style.fontWeight = "bold";
        temp.style.marginTop = "5px";
        status.appendChild(temp);
        setTimeout(() => temp.remove(), 2000);
    }

    // --- Save/load progress ---
    function saveProgress() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('points', points);
        localStorage.setItem('streak', streak);
        localStorage.setItem('lastCompletionDate', lastCompletionDate || '');
        localStorage.setItem('health', health);
    }

    function loadProgress() {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
        const storedPoints = localStorage.getItem('points');
        points = storedPoints !== null ? parseInt(storedPoints) : 50;
    
        const storedHealth = localStorage.getItem('health');
        health = storedHealth !== null ? parseInt(storedHealth) : 100;

        streak = parseInt(localStorage.getItem('streak')) || 0;
        lastCompletionDate = localStorage.getItem('lastCompletionDate') || null;

        renderTasks();
        updateMood();
        updateDisplay("Welcome back!");
    }


    function logEvent(eventType, details = {}) {
        const logs = JSON.parse(localStorage.getItem('logs') || '[]');
        const group = localStorage.getItem('experimentGroup') || 'unknown'; // get the chosen group
        logs.push({ eventType, timestamp: new Date().toISOString(), group, ...details });
        localStorage.setItem('logs', JSON.stringify(logs));
    }

    // --- Global timer updater ---
    setInterval(() => {
        tasks.forEach((task, index) => {
            if (task.deadline) {
                const diff = task.deadline - Date.now();
                const timerEl = document.getElementById(`timer-${index}`);
                if (diff <= 0) {
                    logEvent('task_deadline_reached', {
                        task: task.text,
                        points,
                        health,
                        remainingTasks: tasks.length
                    });
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


    window.addTask = addTask;
    loadProgress();


    // --- Download logs as JSON ---
    function downloadData() {
        const logs = JSON.parse(localStorage.getItem('logs') || '[]');
        const data = JSON.stringify(logs, null, 2); // `2` spaces for indentation
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'user_data.json';
        a.click();
    }
   

    // Make it accessible globally for the button
    window.downloadData = downloadData;


    function resetLogs() {
        localStorage.setItem('logs', '[]');
        alert('Experiment logs cleared!');
    }
    window.resetLogs = resetLogs;


});
