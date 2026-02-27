// 共用全域變數
let currentQuestionIndex = 0;
let stats = { mil: 50, nat: 50, rep: 50 };

// 共用 DOM 元素參考
const screens = {
    menu: document.getElementById('screen-menu'),
    intro: document.getElementById('screen-intro'),
    reading: document.getElementById('screen-reading'),
    game: document.getElementById('screen-game'),
    end: document.getElementById('screen-end'),
    feedback: document.getElementById('screen-feedback')
};
const elNavControls = document.getElementById('top-nav-controls');

// ==========================================
// 共用 UI 函式
// ==========================================
function switchScreen(screenName) {
    Object.values(screens).forEach(s => {
        if (s) s.classList.add('hidden');
    });
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.remove('fade-in');
        void screens[screenName].offsetWidth;
        screens[screenName].classList.add('fade-in');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function returnToMenu() {
    // 導向首頁，並確保清空可能存在的 hash
    window.location.href = 'index.html';
}

function goToReading() {
    switchScreen('reading');
}

// ==========================================
// 沙盤推演系統 (Simulation Engine)
// ==========================================
function startGame() {
    if (!window.pageEpisodeData || !window.pageEpisodeData.dilemmas) return;
    currentQuestionIndex = 0;
    stats = { mil: 50, nat: 50, rep: 50 };
    updateUIStats();
    switchScreen('game');
    loadQuestion();
}

function updateUIStats() {
    stats.mil = Math.max(0, Math.min(100, stats.mil));
    stats.nat = Math.max(0, Math.min(100, stats.nat));
    stats.rep = Math.max(0, Math.min(100, stats.rep));

    document.getElementById('stat-mil-val').textContent = stats.mil;
    document.getElementById('stat-mil-bar').style.width = `${stats.mil}%`;
    document.getElementById('stat-nat-val').textContent = stats.nat;
    document.getElementById('stat-nat-bar').style.width = `${stats.nat}%`;
    document.getElementById('stat-rep-val').textContent = stats.rep;
    document.getElementById('stat-rep-bar').style.width = `${stats.rep}%`;
}

let typeWriterTimeout;
function typeWriter(text, elementId, speed, callback) {
    let i = 0;
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    el.classList.add('typewriter');

    function type() {
        if (i < text.length) {
            if (text.charAt(i) === '<') {
                let tag = '';
                while (text.charAt(i) !== '>' && i < text.length) {
                    tag += text.charAt(i);
                    i++;
                }
                tag += '>';
                el.innerHTML += tag;
                i++;
            } else {
                el.innerHTML += text.charAt(i);
                i++;
            }
            typeWriterTimeout = setTimeout(type, speed);
        } else {
            el.classList.remove('typewriter');
            if (callback) callback();
        }
    }
    type();
}

function loadQuestion() {
    clearTimeout(typeWriterTimeout);
    const data = window.pageEpisodeData.dilemmas[currentQuestionIndex];

    screens.feedback.classList.add('hidden');
    const elOptions = document.getElementById('options-container');
    elOptions.innerHTML = '';
    elOptions.classList.add('hidden');
    elOptions.classList.remove('opacity-100');

    document.getElementById('dilemma-year').textContent = data.year;
    document.getElementById('dilemma-title').textContent = data.title;
    document.getElementById('dilemma-progress').textContent = `${currentQuestionIndex + 1}/${window.pageEpisodeData.dilemmas.length}`;

    typeWriter(data.context, 'dilemma-context', 20, () => {
        elOptions.classList.remove('hidden');
        setTimeout(() => elOptions.classList.add('opacity-100'), 100);
    });

    data.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'dilemma-btn w-full text-left p-4 rounded bg-white border-2 border-gray-300 text-gray-800 font-medium text-base shadow-sm flex items-start gap-3';
        btn.innerHTML = `<span class="mt-1 font-bold text-red-800 border-2 border-red-800 rounded-sm px-2 py-0.5 text-xs whitespace-nowrap">發送決策</span> <span class="leading-relaxed">${opt.text}</span>`;
        btn.onclick = () => selectOption(opt, btn);
        elOptions.appendChild(btn);
    });
}

