// Elements
const clickerButton = document.getElementById('clicker-btn');
const levelUpButton = document.getElementById('upgrade-click');
const cheeseCountLabel = document.getElementById('cheese-count');
const cpsLabel = document.getElementById('cps');
const levelInfoLabel = document.getElementById('level-info');
const upgradeButtons = document.getElementsByClassName('upgrade-button');

// Audio
const popSound = new Audio('./assets/audio/pop_sound.mp3');

// Background music and controls (header)
const bgMusicEl = document.getElementById('bg-music');
const musicToggleBtn = document.getElementById('music-toggle');
const musicMuteBtn = document.getElementById('music-mute');
const musicVolumeInput = document.getElementById('music-volume');
// Language selector
const langSelect = document.getElementById('lang-select');
// Default language: prefer saved value, otherwise default to Hebrew ('he')
let currentLang = localStorage.getItem('lang') || 'he';

// Simple translations for UI strings
const UI_TEXT = {
    en: {
        cheeseCount: 'Cheese Count: ',
        cps: 'Cheese Per Second: ',
        levelInfo: 'By leveling up you get abilities like more cheese per click and per second. It gets harder as you progress.<br><b>You are currently level {level}.</b>',
        levelUp: 'Level Up (Cost: {cost})',
        upgrades: {
            pointer: 'Pointer',
            goldenCheese: 'Golden Cheese',
            moonMagnet: 'Moon Magnet',
            cheeseFactory: 'Cheese Factory',
            cosmicCow: 'Cosmic Cow',
            rocketLauncher: 'Rocket Launcher'
        }
    },
    he: {
        cheeseCount: 'כמות גבינה: ',
        cps: 'גבינה לשנייה: ',
        levelInfo: 'על ידי העלאת רמה תקבל יכולות כמו יותר גבינה לכל לחיצה ולשנייה. זה נעשה קשה יותר ככל שתתקדם.<br><b>אתה כרגע ברמה {level}.</b>',
        levelUp: 'שדרג (עלות: {cost})',
        upgrades: {
            pointer: 'מצביע',
            goldenCheese: 'גבינת זהב',
            moonMagnet: 'מגנט ירח',
            cheeseFactory: 'מפעל גבינה',
            cosmicCow: 'פרה קוסמית',
            rocketLauncher: 'משגר רקטות'
        }
    }
};

// Extra UI labels
UI_TEXT.en.costLabel = 'Cost';
UI_TEXT.en.givesLabel = 'Gives';
UI_TEXT.en.ownedLabel = 'Owned';
UI_TEXT.en.units = { cps: 'CPS', cpc: 'CPC' };
UI_TEXT.en.noCheeseMsg = "You don't have enough cheese!";

UI_TEXT.he.costLabel = 'עלות';
UI_TEXT.he.givesLabel = 'תורם';
UI_TEXT.he.ownedLabel = 'בבעלות';
// Hebrew unit labels (localized abbreviations/phrases)
UI_TEXT.he.units = { cps: 'גבינה/שנייה', cpc: 'גבינה/לחיצה' };
UI_TEXT.he.noCheeseMsg = 'אין לך מספיק גבינה!';

// Music enable label for hint button
UI_TEXT.en.musicEnable = 'Enable Music';
UI_TEXT.he.musicEnable = 'הפעל מוסיקה';

function applyDirection() {
    try {
        const isRtl = currentLang === 'he';
        // Do not change the document root direction (keeps layout stable).
        // Instead toggle a class that only flips text direction for localized strings.
        if (isRtl) {
            document.body.classList.add('rtl-text');
        } else {
            document.body.classList.remove('rtl-text');
        }
    } catch (e) { console.error('applyDirection error', e); }
}

// Helper to format template strings like {level} and {cost}
function fmt(template, vars) {
    return template.replace(/\{(.*?)\}/g, (_, k) => vars[k.trim()] !== undefined ? vars[k.trim()] : '');
}

