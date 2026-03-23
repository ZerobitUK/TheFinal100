const game = {
    state: {
        totalOrgasms: 0,
        nextAllowedRoll: null,
        history: [],
        level: 1
    },

    init() {
        const saved = localStorage.getItem('chastity_game_data_final');
        if (saved) this.state = JSON.parse(saved);
        this.updateUI();
    },

    save() {
        localStorage.setItem('chastity_game_data_final', JSON.stringify(this.state));
    },

    getLevel(count) {
        return Math.min(10, Math.floor(count / 10) + 1);
    },

    getNextMonthDate(date, months) {
        let d = new Date(date);
        d.setMonth(d.getMonth() + months);
        d.setDate(d.getDate() - 1); // UK "minus-one" logic
        return d;
    },

    getWaitPeriod(level, type) {
        const waits = {
            3: { full: { v: 7, u: 'd' } },
            4: { full: { v: 14, u: 'd' }, ruined: { v: 7, u: 'd' } },
            5: { full: { v: 21, u: 'd' }, ruined: { v: 14, u: 'd' } },
            6: { full: { v: 1, u: 'm' }, ruined: { v: 21, u: 'd' } },
            7: { full: { v: 42, u: 'd' }, ruined: { v: 1, u: 'm' } },
            8: { full: { v: 2, u: 'm' }, ruined: { v: 42, u: 'd' } },
            10: { ruined: { v: 3, u: 'm' } }
        };
        return waits[level] ? waits[level][type] : null;
    },

    handleRoll() {
        const roll = Math.floor(Math.random() * 6) + 1;
        const level = this.getLevel(this.state.totalOrgasms);
        let outcome = "No orgasm";
        let wait = null;

        if (roll === 5) { outcome = "Ruined Orgasm"; this.state.totalOrgasms++; wait = this.getWaitPeriod(level, 'ruined'); }
        if (roll === 6) { outcome = "Full Orgasm"; this.state.totalOrgasms++; wait = this.getWaitPeriod(level, 'full'); }

        this.applyWait(wait);
        this.logAction(outcome, roll);
    },

    handleScheduled() {
        const level = this.getLevel(this.state.totalOrgasms);
        this.state.totalOrgasms++;
        let wait = (level === 10) ? { v: 3, u: 'm' } : null; 
        this.applyWait(wait);
        this.logAction("Scheduled Orgasm", "N/A");
    },

    applyWait(wait) {
        let next = new Date();
        if (wait) {
            if (wait.u === 'd') next.setDate(next.getDate() + wait.v);
            if (wait.u === 'm') next = this.getNextMonthDate(next, wait.v);
        } else {
            next.setDate(next.getDate() + 1);
        }
        this.state.nextAllowedRoll = next.getTime();
        this.save();
        this.updateUI();
    },

    logAction(outcome, roll) {
        this.state.history.push({
            date: new Date().toLocaleDateString('en-GB'),
            roll: roll,
            outcome: outcome
        });
        this.save();
        this.updateUI();
    },

    updateUI() {
        const now = new Date();
        const level = this.getLevel(this.state.totalOrgasms);
        const nextDate = new Date(this.state.nextAllowedRoll);
        
        document.getElementById('total-count').innerText = `${this.state.totalOrgasms} / 100`;
        document.getElementById('level-display').innerText = level;

        const rollBtn = document.getElementById('roll-btn');
        const claimBtn = document.getElementById('claim-btn');
        const statusTitle = document.getElementById('status-title');
        const statusDesc = document.getElementById('status-desc');

        if (this.state.totalOrgasms >= 100) {
            statusTitle.innerText = "Permanent Chastity";
            statusDesc.innerText = "The road has ended.";
            rollBtn.classList.add('hidden');
            return;
        }

        const isWaiting = this.state.nextAllowedRoll && now < nextDate;

        if (level === 9) {
            rollBtn.classList.add('hidden');
            claimBtn.classList.remove('hidden');
            claimBtn.disabled = isWaiting || now.getDate() !== 31;
            statusTitle.innerText = "Level 9: Scheduled";
            statusDesc.innerText = isWaiting ? `Waiting until ${nextDate.toLocaleDateString('en-GB')}` : "Available only on the 31st.";
        } else if (level === 10) {
            rollBtn.classList.add('hidden');
            claimBtn.classList.remove('hidden');
            claimBtn.disabled = isWaiting;
            statusTitle.innerText = "Level 10: The Final Nine";
            statusDesc.innerText = isWaiting ? `Locked until ${nextDate.toLocaleDateString('en-GB')}` : "One ruined orgasm available.";
        } else {
            rollBtn.disabled = isWaiting;
            statusTitle.innerText = isWaiting ? "Locked" : "Ready";
            statusDesc.innerText = isWaiting ? `Next roll: ${nextDate.toLocaleDateString('en-GB')}` : "Roll your daily die.";
        }

        document.getElementById('history-log').innerHTML = this.state.history.slice().reverse().map(h => 
            `<div>${h.date}: ${h.outcome} (Roll: ${h.roll})</div>`
        ).join('');
    },

    runSimulation() {
        let simCount = 0;
        let simDate = new Date();
        const start = new Date(simDate);
        let nextRoll = new Date(simDate);
        let simLog = [];

        while (simCount < 100) {
            let lvl = this.getLevel(simCount);
            if (simDate >= nextRoll) {
                if (lvl === 10) {
                    simCount++;
                    simLog.push(`${simDate.toLocaleDateString('en-GB')}: Final Countdown #${simCount}`);
                    simDate.setMonth(simDate.getMonth() + 3);
                    nextRoll = new Date(simDate);
                } else if (lvl === 9) {
                    if (simDate.getDate() === 31) {
                        simCount++;
                        simLog.push(`${simDate.toLocaleDateString('en-GB')}: Scheduled 31st Orgasm`);
                        simDate.setDate(simDate.getDate() + 1);
                        nextRoll = new Date(simDate);
                    }
                } else {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    if (roll >= 5) {
                        simCount++;
                        const type = roll === 6 ? 'full' : 'ruined';
                        simLog.push(`${simDate.toLocaleDateString('en-GB')}: Level ${lvl} ${type.toUpperCase()}`);
                        let wait = this.getWaitPeriod(lvl, type);
                        if (wait) {
                            if (wait.u === 'd') simDate.setDate(simDate.getDate() + wait.v);
                            if (wait.u === 'm') simDate = this.getNextMonthDate(simDate, wait.v);
                        }
                        nextRoll = new Date(simDate);
                    }
                }
            }
            simDate.setDate(simDate.getDate() + 1);
        }

        const years = ((simDate - start) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
        document.getElementById('sim-results').classList.remove('hidden');
        document.getElementById('sim-summary').innerText = `Simulation Complete: ${years} Years. Permanent Chastity on ${simDate.toLocaleDateString('en-GB')}`;
        document.getElementById('sim-log').innerHTML = simLog.reverse().map(l => `<div>${l}</div>`).join('');
    },

    confirmReset() { if (confirm("Reset everything?")) { localStorage.clear(); location.reload(); } }
};

game.init();