function showStatFloat(id, val) {
    const el = document.getElementById(id);
    if (val === 0) return;
    el.textContent = val > 0 ? `+${val}` : val;
    el.className = `absolute right-0 -top-6 text-sm font-bold stat-change ${val > 0 ? 'text-green-400' : 'text-red-400'}`;
    void el.offsetWidth;
}

function getStatResHTML(val) {
    if (val > 0) return `<span class="text-green-500 font-bold">▲ +${val}</span>`;
    if (val < 0) return `<span class="text-red-500 font-bold">▼ ${val}</span>`;
    return `<span class="text-gray-500 font-bold">➖ 0</span>`;
}

function selectOption(selectedOpt, btnElement) {
    clearTimeout(typeWriterTimeout);
    document.getElementById('dilemma-context').classList.remove('typewriter');

    const buttons = document.getElementById('options-container').querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.className = 'w-full text-left p-4 rounded border-2 text-base opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 flex items-start gap-3';
    });

    btnElement.className = 'w-full text-left p-4 rounded border-2 text-base opacity-100 bg-gray-800 text-white font-bold border-gray-900 shadow-md flex items-start gap-3';

    const dStats = selectedOpt.stats;
    stats.mil += dStats[0];
    stats.nat += dStats[1];
    stats.rep += dStats[2];

    showStatFloat('stat-mil-float', dStats[0]);
    showStatFloat('stat-nat-float', dStats[1]);
    showStatFloat('stat-rep-float', dStats[2]);
    updateUIStats();

    const elFeedbackTitle = document.getElementById('feedback-title');
    elFeedbackTitle.textContent = selectedOpt.feedbackTitle;
    elFeedbackTitle.className = `text-2xl md:text-3xl font-bold mb-4 serif-text leading-snug ${selectedOpt.isHistorical ? 'text-yellow-400' : 'text-red-400'}`;

    document.getElementById('feedback-explanation').innerHTML = selectedOpt.feedbackText;

    document.getElementById('res-mil-icon').innerHTML = getStatResHTML(dStats[0]);
    document.getElementById('res-nat-icon').innerHTML = getStatResHTML(dStats[1]);
    document.getElementById('res-rep-icon').innerHTML = getStatResHTML(dStats[2]);

    screens.feedback.classList.remove('hidden');
    screens.feedback.classList.add('fade-in');

    const nextBtn = document.getElementById('next-btn');
    if (currentQuestionIndex === window.pageEpisodeData.dilemmas.length - 1) {
        nextBtn.innerHTML = '查看歷史定性總結 ➔';
    } else {
        nextBtn.innerHTML = '進入下一階段推演 ➔';
    }

    setTimeout(() => screens.feedback.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < window.pageEpisodeData.dilemmas.length) {
        loadQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        showEndScreen();
    }
}

function determineTitle() {
    if (stats.mil > 60 && stats.rep < 40) return "背負罵名的實用主義者";
    if (stats.nat < 30 && stats.rep > 60) return "亡國的道德烈士";
    if (stats.mil < 30 && stats.nat < 30) return "歷史洪流下的犧牲品";
    if (stats.nat > 60 && stats.rep < 40) return "忍辱負重的救贖者";
    return "絕境中的掙扎者";
}

function showEndScreen() {
    switchScreen('end');
    document.getElementById('end-summary').innerHTML = window.pageEpisodeData.summary;
    document.getElementById('end-stat-mil').textContent = stats.mil;
    document.getElementById('end-stat-nat').textContent = stats.nat;
    document.getElementById('end-stat-rep').textContent = stats.rep;
    document.getElementById('final-title').textContent = `【${determineTitle()}】`;
}