// Initialize music settings from localStorage
try {
    const savedVol = localStorage.getItem('musicVolume');
    const savedMuted = localStorage.getItem('musicMuted');
    const savedEnabled = localStorage.getItem('musicEnabled');
    const vol = savedVol !== null ? parseFloat(savedVol) : 0.5;
    if (bgMusicEl) {
        bgMusicEl.volume = Math.min(1, Math.max(0, vol));
        bgMusicEl.muted = savedMuted === '1';
        // reflect on the slider
        if (musicVolumeInput) musicVolumeInput.value = Math.round(bgMusicEl.volume * 100);
        // if saved as enabled, try to play (may be blocked until user gesture)
        if (savedEnabled === '1') {
            const p = bgMusicEl.play();
            if (p && p.catch) p.catch(() => { /* autoplay blocked; wait for user */ });
        }
    }
    // update UI icons
    updateMusicUI();
} catch (e) { console.error('music init error', e); }

function updateMusicUI() {
    if (!musicToggleBtn || !musicMuteBtn || !musicVolumeInput) return;
    if (!bgMusicEl) {
        musicToggleBtn.style.display = 'none';
        musicMuteBtn.style.display = 'none';
        musicVolumeInput.style.display = 'none';
        return;
    }
    // Show a simple On/Off indicator instead of play/pause icons
    musicToggleBtn.textContent = bgMusicEl.paused ? 'Off' : 'On';
    musicToggleBtn.setAttribute('aria-pressed', (!bgMusicEl.paused).toString());
    musicMuteBtn.textContent = bgMusicEl.muted ? '🔇' : '🔊';
    // keep the slider value in sync if visible
    if (musicVolumeInput) musicVolumeInput.value = Math.round(bgMusicEl.volume * 100);
}

// Attach control handlers (if elements exist)
if (musicToggleBtn && bgMusicEl) {
    musicToggleBtn.addEventListener('click', () => {
        if (bgMusicEl.paused) {
            bgMusicEl.play().catch(() => {});
            localStorage.setItem('musicEnabled', '1');
        } else {
            bgMusicEl.pause();
            localStorage.setItem('musicEnabled', '0');
        }
        updateMusicUI();
    });
}
if (musicMuteBtn && bgMusicEl) {
    musicMuteBtn.addEventListener('click', () => {
        bgMusicEl.muted = !bgMusicEl.muted;
        localStorage.setItem('musicMuted', bgMusicEl.muted ? '1' : '0');
        updateMusicUI();
    });
}
if (musicVolumeInput && bgMusicEl) {
    musicVolumeInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) || 0;
        bgMusicEl.volume = Math.min(1, Math.max(0, val / 100));
        // if volume set to 0, consider muted visually but don't toggle muted property
        localStorage.setItem('musicVolume', bgMusicEl.volume.toString());
        updateMusicUI();
    });
}

// Game Variables
let score = parseFloat(localStorage.getItem("score")) || 0;
let level = parseInt(localStorage.getItem("level")) || 1;
let cps = 0;
let cpc = 1;
let levelCost = 50;
let asideCPS = 0;
let asideCPC = 0;

// Upgrade definitions
const upgradeButtonsLabeled = {
    pointer: { name: 'Pointer', src: './assets/images/pointer.png', btn: upgradeButtons[0], baseCost: 15, baseCPS: 1, baseCPC: 2, timesBought: 0 },
    goldenCheese: { name: 'Golden Cheese', src: './assets/images/golden_cheese.png', btn: upgradeButtons[1], baseCost: 200, baseCPS: 5, baseCPC: 7, timesBought: 0 },
    moonMagnet: { name: 'Moon Magnet', src: './assets/images/moon-magnet.png', btn: upgradeButtons[2], baseCost: 1000, baseCPS: 20, baseCPC: 23, timesBought: 0 },
    cheeseFactory: { name: 'Cheese Factory', src: './assets/images/cheese-factory.png', btn: upgradeButtons[3], baseCost: 25000, baseCPS: 100, baseCPC: 120, timesBought: 0 },
    cosmicCow: { name: 'Cosmic Cow', src: './assets/images/cosmic-cow.png', btn: upgradeButtons[4], baseCost: 100000, baseCPS: 500, baseCPC: 600, timesBought: 0 },
    rocketLauncher: { name: 'Rocket Launcher', src: './assets/images/rocket-launcher.png', btn: upgradeButtons[5], baseCost: 20000000, baseCPS: 15000, baseCPC: 20000, timesBought: 0 }
};

