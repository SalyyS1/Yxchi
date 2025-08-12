// Extra script implementing check-in, achievements, guestbook, memory, winter mode and settings
document.addEventListener('DOMContentLoaded', function() {
    // Acquire references to footer buttons and modals
    const checkinBtn = document.getElementById('checkin-btn');
    const achievementsBtn = document.getElementById('achievements-btn');
    const guestbookBtn = document.getElementById('guestbook-btn');
    const memoryBtn = document.getElementById('memory-btn');
    const winterBtn = document.getElementById('winter-btn');
    const settingsBtn = document.getElementById('settings-btn');

    const checkinModal = document.getElementById('checkin-modal');
    const achievementsModal = document.getElementById('achievements-modal');
    const guestbookModal = document.getElementById('guestbook-modal');
    const memoryModal = document.getElementById('memory-modal');
    const settingsModal = document.getElementById('settings-modal');

    const modalOverlays = document.querySelectorAll('.modal-overlay');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    function closeAllModals() {
        modalOverlays.forEach(modal => modal.classList.remove('active'));
    }
    function openModal(modal) {
        closeAllModals();
        if (modal) modal.classList.add('active');
    }
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });
    // Footer button events
    if (checkinBtn) checkinBtn.addEventListener('click', () => openModal(checkinModal));
    if (achievementsBtn) achievementsBtn.addEventListener('click', () => openModal(achievementsModal));
    if (guestbookBtn) guestbookBtn.addEventListener('click', () => openModal(guestbookModal));
    if (memoryBtn) memoryBtn.addEventListener('click', () => openModal(memoryModal));
    if (settingsBtn) settingsBtn.addEventListener('click', () => openModal(settingsModal));
    if (winterBtn) winterBtn.addEventListener('click', () => {
        const enabled = !document.body.classList.contains('winter-mode');
        setWinterMode(enabled);
        unlockAchievement('winter_mode');
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAllModals();
    });

    /* === Settings Persistence === */
    function loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('settings')) || { winterMode: false, autoMusic: true, showCursor: true };
        } catch(e) {
            return { winterMode: false, autoMusic: true, showCursor: true };
        }
    }
    function saveSettings(s) {
        localStorage.setItem('settings', JSON.stringify(s));
    }
    let settings = loadSettings();
    function setWinterMode(enabled) {
        document.body.classList.toggle('winter-mode', enabled);
        settings.winterMode = enabled;
        saveSettings(settings);
        const winterToggle = document.getElementById('settings-winter-toggle');
        if (winterToggle) winterToggle.checked = enabled;
    }
    function setAutoMusic(enabled) {
        settings.autoMusic = enabled;
        saveSettings(settings);
        const autoToggle = document.getElementById('settings-auto-music-toggle');
        if (autoToggle) autoToggle.checked = enabled;
    }
    function setCursorVisible(visible) {
        settings.showCursor = visible;
        saveSettings(settings);
        const cursor = document.querySelector('.cursor');
        const follower = document.querySelector('.cursor-follower');
        if (cursor && follower) {
            cursor.style.display = visible ? 'block' : 'none';
            follower.style.display = visible ? 'block' : 'none';
        }
        const toggle = document.getElementById('settings-cursor-toggle');
        if (toggle) toggle.checked = visible;
    }
    // Apply stored settings on load
    setWinterMode(settings.winterMode);
    setAutoMusic(settings.autoMusic);
    setCursorVisible(settings.showCursor);
    // Bind toggles
    const winterToggleEl = document.getElementById('settings-winter-toggle');
    const autoMusicToggleEl = document.getElementById('settings-auto-music-toggle');
    const cursorToggleEl = document.getElementById('settings-cursor-toggle');
    if (winterToggleEl) winterToggleEl.addEventListener('change', (e) => setWinterMode(e.target.checked));
    if (autoMusicToggleEl) autoMusicToggleEl.addEventListener('change', (e) => setAutoMusic(e.target.checked));
    if (cursorToggleEl) cursorToggleEl.addEventListener('change', (e) => setCursorVisible(e.target.checked));

    // Adjust greeting overlay music autoplay
    if (!settings.autoMusic && typeof customAudio !== 'undefined') {
        userPaused = true;
        musicStarted = true;
        customAudio.pause();
    }

    /* === Check-in Feature === */
    // Create 100 messages (simple inspirational placeholders)
    const dailyMessages = Array.from({ length: 100 }, (_, i) => `Ngày ${i+1}: Hãy tận hưởng cuộc sống và luôn mỉm cười!`);
    function loadCheckinState() {
        try {
            return JSON.parse(localStorage.getItem('checkinState')) || { day: 0, lastDate: null };
        } catch (e) {
            return { day: 0, lastDate: null };
        }
    }
    function saveCheckinState(state) {
        localStorage.setItem('checkinState', JSON.stringify(state));
    }
    function updateCheckinDisplay() {
        const state = loadCheckinState();
        const infoEl = document.getElementById('checkin-info');
        const msgEl = document.getElementById('checkin-message');
        if (state.day >= dailyMessages.length) {
            msgEl.textContent = 'Bạn đã hoàn thành đủ 100 ngày điểm danh! 🎉';
            if (infoEl) infoEl.textContent = '';
        } else {
            msgEl.textContent = 'Hãy điểm danh để nhận lời nhắn hôm nay!';
            if (infoEl) infoEl.textContent = `Bạn đã hoàn thành ${state.day}/100 ngày.`;
        }
    }
    function doCheckin() {
        const state = loadCheckinState();
        const today = new Date().toISOString().split('T')[0];
        const msgEl = document.getElementById('checkin-message');
        if (!msgEl) return;
        if (state.lastDate === today) {
            msgEl.textContent = 'Bạn đã điểm danh hôm nay rồi!';
        } else if (state.day < dailyMessages.length) {
            state.day += 1;
            state.lastDate = today;
            saveCheckinState(state);
            msgEl.textContent = dailyMessages[state.day - 1];
            unlockAchievement(`checkin_${state.day}`);
        } else {
            msgEl.textContent = 'Bạn đã hoàn thành đủ 100 ngày điểm danh! 🎉';
        }
        updateCheckinDisplay();
        updateAchievementList();
    }
    const checkinDoBtn = document.getElementById('checkin-do');
    if (checkinDoBtn) checkinDoBtn.addEventListener('click', doCheckin);
    updateCheckinDisplay();

    /* === Achievements === */
    const achievements = [
        { id: 'checkin_1', name: 'Điểm danh đầu tiên', description: 'Thực hiện điểm danh lần đầu.' },
        { id: 'checkin_10', name: '10 ngày liên tiếp', description: 'Hoàn thành 10 ngày điểm danh.' },
        { id: 'checkin_50', name: '50 ngày kiên trì', description: 'Hoàn thành 50 ngày điểm danh.' },
        { id: 'checkin_100', name: '100 ngày vẹn tròn', description: 'Hoàn thành 100 ngày điểm danh.' },
        { id: 'guestbook_first', name: 'Lời nhắn đầu tiên', description: 'Gửi lời nhắn đầu tiên vào sổ lưu bút.' },
        { id: 'memory_first', name: 'Kỷ niệm đầu tiên', description: 'Tải lên một kỷ niệm đầu tiên.' },
        { id: 'winter_mode', name: 'Mùa đông đã tới', description: 'Kích hoạt Winter Mode lần đầu.' }
    ];
    function loadAchievements() {
        try {
            return JSON.parse(localStorage.getItem('achievementsUnlocked')) || [];
        } catch(e) {
            return [];
        }
    }
    function saveAchievements(arr) {
        localStorage.setItem('achievementsUnlocked', JSON.stringify(arr));
    }
    function isAchievementUnlocked(id) {
        const arr = loadAchievements();
        return arr.includes(id);
    }
    function unlockAchievement(id) {
        const arr = loadAchievements();
        if (!arr.includes(id) && achievements.some(a => a.id === id)) {
            arr.push(id);
            saveAchievements(arr);
            updateAchievementList();
        }
    }
    function updateAchievementList() {
        const listEl = document.getElementById('achievement-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        achievements.forEach(a => {
            const li = document.createElement('li');
            li.textContent = `${a.name} - ${a.description}`;
            li.classList.add(isAchievementUnlocked(a.id) ? 'achieved' : 'locked');
            listEl.appendChild(li);
        });
    }
    updateAchievementList();

    /* === Guestbook === */
    function loadGuestbook() {
        try {
            return JSON.parse(localStorage.getItem('guestbook')) || [];
        } catch(e) {
            return [];
        }
    }
    function saveGuestbook(list) {
        localStorage.setItem('guestbook', JSON.stringify(list));
    }
    function renderGuestbook() {
        const container = document.getElementById('guestbook-messages');
        if (!container) return;
        const messages = loadGuestbook();
        container.innerHTML = '';
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.classList.add('guestbook-item');
            div.innerHTML = `<strong>${msg.name}</strong>: ${msg.message}`;
            container.appendChild(div);
        });
    }
    const guestbookForm = document.getElementById('guestbook-form');
    if (guestbookForm) {
        guestbookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('guestbook-name');
            const messageInput = document.getElementById('guestbook-message');
            const name = nameInput.value.trim();
            const message = messageInput.value.trim();
            if (!name || !message) return;
            const list = loadGuestbook();
            list.push({ name, message });
            saveGuestbook(list);
            renderGuestbook();
            guestbookForm.reset();
            unlockAchievement('guestbook_first');
        });
        renderGuestbook();
    }

    /* === Memory Box === */
    function loadMemories() {
        try {
            return JSON.parse(localStorage.getItem('memories')) || [];
        } catch(e) {
            return [];
        }
    }
    function saveMemories(list) {
        localStorage.setItem('memories', JSON.stringify(list));
    }
    function renderMemoryGallery() {
        const gallery = document.getElementById('memory-gallery');
        if (!gallery) return;
        const memories = loadMemories();
        gallery.innerHTML = '';
        memories.forEach(item => {
            let el;
            if (item.type === 'image') {
                el = document.createElement('img');
                el.src = item.data;
            } else if (item.type === 'video') {
                el = document.createElement('video');
                el.src = item.data;
                el.controls = true;
            } else if (item.type === 'audio') {
                el = document.createElement('audio');
                el.src = item.data;
                el.controls = true;
            }
            el.classList.add('memory-item');
            gallery.appendChild(el);
        });
    }
    const memoryUpload = document.getElementById('memory-upload');
    if (memoryUpload) {
        memoryUpload.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            const memories = loadMemories();
            let remaining = files.length;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    let type = 'image';
                    if (file.type.startsWith('video/')) type = 'video';
                    else if (file.type.startsWith('audio/')) type = 'audio';
                    memories.push({ type, data: evt.target.result });
                    remaining -= 1;
                    if (remaining === 0) {
                        saveMemories(memories);
                        renderMemoryGallery();
                        unlockAchievement('memory_first');
                    }
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });
        renderMemoryGallery();
    }
});