const game = {
    state: {
        totalOrgasms: 0,
        nextAllowedRoll: null,
        history: [],
        level: 1
    },

    init() {
        const saved = localStorage.getItem('chastity_game_data');
        if (saved) this.state = JSON.parse(saved);
        this.updateUI();
    },

    save() {
        localStorage.setItem('chastity_game_data', JSON.stringify(this.state));
    },

    calculateLevel() {
        return Math.min(10, Math.floor(this.state.totalOrgasms / 10) + 1);
    },

    // Handles the "minus-one" logic for months
    getNextMonthDate(date, months) {
        let d = new Date(date);
        d.setMonth(d.getMonth() + months);
        d.setDate(d.getDate() - 1);
        return d;
    },

    handleRoll() {
        const roll = Math.floor(Math.random() * 6) + 1;
        const level = this.calculateLevel();
        let outcome = "No orgasm";
        let waitTime = null;

        if (roll === 5) { // Ruined
            outcome = "Ruined Orgasm";
            this.state.totalOrgasms++;
            waitTime = this.getWaitPeriod(level, "ruined");
        } else if (roll === 6) { // Full
            outcome = "Full Orgasm";
            this.state.totalOrgasms++;
            waitTime = this.getWaitPeriod(level, "full");
        }

        // Set next roll date
        let nextDate = new Date();
        if (waitTime) {
            if (waitTime.unit === 'days') nextDate.setDate(nextDate.getDate() + waitTime.value);
            if (waitTime.unit === 'months') nextDate = this.getNextMonthDate(nextDate, waitTime.value);
        } else {
            nextDate.setDate(nextDate.getDate() + 1); // Standard daily roll
        }

        this.state.nextAllowedRoll = nextDate.getTime();
        this.state.history.push({
            date: new Date().toLocaleDateString('en-GB'),
            roll: roll,
            outcome: outcome
        });

        this.save();
        this.updateUI();
    },

    getWaitPeriod(level, type) {
        if (level === 3 && type === 'full') return { value: 7, unit: 'days' };
        if (level === 4) return type === 'full' ? { value: 14, unit: 'days' } : { value: 7, unit: 'days' };
        if (level === 5) return type === 'full' ? { value: 21, unit: 'days' } : { value: 14, unit: 'days' };
        if (level === 6) return type === 'full' ? { value: 1, unit: 'months' } : { value: 21, unit: 'days' };
        if (level === 7) return type === 'full' ? { value: 42, unit: 'days' } : { value: 1, unit: 'months' };
        if (level === 8) return type === 'full' ? { value: 2, unit: 'months' } : { value: 42, unit: 'days' };
        return null;
    },

    updateUI() {
        const now = new Date().getTime();
        const level = this.calculateLevel();
        
        document.getElementById('total-count').innerText = `${this.state.totalOrgasms} / 100`;
        document.getElementById('level-display').innerText = level;

        const btn = document.getElementById('roll-btn');
        const title = document.getElementById('status-title');
        const desc = document.getElementById('status-desc');

        if (this.state.totalOrgasms >= 100) {
            title.innerText = "Permanent Chastity";
            desc.innerText = "The journey is complete.";
            btn.classList.add('hidden');
        } else if (this.state.nextAllowedRoll && now < this.state.nextAllowedRoll) {
            const nextDate = new Date(this.state.nextAllowedRoll).toLocaleDateString('en-GB');
            title.innerText = "Waiting Period";
            desc.innerText = `You may roll again on ${nextDate}`;
            btn.disabled = true;
        } else {
            title.innerText = "Ready to Roll";
            desc.innerText = "Standard d6 rules apply for your level.";
            btn.disabled = false;
        }

        // Display history
        const log = document.getElementById('history-log');
        log.innerHTML = this.state.history.slice().reverse().map(entry => `
            <div class="log-entry">
                <strong>${entry.date}</strong>: Rolled ${entry.roll} - ${entry.outcome}
            </div>
        `).join('');
    },

    confirmReset() {
        if (confirm("Are you sure you want to reset your progress? This cannot be undone.")) {
            localStorage.clear();
            location.reload();
        }
    }
};

game.init();