// Add getters for scaled upgrade values
for (const key in upgradeButtonsLabeled) {
    const upgrade = upgradeButtonsLabeled[key];
    Object.defineProperty(upgrade, 'cpsUp', { get: () => Math.floor(upgrade.baseCPS * Math.pow(1.1, upgrade.timesBought)) });
    Object.defineProperty(upgrade, 'cpcUp', { get: () => Math.floor(upgrade.baseCPC * Math.pow(1.1, upgrade.timesBought)) });
    Object.defineProperty(upgrade, 'cost', { get: () => Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.timesBought) + upgrade.cpsUp + upgrade.cpcUp) });
}

// --- Moon upgrade persistence helpers ---
function _getStoredMoonUpgrades() {
    try {
        const raw = localStorage.getItem('moonUpgrades');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function _saveStoredMoonUpgrades(arr) {
    try { localStorage.setItem('moonUpgrades', JSON.stringify(arr)); } catch (e) { console.error(e); }
}

function _addStoredMoonUpgrade(entry) {
    const arr = _getStoredMoonUpgrades();
    arr.push(entry);
    _saveStoredMoonUpgrades(arr);
}

// --- Upgrade counts persistence ---
function _getStoredUpgradeCounts() {
    try { const raw = localStorage.getItem('upgradesState'); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}

function _saveStoredUpgradeCounts(obj) {
    try { localStorage.setItem('upgradesState', JSON.stringify(obj)); } catch (e) { console.error(e); }
}

function _setStoredUpgradeCount(key, timesBought) {
    const obj = _getStoredUpgradeCounts(); obj[key] = timesBought; _saveStoredUpgradeCounts(obj);
}

function _recomputeAsideValuesFromSaved() {
    // recompute asideCPS and asideCPC from stored timesBought for each upgrade
    asideCPS = 0; asideCPC = 0;
    for (const key in upgradeButtonsLabeled) {
        const u = upgradeButtonsLabeled[key];
        const times = u.timesBought || 0;
        // sum contributions for purchases 1..times
        let sumCps = 0, sumCpc = 0;
        for (let i = 1; i <= times; i++) {
            sumCps += Math.floor(u.baseCPS * Math.pow(1.1, i));
            sumCpc += Math.floor(u.baseCPC * Math.pow(1.1, i));
        }
        asideCPS += sumCps;
        asideCPC += sumCpc;
    }
}

function renderMoonUpgradeEntry(entry) {
    const upg = upgradeButtonsLabeled[entry.key];
    if (!upg) return;
    const moon = document.getElementById('moon');
    if (!moon) return;
    const rect = moon.getBoundingClientRect();
    const x = rect.left + (entry.rx * rect.width);
    const y = rect.top + (entry.ry * rect.height);
    const el = document.createElement('img');
    el.src = upg.src;
    el.className = 'moon-upgrade';
    // display slightly larger without changing source resolution
    el.width = 56;
    el.height = 56;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    // tag the element so we can find and reposition it later
    el.dataset.entryId = entry.id;
    el.dataset.upgradeKey = entry.key;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
        el.classList.add('show');
        setTimeout(() => el.classList.add('chill'), 80 + Math.floor(Math.random() * 240));
    });
}

function spawnUpgradeOnMoonKey(key, persist = true) {
    try {
        const upg = upgradeButtonsLabeled[key];
        if (!upg) return;
        const moon = document.getElementById('moon');
        if (!moon) return;
        const rect = moon.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const radius = Math.min(rect.width, rect.height) / 2 * 0.88;
        const theta = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        const rx = (x - rect.left) / rect.width;
        const ry = (y - rect.top) / rect.height;

        const entry = { id: Date.now().toString(36) + Math.floor(Math.random()*1000), key, rx, ry };
        // render now
        renderMoonUpgradeEntry(entry);
        if (persist) _addStoredMoonUpgrade(entry);
    } catch (err) { console.error('spawnUpgradeOnMoonKey error', err); }
}

// Update scaling values
function updateValues() {
    cpc = (level < 2 ? 1 : Math.ceil(level - 1 + Math.pow(level, 2.5))) + asideCPC;
    cps = (level < 2 ? 0 : Math.ceil(Math.pow(level,   2.25))) + asideCPS;
    levelCost = level < 2 ? 50 : Math.floor(50 * Math.pow(level, 2.8));
}

// Update UI
function updateCoreElements() {
    updateValues();
    // Use translations from currentLang
    const t = UI_TEXT[currentLang] || UI_TEXT.en;
    cheeseCountLabel.textContent = t.cheeseCount + Math.floor(score);
    cpsLabel.textContent = t.cps + cps;
    levelInfoLabel.innerHTML = fmt(t.levelInfo, { level });
    levelUpButton.textContent = fmt(t.levelUp, { cost: levelCost });
    for (const key in upgradeButtonsLabeled) {
        const upgrade = upgradeButtonsLabeled[key];
        // Use the upgrade's proper name and current cost when rendering the button label
        if (upgrade.btn) {
            // pick translated upgrade name if available
            const name = (UI_TEXT[currentLang] && UI_TEXT[currentLang].upgrades && UI_TEXT[currentLang].upgrades[key]) || upgrade.name;
            const costLabel = (UI_TEXT[currentLang] && UI_TEXT[currentLang].costLabel) || 'Cost';
            upgrade.btn.innerHTML = `<img src="${upgrade.src}" alt="${name}" width="32" height="32">  ${name} (${costLabel}: ${upgrade.cost})`;
            // keep a data-tooltip attribute if one exists in static HTML
            if (!upgrade.btn.dataset.tooltip) upgrade.btn.dataset.tooltip = upgrade.btn.getAttribute('data-tooltip') || '';
        }
    }
}

// Disable buttons
function DisableButtons(bool) {
    clickerButton.disabled = bool;
    levelUpButton.disabled = bool;
}

// Save game state
function saveCore() {
    localStorage.setItem("score", score);
    localStorage.setItem("level", level);
}

// Manual click
clickerButton.addEventListener('click', (e) => {
    register_click(cpc);
    popCheesePopup(e);
});

// Cheese popup
function popCheesePopup(e) {
    if (!e) return;
    const cheesePopup = document.createElement('div');
    cheesePopup.className = "cheese-popup fade-out-up";
    cheesePopup.style.left = (e.clientX + 10) + "px";
    cheesePopup.style.top = (e.clientY - 10) + "px";
    cheesePopup.innerHTML = `<img src="./assets/images/cheese.png" width="32" height="32"><span class="popup-text">+${cpc}</span>`;
    document.body.appendChild(cheesePopup);
    cheesePopup.addEventListener("animationend", () => cheesePopup.remove());
}

// Register click / add cheese
function register_click(amount) {
    score += amount;
    updateValues();
    updateCoreElements();
    saveCore();
    if (amount === cpc) {
        popSound.currentTime = 0;
        popSound.play();
    }
}

// Quiz popup
// quizData will be loaded dynamically from JSON files per language (fallback below)
let quizData = { questions: [] };

function loadQuestionsForLang(lang) {
    const path = `./assets/questions_${lang}.json`;
    fetch(path).then(r => {
        if (!r.ok) throw new Error('Questions file not found');
        return r.json();
    }).then(data => {
        if (data && Array.isArray(data.questions)) {
            quizData = data;
        }
    }).catch(err => {
        console.warn('Failed to load questions for', lang, err);
        // fallback: keep existing quizData if present
    });
}

function showQuestionPopup(questionData, onAnswerSelected) {
    const existing = document.getElementById('question-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'question-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = 9999;

    const popup = document.createElement('div');
    popup.style.backgroundColor = '#222';
    popup.style.padding = '20px';
    popup.style.borderRadius = '10px';
    popup.style.textAlign = 'center';
    popup.style.width = '90%';
    popup.style.maxWidth = '400px';
    popup.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
    popup.style.color = 'white';

    const questionEl = document.createElement('p');
    questionEl.textContent = questionData.question;
    questionEl.style.fontWeight = 'bold';
    questionEl.style.marginBottom = '20px';
    popup.appendChild(questionEl);

    questionData.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.style.display = 'block';
        btn.style.width = '100%';
        btn.style.margin = '8px 0';
        btn.style.padding = '12px';
        btn.style.border = 'none';
        btn.style.borderRadius = '5px';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#f1c40f';
        btn.style.color = '#fff';
        btn.style.fontSize = '16px';
        btn.style.fontWeight = 'bold';

        btn.addEventListener('click', () => {
            Array.from(popup.querySelectorAll('button')).forEach(b => b.disabled = true);
            if (i === questionData.correct || i === questionData.correctIndex) {
                btn.style.backgroundColor = '#2ecc71';
            } else {
                btn.style.backgroundColor = '#e74c3c';
                const correctIdx = questionData.correct !== undefined ? questionData.correct : questionData.correctIndex;
                if (popup.querySelectorAll('button')[correctIdx]) popup.querySelectorAll('button')[correctIdx].style.backgroundColor = '#2ecc71';
            }
            setTimeout(() => {
                overlay.remove();
                if (onAnswerSelected) onAnswerSelected(i === (questionData.correct !== undefined ? questionData.correct : questionData.correctIndex));
            }, 1200);
        });

        popup.appendChild(btn);
    });

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

// Show random question
function showRandomQuestion(callback) {
    if (!quizData.questions || quizData.questions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * quizData.questions.length);
    showQuestionPopup(quizData.questions[randomIndex], callback);
}

// Level Up with question
levelUpButton.addEventListener('click', () => {
    if (score >= levelCost) {
        showRandomQuestion(isCorrect => {
            if (isCorrect) {
                score -= levelCost;
                level++;
                updateCoreElements();
                saveCore();
            }
        });
    } else {
            const msg = (UI_TEXT[currentLang] && UI_TEXT[currentLang].noCheeseMsg) || UI_TEXT.en.noCheeseMsg;
            alert(msg);
    }
});

// Upgrade buttons
for (const key in upgradeButtonsLabeled) {
    const upgrade = upgradeButtonsLabeled[key];
    // If button element isn't present (safer on partial DOMs), skip this upgrade
    if (!upgrade.btn) continue;

    upgrade.btn.addEventListener('click', () => {
        if (score >= upgrade.cost) {
            showRandomQuestion(isCorrect => {
                if (isCorrect) {
                    score -= upgrade.cost;
                    upgrade.timesBought++;
                    // Increase aside totals by the contribution of this purchase
                    // (cpsUp/cpcUp are getters based on current timesBought)
                    asideCPS += upgrade.cpsUp;
                    asideCPC += upgrade.cpcUp;
                    // persist the timesBought for this upgrade
                    try { _setStoredUpgradeCount(key, upgrade.timesBought); } catch (e) { console.error(e); }
                    updateCoreElements();
                    saveCore();
                    // spawn a little icon on the moon to mark this purchase and save it
                    try { spawnUpgradeOnMoonKey && spawnUpgradeOnMoonKey(key, true); } catch (e) { console.error(e); }
                }
            });
        } else {
                const msg = (UI_TEXT[currentLang] && UI_TEXT[currentLang].noCheeseMsg) || UI_TEXT.en.noCheeseMsg;
                alert(msg);
        }
    });

    // Tooltip: show upgrade details and owned count on hover
    if (upgrade.btn) {
        const showTooltip = (e) => {
            // debug: tooltip requested
            console.debug(`showTooltip: ${upgrade.name}`, { key });
            // Remove any existing tooltip for this upgrade
            const existing = document.getElementById(`upgrade-tooltip-${key}`);
            if (existing) existing.remove();

            const tip = document.createElement('div');
            tip.className = 'upgrade-tooltip';
            tip.id = `upgrade-tooltip-${key}`;
            // use translated labels
            const tt = UI_TEXT[currentLang] || UI_TEXT.en;
            const costLabel = tt.costLabel || 'Cost';
            const givesLabel = tt.givesLabel || 'Gives';
            const ownedLabel = tt.ownedLabel || 'Owned';
            const units = (tt.units && tt.units.cps) ? tt.units : { cps: 'CPS', cpc: 'CPC' };
            // prefer translated upgrade name when available
            const translatedName = (tt.upgrades && tt.upgrades[key]) ? tt.upgrades[key] : upgrade.name;
            tip.dir = (currentLang === 'he') ? 'rtl' : 'ltr';
            tip.innerHTML = `
                <div class="ut-title">${translatedName}</div>
                <div class="ut-meta">${costLabel}: ${upgrade.cost}</div>
                <div class="ut-meta">${givesLabel}: +${upgrade.cpsUp} ${units.cps}, +${upgrade.cpcUp} ${units.cpc}</div>
                <div class="ut-meta">${ownedLabel}:<span class="ut-owned"> ${upgrade.timesBought}</span></div>
            `;
            document.body.appendChild(tip);

            // After appended, measure and position correctly
            requestAnimationFrame(() => {
                const rect = upgrade.btn.getBoundingClientRect();
                const tipRect = tip.getBoundingClientRect();
                const margin = 8;
                const spaceRight = window.innerWidth - rect.right;
                const spaceLeft = rect.left;
                if (currentLang === 'he') {
                    // Prefer placing tooltip to the left for RTL
                    if (spaceLeft > tipRect.width + 20) {
                        tip.style.left = (rect.left - tipRect.width - margin) + 'px';
                        tip.style.top = Math.max(8, rect.top) + 'px';
                    } else {
                        // place above the button, centered-ish
                        let left = rect.left;
                        left = Math.min(window.innerWidth - tipRect.width - 8, Math.max(8, left));
                        tip.style.left = left + 'px';
                        tip.style.top = Math.max(8, rect.top - tipRect.height - margin) + 'px';
                    }
                } else {
                    if (spaceRight > tipRect.width + 20) {
                        tip.style.left = (rect.right + margin) + 'px';
                        tip.style.top = Math.max(8, rect.top) + 'px';
                    } else {
                        // place above the button, centered-ish
                        let left = rect.left;
                        left = Math.min(window.innerWidth - tipRect.width - 8, Math.max(8, left));
                        tip.style.left = left + 'px';
                        tip.style.top = Math.max(8, rect.top - tipRect.height - margin) + 'px';
                    }
                }
                tip.classList.add('show');
            });
        };

        const hideTooltip = () => {
            console.debug(`hideTooltip: ${upgrade.name}`, { key });
            const t = document.getElementById(`upgrade-tooltip-${key}`);
            if (t) t.remove();
        };

        // Attach events to the button only (mouseenter/mouseleave prevents flicker
        // when moving between the button and its child image)
        upgrade.btn.addEventListener('mouseenter', showTooltip);
        upgrade.btn.addEventListener('mouseleave', hideTooltip);

        // Keep tooltip positioned while moving over the button
        upgrade.btn.addEventListener('mousemove', () => {
            const t = document.getElementById(`upgrade-tooltip-${key}`);
            if (!t) return;
            const rect = upgrade.btn.getBoundingClientRect();
            const tipRect = t.getBoundingClientRect();
            const spaceRight = window.innerWidth - rect.right;
            const margin = 8;
            if (spaceRight > tipRect.width + 20) {
                t.style.left = (rect.right + margin) + 'px';
                t.style.top = Math.max(8, rect.top) + 'px';
            } else {
                let left = rect.left;
                left = Math.min(window.innerWidth - tipRect.width - 8, Math.max(8, left));
                t.style.left = left + 'px';
                t.style.top = Math.max(8, rect.top - tipRect.height - margin) + 'px';
            }
        });

        // Touch support: on touch devices, first tap shows tooltip, second tap proceeds to click
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
        if (isTouch) {
            upgrade.btn.addEventListener('touchstart', (ev) => {
                const existing = document.getElementById(`upgrade-tooltip-${key}`);
                if (existing) {
                    // Tooltip already shown: allow the normal click/tap to proceed (second tap)
                    return;
                }
                // First tap: show tooltip and prevent the click from firing
                ev.preventDefault();
                ev.stopPropagation();
                showTooltip(ev.touches ? ev.touches[0] : ev);

                // Hide tooltip when tapping anywhere outside this button
                const hideOnOutside = (e) => {
                    const t = document.getElementById(`upgrade-tooltip-${key}`);
                    if (!t) return;
                    if (!upgrade.btn.contains(e.target)) {
                        hideTooltip();
                        document.removeEventListener('touchstart', hideOnOutside, true);
                    }
                };
                // Use capture so this fires before the button's click if user taps elsewhere
                document.addEventListener('touchstart', hideOnOutside, true);
            }, { passive: false });
        }
    }

    // When an upgrade is bought, spawn a small icon at a random spot on the moon
    function spawnUpgradeOnMoon(upg) {
        try {
            const moon = document.getElementById('moon');
            if (!moon) return;
            const rect = moon.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            // Use radius slightly smaller than half width to avoid edges
            const radius = Math.min(rect.width, rect.height) / 2 * 0.88;

            // Pick random point inside circle (uniform): r = sqrt(rand)*R
            const theta = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * radius;
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);

            const el = document.createElement('img');
            el.src = upg.src;
            el.className = 'moon-upgrade';
            el.width = 56;
            el.height = 56;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            document.body.appendChild(el);
            // show and give it a chill idle animation so it stays on the moon
            requestAnimationFrame(() => {
                el.classList.add('show');
                // small random delay before starting the chill animation for variety
                setTimeout(() => el.classList.add('chill'), 80 + Math.floor(Math.random() * 240));
            });
        } catch (err) {
            console.error('spawnUpgradeOnMoon error', err);
        }
    }
}

// Smooth CPS (20 ticks per second)
const TICKS = 20;
setInterval(() => {
    const amount = cps / TICKS;
    if (amount > 0) register_click(amount);
    updateValues();
    updateCoreElements();
    saveCore();
}, 1000 / TICKS);

// quizData is loaded dynamically per-language using `loadQuestionsForLang`.

// Initial UI update
updateCoreElements();
saveCore();
DisableButtons(false);

// Initialize language selector and load questions for current language
try {
    if (langSelect) {
        langSelect.value = currentLang;
        // If the user had no saved preference, persist the default ('he') so future loads keep it
        if (!localStorage.getItem('lang')) localStorage.setItem('lang', currentLang);
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value || 'en';
            localStorage.setItem('lang', currentLang);
            loadQuestionsForLang(currentLang);
            applyDirection();
            updateCoreElements();
        });
    }
    // load questions for the saved or default language
    applyDirection();
    loadQuestionsForLang(currentLang);
} catch (e) { console.error('language init error', e); }

// Try to start background music 3 seconds after entering the page.
// If autoplay is blocked by the browser, show a small localized button to allow the user to enable it.
try {
    if (bgMusicEl) {
        setTimeout(() => {
            try {
                // Don't force-start if user explicitly disabled music previously
                if (localStorage.getItem('musicEnabled') === '0') return;
                // If already playing, nothing to do
                if (!bgMusicEl.paused) return;
                const p = bgMusicEl.play();
                if (p && p.then) {
                    p.then(() => {
                        localStorage.setItem('musicEnabled', '1');
                        updateMusicUI();
                    }).catch(() => {
                        // Autoplay blocked: show a localized enable button
                        const hintId = 'music-enable-hint';
                        if (document.getElementById(hintId)) return;
                        const hint = document.createElement('div');
                        hint.id = hintId;
                        hint.style.position = 'fixed';
                        hint.style.right = '16px';
                        hint.style.bottom = '16px';
                        hint.style.zIndex = 10000;
                        hint.style.background = 'rgba(0,0,0,0.8)';
                        hint.style.color = '#fff';
                        hint.style.padding = '8px';
                        hint.style.borderRadius = '6px';
                        hint.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';
                        const btn = document.createElement('button');
                        btn.textContent = (UI_TEXT[currentLang] && UI_TEXT[currentLang].musicEnable) || UI_TEXT.en.musicEnable;
                        btn.style.padding = '8px 12px';
                        btn.style.border = 'none';
                        btn.style.borderRadius = '4px';
                        btn.style.cursor = 'pointer';
                        btn.style.background = '#f1c40f';
                        btn.style.color = '#000';
                        btn.addEventListener('click', () => {
                            bgMusicEl.play().then(() => {
                                localStorage.setItem('musicEnabled', '1');
                                updateMusicUI();
                                hint.remove();
                            }).catch(() => {
                                // still blocked: leave the hint
                            });
                        });
                        hint.appendChild(btn);
                        document.body.appendChild(hint);
                    });
                }
            } catch (err) { console.error('autoplay error', err); }
        }, 3000);
    }
} catch (e) { console.error('autoplay init error', e); }

// Render any saved moon upgrades
try {
    const saved = _getStoredMoonUpgrades();
    if (Array.isArray(saved)) saved.forEach(renderMoonUpgradeEntry);
} catch (e) { console.error(e); }

// Keep moon upgrade icons correctly positioned when layout changes.
function updateAllMoonUpgradePositions() {
    try {
        const moon = document.getElementById('moon');
        if (!moon) return;
        const rect = moon.getBoundingClientRect();
        const saved = _getStoredMoonUpgrades();
        if (!Array.isArray(saved)) return;
        saved.forEach(entry => {
            const sel = document.querySelector(`img.moon-upgrade[data-entry-id="${entry.id}"]`);
            const x = rect.left + (entry.rx * rect.width);
            const y = rect.top + (entry.ry * rect.height);
            if (sel) {
                sel.style.left = `${x}px`;
                sel.style.top = `${y}px`;
            } else {
                // if the element was removed for some reason, recreate it
                renderMoonUpgradeEntry(entry);
            }
        });
    } catch (err) { console.error('updateAllMoonUpgradePositions error', err); }
}

// Use ResizeObserver to react to moon size/position changes and window events
try {
    const moonEl = document.getElementById('moon');
    if (moonEl && window.ResizeObserver) {
        const ro = new ResizeObserver(() => updateAllMoonUpgradePositions());
        ro.observe(moonEl);
    }
    window.addEventListener('resize', updateAllMoonUpgradePositions);
    window.addEventListener('scroll', updateAllMoonUpgradePositions, { passive: true });
    window.addEventListener('orientationchange', updateAllMoonUpgradePositions);
    // Periodic fallback in case layout changes aren't caught by observers (every 750ms)
    setInterval(updateAllMoonUpgradePositions, 750);
} catch (e) { console.error('moon position observers init error', e); }

// Load saved upgrade counts and recompute aside totals so purchased upgrades persist
try {
    const savedCounts = _getStoredUpgradeCounts();
    for (const k in savedCounts) {
        if (upgradeButtonsLabeled[k]) upgradeButtonsLabeled[k].timesBought = savedCounts[k];
    }
    _recomputeAsideValuesFromSaved();
    updateCoreElements();
} catch (e) { console.error('upgrade load error', e); }

// Global listeners: hide any open upgrade tooltip when clicking/tapping outside
document.addEventListener('click', (ev) => {
    document.querySelectorAll('.upgrade-tooltip').forEach(t => {
        const id = t.id || '';
        const key = id.replace('upgrade-tooltip-', '');
        const btn = upgradeButtonsLabeled[key] && upgradeButtonsLabeled[key].btn;
        if (btn && btn.contains(ev.target)) return; // clicked the button, keep it
        t.remove();
    });
});
document.addEventListener('touchstart', (ev) => {
    document.querySelectorAll('.upgrade-tooltip').forEach(t => {
        const id = t.id || '';
        const key = id.replace('upgrade-tooltip-', '');
        const btn = upgradeButtonsLabeled[key] && upgradeButtonsLabeled[key].btn;
        if (btn && btn.contains(ev.target)) return; // touched the button, keep it
        t.remove();
    });
}, { passive: true });
