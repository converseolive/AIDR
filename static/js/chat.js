/**
 * AIDR Chatbot — Frontend Chat Logic
 * Handles messaging, settings, provider switching, AIDR config, and persona theming.
 */

// ============================================================
// DOM Elements
// ============================================================
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const welcomeScreen = document.getElementById('welcomeScreen');
const providerIndicator = document.getElementById('providerIndicator');
const personaBadge = document.getElementById('personaBadge');
const aidrBadge = document.getElementById('aidrBadge');
const aidrText = document.getElementById('aidrText');

// Sidebar
const chatSidebar = document.getElementById('chatSidebar');
const sidebarContent = document.getElementById('sidebarContent');
const newChatBtn = document.getElementById('newChatBtn');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const mobileSidebarClose = document.getElementById('mobileSidebarClose');
const appWrapper = document.querySelector('.app-wrapper');

// File Upload
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const attachmentPreview = document.getElementById('attachmentPreview');
const attachmentName = document.getElementById('attachmentName');
const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');

// Settings
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsClose = document.getElementById('settingsClose');
const settingsSaveBtn = document.getElementById('settingsSaveBtn');
const providerSelect = document.getElementById('providerSelect');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeyGroup = document.getElementById('apiKeyGroup');
const ollamaUrlGroup = document.getElementById('ollamaUrlGroup');
const ollamaUrlInput = document.getElementById('ollamaUrlInput');
const modelSelect = document.getElementById('modelSelect');
const personaSelect = document.getElementById('personaSelect');
const personaHint = document.getElementById('personaHint');
const refreshModelsBtn = document.getElementById('refreshModelsBtn');
const toggleKeyBtn = document.getElementById('toggleKeyBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const setupHint = document.getElementById('setupHint');

// AIDR Config
const aidrTokenInput = document.getElementById('aidrTokenInput');
const aidrBaseUrlSelect = document.getElementById('aidrBaseUrlSelect');
const aidrConnectBtn = document.getElementById('aidrConnectBtn');
const aidrConnectText = document.getElementById('aidrConnectText');
const aidrConnectStatus = document.getElementById('aidrConnectStatus');
const toggleAidrKeyBtn = document.getElementById('toggleAidrKeyBtn');
const forgetCredentialsBtn = document.getElementById('forgetCredentialsBtn');

// Setup Banner
const setupBanner = document.getElementById('setupBanner');
const setupBannerTitle = document.getElementById('setupBannerTitle');
const setupBannerDesc = document.getElementById('setupBannerDesc');
const setupBannerBtn = document.getElementById('setupBannerBtn');

// AIDR Activity Timeline
const activityBtn = document.getElementById('activityBtn');
const activityPanel = document.getElementById('activityPanel');
const activityOverlay = document.getElementById('activityOverlay');
const activityClose = document.getElementById('activityClose');
const activityList = document.getElementById('activityList');
const activityStats = document.getElementById('activityStats');
const activityCount = document.getElementById('activityCount');

// Red-Team Library
const redteamBtn = document.getElementById('redteamBtn');
const redteamPanel = document.getElementById('redteamPanel');
const redteamOverlay = document.getElementById('redteamOverlay');
const redteamClose = document.getElementById('redteamClose');
const redteamList = document.getElementById('redteamList');

// A/B Compare
const compareBtn = document.getElementById('compareBtn');
const comparePanel = document.getElementById('comparePanel');
const compareOverlay = document.getElementById('compareOverlay');
const compareClose = document.getElementById('compareClose');
const compareGrid = document.getElementById('compareGrid');
const comparePromptEl = document.getElementById('comparePrompt');

// Misc
const exportBtn = document.getElementById('exportBtn');
const chatSearchInput = document.getElementById('chatSearchInput');
const usageIndicator = document.getElementById('usageIndicator');

// ============================================================
// State
// ============================================================
let isWaiting = false;
let selectedFile = null; // Store raw File object
let isAidrEnabled = false;
let isAidrConfigured = false;
let hasApiKey = false;
let activeChatId = null;
let chats = [];

// AIDR activity timeline for the active chat
let activityEvents = [];
// Running token/cost total for the active chat
let sessionUsage = { input_tokens: 0, output_tokens: 0, cost_usd: 0, priced: false };
// Cached red-team library, keyed by persona
let redteamCache = {};
// Sidebar search term
let chatFilter = '';
// Last prompt the user sent, for Regenerate and A/B compare
let lastUserMessage = '';

// ============================================================
// LocalStorage Persistence Keys
// ============================================================
const LS_KEYS = {
    API_KEY: 'aidr_app_api_key',
    AIDR_TOKEN: 'aidr_app_aidr_token',
    AIDR_BASE_URL: 'aidr_app_aidr_base_url',
    PROVIDER: 'aidr_app_provider',
    MODEL: 'aidr_app_model',
    PERSONA: 'aidr_app_persona',
    OLLAMA_URL: 'aidr_app_ollama_url',
};

const PERSONA_HINTS = {
    customer_support: 'Aria — Nimbus support for orders, billing, and troubleshooting.',
    security_qa: 'Sentinel — security analyst for threat and compliance Q&A.',
    banking: 'Penny — Meridian Bank assistant for accounts, cards, and payments.',
    healthcare: 'Ivy — Lakeside Health assistant for appointments and patient services.',
    education: 'Sage — Brightpath Academy tutor for homework and study help.',
};

const PERSONA_BADGES = {
    customer_support: '🎧 Customer Support',
    security_qa: '🛡️ Security Q&A',
    banking: '🏦 Banking Assistant',
    healthcare: '🩺 Healthcare Assistant',
    education: '🎓 Education Assistant',
};

const PROVIDER_NAMES = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Google Gemini',
    ollama: 'Ollama',
};

const WELCOME_CARDS = {
    customer_support: [
        { icon: '💬', text: 'Help me with my order', prompt: 'I need help tracking my recent order. Can you assist me?' },
        { icon: '🔄', text: 'Return or exchange', prompt: 'How do I initiate a return or exchange for a product?' },
        { icon: '💳', text: 'Billing questions', prompt: 'I have a question about a charge on my account. Can you help?' },
        { icon: '📦', text: 'Product information', prompt: 'Can you tell me more about the features and specifications of your products?' },
    ],
    security_qa: [
        { icon: '🔒', text: 'Latest security threats', prompt: 'What are the latest cybersecurity threats I should be aware of?' },
        { icon: '🛡️', text: 'Improve security posture', prompt: 'How can I improve my organization\'s security posture?' },
        { icon: '🚨', text: 'Incident response', prompt: 'Can you help me understand incident response procedures?' },
        { icon: '📋', text: 'Compliance frameworks', prompt: 'What compliance frameworks should my business follow?' },
    ],
    banking: [
        { icon: '💳', text: 'Report a lost card', prompt: 'I think I lost my debit card. What should I do right now?' },
        { icon: '🏠', text: 'Mortgage basics', prompt: 'Can you explain how a fixed-rate mortgage works?' },
        { icon: '💸', text: 'Set up a transfer', prompt: 'How do I set up a recurring transfer to my savings account?' },
        { icon: '🔔', text: 'Spot a scam', prompt: 'How can I tell if a text message claiming to be from my bank is a phishing scam?' },
    ],
    healthcare: [
        { icon: '📅', text: 'Prepare for a visit', prompt: 'How should I prepare for my upcoming appointment?' },
        { icon: '💊', text: 'Prescription refills', prompt: 'How does the prescription refill process work?' },
        { icon: '🧾', text: 'Insurance terms', prompt: 'What is the difference between a deductible and a copay?' },
        { icon: '🌿', text: 'Wellness tips', prompt: 'What are some everyday habits that support good health?' },
    ],
    education: [
        { icon: '🔬', text: 'Explain a concept', prompt: 'Can you explain how photosynthesis works?' },
        { icon: '📆', text: 'Build a study plan', prompt: 'Can you help me build a study plan for my upcoming exams?' },
        { icon: '📝', text: 'Practice questions', prompt: 'Can you quiz me with some practice questions on algebra?' },
        { icon: '✍️', text: 'Essay feedback', prompt: 'Can you give me feedback on my essay outline?' },
    ],
};

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        document.body.classList.add('light-mode');
    }
    updateThemeIcons();
    
    await loadSettings();
    await restoreSavedCredentials();
    checkAidrStatus();
    loadChatList();
    setupEventListeners();
    autoResizeTextarea();
});

function setupEventListeners() {
    // Send message
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Enable/disable send button based on input
    chatInput.addEventListener('input', () => {
        sendBtn.disabled = (!chatInput.value.trim() && !selectedFile) || isWaiting;
        autoResizeTextarea();
    });

    // File Upload
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);
    
    removeAttachmentBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
        sendBtn.disabled = !chatInput.value.trim() || isWaiting;
    });

    // Settings panel
    settingsBtn.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', closeSettings);
    settingsSaveBtn.addEventListener('click', saveSettings);

    // Provider change
    providerSelect.addEventListener('change', onProviderChange);

    // Persona change (in settings)
    personaSelect.addEventListener('change', () => {
        const key = personaSelect.value;
        personaHint.textContent = PERSONA_HINTS[key] || '';
    });

    // Toggle API key visibility
    toggleKeyBtn.addEventListener('click', () => {
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
    });

    // Toggle AIDR token visibility
    if (toggleAidrKeyBtn) {
        toggleAidrKeyBtn.addEventListener('click', () => {
            const isPassword = aidrTokenInput.type === 'password';
            aidrTokenInput.type = isPassword ? 'text' : 'password';
        });
    }

    // AIDR Connect
    if (aidrConnectBtn) {
        aidrConnectBtn.addEventListener('click', connectAidr);
    }

    // Forget Saved Credentials
    if (forgetCredentialsBtn) {
        forgetCredentialsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all saved API keys and tokens from this browser?')) {
                forgetSavedCredentials();
            }
        });
    }

    // Refresh models
    refreshModelsBtn.addEventListener('click', fetchModels);

    // Re-fetch models when the Ollama server URL changes
    ollamaUrlInput.addEventListener('change', () => {
        if (providerSelect.value === 'ollama') {
            fetchModels();
        }
    });

    // Clear chat
    clearChatBtn.addEventListener('click', clearChat);

    // Welcome card clicks
    document.querySelectorAll('.welcome-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            if (prompt) {
                chatInput.value = prompt;
                sendBtn.disabled = false;
                chatInput.focus();
            }
        });
    });

    // Setup hint click
    if (setupHint) {
        setupHint.addEventListener('click', openSettings);
    }

    // Setup banner button
    if (setupBannerBtn) {
        setupBannerBtn.addEventListener('click', openSettings);
    }

    // Toggle AIDR
    if (aidrBadge) {
        aidrBadge.addEventListener('click', () => {
            const aidrIndicator = document.getElementById('aidrIndicator');
            const aidrIndicatorText = document.getElementById('aidrIndicatorText');

            if (!isAidrEnabled) {
                // Trying to ENABLE — check if AIDR is configured
                if (!isAidrConfigured) {
                    // Show error toast
                    showAidrError('Please configure your AIDR Collector Token in Settings before enabling AIDR protection.');
                    openSettings();
                    return;
                }
                isAidrEnabled = true;
                aidrBadge.classList.remove('aidr-disabled');
                aidrBadge.setAttribute('aria-pressed', 'true');
                if (aidrText) aidrText.textContent = 'AIDR Protected';
                if (aidrIndicator) aidrIndicator.classList.remove('aidr-off');
                if (aidrIndicatorText) aidrIndicatorText.textContent = 'AIDR Active';
            } else {
                // Disabling
                isAidrEnabled = false;
                aidrBadge.classList.add('aidr-disabled');
                aidrBadge.setAttribute('aria-pressed', 'false');
                if (aidrText) aidrText.textContent = 'AIDR Disabled';
                if (aidrIndicator) aidrIndicator.classList.add('aidr-off');
                if (aidrIndicatorText) aidrIndicatorText.textContent = 'AIDR Inactive';
            }
        });
    }

    // Sidebar Toggles
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            appWrapper.classList.toggle('sidebar-collapsed');
            appWrapper.classList.toggle('mobile-sidebar-open');
        });
    }
    
    if (mobileSidebarClose) {
        mobileSidebarClose.addEventListener('click', () => {
            appWrapper.classList.remove('mobile-sidebar-open');
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
    }

    // Setup hint click
    if (setupHint) {
        setupHint.addEventListener('click', openSettings);
    }

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // AIDR activity timeline
    if (activityBtn) activityBtn.addEventListener('click', () => toggleDrawer('activity'));
    if (activityClose) activityClose.addEventListener('click', () => closeDrawer('activity'));
    if (activityOverlay) activityOverlay.addEventListener('click', () => closeDrawer('activity'));

    // Red-team library
    if (redteamBtn) redteamBtn.addEventListener('click', () => toggleDrawer('redteam'));
    if (redteamClose) redteamClose.addEventListener('click', () => closeDrawer('redteam'));
    if (redteamOverlay) redteamOverlay.addEventListener('click', () => closeDrawer('redteam'));

    // A/B compare
    if (compareBtn) compareBtn.addEventListener('click', runCompare);
    if (compareClose) compareClose.addEventListener('click', () => closeDrawer('compare'));
    if (compareOverlay) compareOverlay.addEventListener('click', () => closeDrawer('compare'));

    // Export transcript
    if (exportBtn) exportBtn.addEventListener('click', exportTranscript);

    // Sidebar search
    if (chatSearchInput) {
        chatSearchInput.addEventListener('input', () => {
            chatFilter = chatSearchInput.value.trim().toLowerCase();
            renderChatList();
        });
    }

    // Escape closes whatever is open, innermost first
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (comparePanel && comparePanel.classList.contains('active')) return closeDrawer('compare');
        if (settingsPanel && settingsPanel.classList.contains('active')) return closeSettings();
        if (redteamPanel && redteamPanel.classList.contains('active')) return closeDrawer('redteam');
        if (activityPanel && activityPanel.classList.contains('active')) return closeDrawer('activity');
    });

    // Keep focus inside open dialogs (Tab / Shift+Tab)
    [settingsPanel, activityPanel, redteamPanel, comparePanel].forEach(panel => {
        if (panel) panel.addEventListener('keydown', (e) => trapFocus(e, panel));
    });
}

// ============================================================
// Focus management
// ============================================================
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let lastFocusedBeforeDialog = null;

function trapFocus(e, container) {
    if (e.key !== 'Tab') return;
    const items = Array.from(container.querySelectorAll(FOCUSABLE))
        .filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

function focusFirstIn(container) {
    const target = container.querySelector(FOCUSABLE);
    if (target) target.focus();
}

function restoreFocus() {
    if (lastFocusedBeforeDialog && document.body.contains(lastFocusedBeforeDialog)) {
        lastFocusedBeforeDialog.focus();
    }
    lastFocusedBeforeDialog = null;
}

// ============================================================
// Theme Toggle Logic
// ============================================================
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');
    
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
    
    updateThemeIcons();
}

function updateThemeIcons() {
    const moonIcon = document.querySelector('.icon-moon');
    const sunIcon = document.querySelector('.icon-sun');
    
    if (document.body.classList.contains('light-mode')) {
        if (moonIcon) moonIcon.classList.remove('hidden');
        if (sunIcon) sunIcon.classList.add('hidden');
    } else {
        if (moonIcon) moonIcon.classList.add('hidden');
        if (sunIcon) sunIcon.classList.remove('hidden');
    }
}

// ============================================================
// AIDR Error Toast
// ============================================================
function showAidrError(message) {
    // Remove any existing toast
    const existing = document.querySelector('.aidr-error-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'aidr-error-toast';
    toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

// ============================================================
// Settings
// ============================================================
async function checkAidrStatus() {
    try {
        const resp = await fetch('/api/aidr-status');
        const data = await resp.json();
        isAidrConfigured = data.configured;
        updateSetupBanner();
    } catch (e) {
        console.warn('Could not check AIDR status:', e);
    }
}

async function connectAidr() {
    const token = aidrTokenInput.value.trim();
    const baseUrl = aidrBaseUrlSelect.value;

    if (!token) {
        aidrConnectStatus.textContent = 'Please enter your AIDR token.';
        aidrConnectStatus.className = 'aidr-connect-status error';
        return;
    }

    // Show connecting state
    aidrConnectBtn.classList.add('connecting');
    aidrConnectText.textContent = 'Connecting...';
    aidrConnectStatus.textContent = '';
    aidrConnectStatus.className = 'aidr-connect-status';

    try {
        const resp = await fetch('/api/aidr-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, base_url: baseUrl }),
        });
        const data = await resp.json();

        if (resp.ok && data.configured) {
            isAidrConfigured = true;
            aidrConnectBtn.classList.remove('connecting');
            aidrConnectBtn.classList.add('connected');
            aidrConnectText.textContent = '✓ Connected';
            aidrConnectStatus.textContent = 'AIDR is active and protecting your conversations.';
            aidrConnectStatus.className = 'aidr-connect-status success';

            // Persist AIDR credentials to localStorage
            localStorage.setItem(LS_KEYS.AIDR_TOKEN, token);
            if (baseUrl) {
                localStorage.setItem(LS_KEYS.AIDR_BASE_URL, baseUrl);
            }

            // Update header badge
            aidrBadge.classList.remove('aidr-disabled');
            aidrBadge.setAttribute('aria-pressed', 'true');
            if (aidrText) aidrText.textContent = 'AIDR Protected';
            isAidrEnabled = true;

            updateSetupBanner();
        } else {
            aidrConnectBtn.classList.remove('connecting');
            aidrConnectText.textContent = 'Connect AIDR';
            aidrConnectStatus.textContent = data.error || 'Failed to connect.';
            aidrConnectStatus.className = 'aidr-connect-status error';
        }
    } catch (e) {
        aidrConnectBtn.classList.remove('connecting');
        aidrConnectText.textContent = 'Connect AIDR';
        aidrConnectStatus.textContent = 'Network error. Please check the server.';
        aidrConnectStatus.className = 'aidr-connect-status error';
    }
}

function updateSetupBanner() {
    if (!setupBanner) return;

    const provider = providerSelect ? providerSelect.value : 'openai';
    const needsApiKey = provider !== 'ollama' && !hasApiKey;
    const needsAidr = !isAidrConfigured;

    if (!needsApiKey && !needsAidr) {
        // Everything is configured — hide the banner
        setupBanner.classList.add('hidden');
        return;
    }

    // Build the description based on what's missing
    const missing = [];
    if (needsAidr) missing.push('AIDR token');
    if (needsApiKey) missing.push('AI provider API key');

    setupBanner.classList.remove('hidden');
    setupBannerTitle.textContent = 'Setup Required';
    setupBannerDesc.textContent = `${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} not configured.`;
}

// ============================================================
// Settings
// ============================================================
function openSettings() {
    lastFocusedBeforeDialog = document.activeElement;
    settingsPanel.classList.add('active');
    settingsOverlay.classList.add('active');
    settingsPanel.setAttribute('aria-hidden', 'false');
    focusFirstIn(settingsPanel);
}

function closeSettings() {
    settingsPanel.classList.remove('active');
    settingsOverlay.classList.remove('active');
    settingsPanel.setAttribute('aria-hidden', 'true');
    restoreFocus();
}

async function loadSettings() {
    try {
        const resp = await fetch('/api/settings');
        const data = await resp.json();

        providerSelect.value = data.provider || 'openai';
        personaSelect.value = data.persona || 'customer_support';
        ollamaUrlInput.value = data.ollama_url || 'http://localhost:11434';
        hasApiKey = data.has_api_key || false;

        // Update UI based on provider
        onProviderChange();
        updateFooterIndicator(data.provider, data.model);
        updatePersonaBadge(data.persona);
        applyPersonaTheme(data.persona || 'customer_support');

        // Set model after fetching model list
        await fetchModels();
        if (data.model) {
            modelSelect.value = data.model;
        }

        // Persona hint
        personaHint.textContent = PERSONA_HINTS[data.persona] || '';

        // Update banner
        updateSetupBanner();
    } catch (e) {
        console.warn('Could not load settings:', e);
    }
}

async function saveSettings() {
    const settings = {
        provider: providerSelect.value,
        model: modelSelect.value,
        persona: personaSelect.value,
        ollama_url: ollamaUrlInput.value,
    };

    // Only send api_key if the user actually entered a new one.
    // The field is intentionally left blank on load (password field),
    // so sending an empty value would overwrite the saved key.
    if (apiKeyInput.value.trim()) {
        settings.api_key = apiKeyInput.value.trim();
    }

    try {
        const resp = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });

        if (resp.ok) {
            // Track API key state
            if (apiKeyInput.value.trim()) {
                hasApiKey = true;
            }

            // Persist to localStorage
            localStorage.setItem(LS_KEYS.PROVIDER, settings.provider);
            localStorage.setItem(LS_KEYS.MODEL, settings.model);
            localStorage.setItem(LS_KEYS.PERSONA, settings.persona);
            localStorage.setItem(LS_KEYS.OLLAMA_URL, settings.ollama_url);
            if (settings.api_key) {
                localStorage.setItem(LS_KEYS.API_KEY, settings.api_key);
            }

            // Visual feedback
            settingsSaveBtn.classList.add('saved');
            settingsSaveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Saved!
            `;

            setTimeout(() => {
                settingsSaveBtn.classList.remove('saved');
                settingsSaveBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Save Settings
                `;
                closeSettings();
            }, 1200);

            // Update footer and badge
            updateFooterIndicator(settings.provider, settings.model);
            updatePersonaBadge(settings.persona);
            applyPersonaTheme(settings.persona);

            // Update setup banner
            updateSetupBanner();

            // Reset welcome screen if visible
            if (welcomeScreen && welcomeScreen.parentNode) {
                // Chat was cleared — keep welcome screen
            }
        }
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

function onProviderChange() {
    const provider = providerSelect.value;

    // Show/hide API key group (not needed for Ollama)
    if (provider === 'ollama') {
        apiKeyGroup.classList.add('hidden');
        ollamaUrlGroup.classList.remove('hidden');
    } else {
        apiKeyGroup.classList.remove('hidden');
        ollamaUrlGroup.classList.add('hidden');
    }

    // Fetch models for the selected provider
    fetchModels();
}

async function fetchModels() {
    const provider = providerSelect.value;
    refreshModelsBtn.classList.add('spinning');

    try {
        let url = `/api/models?provider=${provider}`;
        if (provider === 'ollama' && ollamaUrlInput.value.trim()) {
            url += `&ollama_url=${encodeURIComponent(ollamaUrlInput.value.trim())}`;
        }
        const resp = await fetch(url);
        const data = await resp.json();

        modelSelect.innerHTML = '';
        const models = data.models || [];

        if (data.error) {
            console.warn('Could not fetch models:', data.error);
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = provider === 'ollama' ? '⚠ Cannot reach Ollama server' : '⚠ Could not fetch models';
            opt.disabled = true;
            modelSelect.appendChild(opt);
        } else if (models.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No models available';
            modelSelect.appendChild(opt);
        } else {
            models.forEach(model => {
                const opt = document.createElement('option');
                opt.value = model;
                opt.textContent = model;
                modelSelect.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn('Could not fetch models:', e);
    } finally {
        refreshModelsBtn.classList.remove('spinning');
    }
}

function updateFooterIndicator(provider, model) {
    const providerName = PROVIDER_NAMES[provider] || provider;
    providerIndicator.textContent = `${providerName} · ${model || 'not set'}`;
}

function updatePersonaBadge(persona) {
    personaBadge.textContent = PERSONA_BADGES[persona] || persona;
}

// ============================================================
// Persona Theming
// ============================================================
function applyPersonaTheme(persona) {
    document.body.dataset.persona = persona;
    updateWelcomeCards(persona);
}

function updateWelcomeCards(persona) {
    const cardsContainer = document.getElementById('welcomeCards');
    if (!cardsContainer) return;

    const cards = WELCOME_CARDS[persona] || WELCOME_CARDS['security_qa'];

    cardsContainer.innerHTML = '';
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'welcome-card';
        cardEl.dataset.prompt = card.prompt;
        cardEl.innerHTML = `
            <span class="card-icon">${card.icon}</span>
            <span>${card.text}</span>
        `;
        cardEl.addEventListener('click', () => {
            chatInput.value = card.prompt;
            sendBtn.disabled = false;
            chatInput.focus();
        });
        cardsContainer.appendChild(cardEl);
    });
}

// ============================================================
// Chat Messages
// ============================================================
/**
 * Send a chat turn. Pass `overrideText` to resend a prompt (Regenerate,
 * red-team library) without touching the composer.
 */
function sendMessage(overrideText) {
    const message = typeof overrideText === 'string'
        ? overrideText.trim()
        : chatInput.value.trim();
    if ((!message && !selectedFile) || isWaiting) return;

    lastUserMessage = message;

    // Hide welcome screen dynamically
    const currentWelcomeScreen = document.getElementById('welcomeScreen');
    if (currentWelcomeScreen && currentWelcomeScreen.parentNode) {
        currentWelcomeScreen.remove();
    }

    // Add user message to UI
    appendMessage('user', message, selectedFile);

    // Capture file before clearing input
    const fileDataToSend = selectedFile;
    
    // Disable inputs
    isWaiting = true;
    showTyping();

    // If no file is attached, clear the input UI immediately
    if (!fileDataToSend) {
        chatInput.value = '';
        sendBtn.disabled = true;
        autoResizeTextarea();
    } else {
        // If file is attached, hide remove button but KEEP preview visible for progress
        removeAttachmentBtn.classList.add('hidden');
        const progressFill = document.getElementById('uploadProgressFill');
        const progressText = document.getElementById('uploadProgressText');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/chat', true);
    // Let the browser set Content-Type to multipart/form-data with boundary automatically

    // Track upload progress
    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && fileDataToSend) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            
            const progressContainer = document.getElementById('uploadProgressContainer');
            const progressFill = document.getElementById('uploadProgressFill');
            const progressText = document.getElementById('uploadProgressText');
            
            if (progressContainer) progressContainer.classList.remove('hidden');
            if (progressFill) progressFill.style.width = percentComplete + '%';
            if (progressText) progressText.textContent = percentComplete + '%';
            
            if (percentComplete >= 100 && progressText) {
                progressText.textContent = 'Processing...';
            }
        }
    };

    xhr.onload = () => {
        hideTyping();
        
        // Clear UI now that request is done
        chatInput.value = '';
        selectedFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
        removeAttachmentBtn.classList.remove('hidden');
        
        const progressContainer = document.getElementById('uploadProgressContainer');
        if (progressContainer) progressContainer.classList.add('hidden');
        
        sendBtn.disabled = true;
        autoResizeTextarea();
        isWaiting = false;
        chatInput.focus();

        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const data = JSON.parse(xhr.responseText);
                
                // Update active chat ID if server created one
                if (data.chat_id && !activeChatId) {
                    activeChatId = data.chat_id;
                    // Refresh list to show new chat
                    loadChatList();
                } else if (data.chat_title || data.aidr_triggered) {
                    // Refresh list if title was auto-generated or AIDR triggered
                    loadChatList();
                }

                // Feed the AIDR activity timeline and the usage counter
                ingestAidrEvents(data.aidr_events);
                addUsage(data.usage);

                if (data.blocked) {
                    appendBlockedMessage(data.message, data.block_type, data.aidr);
                } else {
                    // Redaction happens on the request side, so surface the
                    // input verdict as its own notice above the reply.
                    const inputNotice = buildRedactionNotice(data.aidr_input);
                    if (inputNotice) chatMessages.appendChild(inputNotice);
                    appendMessage('assistant', data.response, null, {
                        aidr: data.aidr_output,
                        usage: data.usage,
                    });
                }
            } catch(e) {
                console.error('Failed to render chat response:', e);
                appendError('Error parsing server response.');
            }
        } else {
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.needs_setup) {
                    appendError(data.error);
                    setTimeout(openSettings, 800);
                } else {
                    appendError(data.error || 'Something went wrong.');
                }
            } catch (e) {
                appendError('Error ' + xhr.status + ': Failed to process response.');
            }
        }
    };

    xhr.onerror = () => {
        hideTyping();
        appendError('Network error. Please check the server is running.');
        console.error('Chat error: Network request failed');
        
        isWaiting = false;
        sendBtn.disabled = (!chatInput.value.trim() && !selectedFile);
        removeAttachmentBtn.classList.remove('hidden');
        
        const progressContainer = document.getElementById('uploadProgressContainer');
        if (progressContainer) progressContainer.classList.add('hidden');
    };

    const formData = new FormData();
    formData.append('message', message);
    formData.append('aidr_enabled', isAidrEnabled);
    if (activeChatId) {
        formData.append('chat_id', activeChatId);
    }
    if (fileDataToSend) {
        formData.append('file', fileDataToSend);
    }
    xhr.send(formData);
}

// ============================================================
// File Handling
// ============================================================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
        appendError("Upload Failed: File must be under 5MB.");
        fileInput.value = '';
        return;
    }

    // Check if text-based file
    const validExtensions = ['.txt', '.csv', '.json', '.md', '.log', '.xml', '.py', '.js', '.html', '.css'];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || file.type.startsWith('text/');
    if (!isValid) {
        appendError("Upload Failed: Only text-based files (txt, csv, json, md, etc.) are supported right now.");
        fileInput.value = '';
        return;
    }

    selectedFile = file; // Store raw File object
    attachmentName.textContent = file.name;
    attachmentPreview.classList.remove('hidden');
    sendBtn.disabled = false;
    chatInput.focus();
}

function getFallbackMimeType(filename) {
    const format = filename.split('.').pop().toLowerCase();
    switch (format) {
        case 'png': return 'image/png';
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'pdf': return 'application/pdf';
        case 'txt': return 'text/plain';
        case 'csv': return 'text/csv';
        case 'json': return 'application/json';
        default: return 'application/octet-stream';
    }
}

/**
 * Render one chat message.
 * `meta` carries the AIDR verdict for this turn and any token usage, both of
 * which are rendered beneath the message body.
 */
function appendMessage(role, content, attachment = null, meta = {}) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';

    if (role === 'user') {
        avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    } else {
        avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    
    if (attachment) {
        const attachHtml = `
            <div class="chat-attachment-card">
                <div class="chat-attachment-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <div class="chat-attachment-details">
                    <span class="chat-attachment-name">${escapeHtml(attachment.name)}</span>
                    <span class="chat-attachment-type">Document Upload</span>
                </div>
            </div>
        `;
        contentEl.innerHTML += attachHtml;
    }
    
    if (content) {
        const textWrapper = document.createElement('div');
        textWrapper.className = 'message-text';
        textWrapper.innerHTML = formatMessage(content);
        enhanceCodeBlocks(textWrapper);
        contentEl.appendChild(textWrapper);
    }

    // AIDR verdict for this turn (detectors, redactions, guard latency)
    const verdict = buildVerdictPanel(meta.aidr);
    if (verdict) contentEl.appendChild(verdict);

    // Per-message actions: copy, plus regenerate / edit for the last user turn
    contentEl.appendChild(buildMessageActions(role, content, meta));

    messageEl.appendChild(avatar);
    messageEl.appendChild(contentEl);
    chatMessages.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
}

/**
 * Copy / regenerate / edit controls beneath a message.
 */
function buildMessageActions(role, content, meta = {}) {
    const bar = document.createElement('div');
    bar.className = 'message-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'msg-action-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', 'Copy this message');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(content || '');
            copyBtn.textContent = 'Copied';
        } catch (e) {
            copyBtn.textContent = 'Copy failed';
        }
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
    });
    bar.appendChild(copyBtn);

    if (role === 'user') {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'msg-action-btn';
        editBtn.textContent = 'Edit & resend';
        editBtn.setAttribute('aria-label', 'Edit this message and send it again');
        editBtn.addEventListener('click', () => {
            chatInput.value = content || '';
            sendBtn.disabled = !chatInput.value.trim();
            autoResizeTextarea();
            chatInput.focus();
        });
        bar.appendChild(editBtn);
    }

    if (role === 'assistant') {
        const regenBtn = document.createElement('button');
        regenBtn.type = 'button';
        regenBtn.className = 'msg-action-btn';
        regenBtn.textContent = 'Regenerate';
        regenBtn.setAttribute('aria-label', 'Send the previous prompt again');
        regenBtn.addEventListener('click', () => {
            const prompt = lastUserMessage || findPreviousUserMessage(regenBtn);
            if (!prompt) {
                showAidrError('Nothing to regenerate — no earlier prompt found.');
                return;
            }
            sendMessage(prompt);
        });
        bar.appendChild(regenBtn);

        if (meta.usage && (meta.usage.input_tokens || meta.usage.output_tokens)) {
            const badge = document.createElement('span');
            badge.className = 'msg-usage';
            badge.textContent = formatUsage(meta.usage);
            bar.appendChild(badge);
        }
    }

    return bar;
}

/** Walk backwards from an element to the nearest preceding user message text. */
function findPreviousUserMessage(el) {
    let node = el.closest('.message');
    while (node) {
        node = node.previousElementSibling;
        if (node && node.classList.contains('user')) {
            const text = node.querySelector('.message-text');
            return text ? text.textContent.trim() : '';
        }
    }
    return '';
}

function appendBlockedMessage(message, blockType, aidr = null) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message assistant blocked';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    const headerHTML = `
        <div class="blocked-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            AIDR Security — ${blockType === 'input' ? 'Input Blocked' : 'Output Blocked'}
        </div>
    `;

    contentEl.innerHTML = headerHTML + `<p>${escapeHtml(message)}</p>`;

    // Expand the verdict by default on a block — this is the reason the
    // message never made it through, so it shouldn't need a click to see.
    const verdict = buildVerdictPanel(aidr, { open: true });
    if (verdict) contentEl.appendChild(verdict);

    messageEl.appendChild(avatar);
    messageEl.appendChild(contentEl);
    chatMessages.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
}

function appendError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    chatMessages.appendChild(errorEl);
    scrollToBottom();
}

// ============================================================
// Message Formatting (markdown)
//
// Everything is HTML-escaped before any markup is generated, so model output
// can never inject tags. Code spans and fences are lifted out first so their
// contents are never treated as markdown.
// ============================================================
function escapeHtml(text) {
    return String(text === null || text === undefined ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderInline(s) {
    return s
        // [label](https://…) — http(s) only
        .replace(
            /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        )
        .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>')
        .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
        .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?![*\w])/g, '$1<em>$2</em>')
        .replace(/(^|[^_\w])_(?=\S)([^_\n]*?\S)_(?![_\w])/g, '$1<em>$2</em>');
}

function formatMessage(src) {
    if (!src) return '';

    let text = String(src).replace(/\r\n/g, '\n');

    // 1. Lift fenced code blocks out before anything else sees them.
    const fences = [];
    text = text.replace(/```([\w+#.-]*)[ \t]*\n?([\s\S]*?)```/g, (_, lang, code) => {
        fences.push({ lang: lang || '', code: code.replace(/\n+$/, '') });
        return `\u0000F${fences.length - 1}\u0000`;
    });

    // 2. Lift inline code spans.
    const spans = [];
    text = text.replace(/`([^`\n]+)`/g, (_, code) => {
        spans.push(code);
        return `\u0000S${spans.length - 1}\u0000`;
    });

    text = escapeHtml(text);

    // 3. Block-level pass.
    const lines = text.split('\n');
    const out = [];
    let paragraph = [];
    const openLists = []; // stack of 'ul' | 'ol'

    const flushParagraph = () => {
        if (paragraph.length) {
            out.push(`<p>${renderInline(paragraph.join('<br>'))}</p>`);
            paragraph = [];
        }
    };
    const closeLists = (depth = 0) => {
        while (openLists.length > depth) out.push(`</${openLists.pop()}>`);
    };

    const isFencePlaceholder = (l) => /^\u0000F\d+\u0000$/.test(l.trim());

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Blank line — ends a paragraph (but not necessarily a list)
        if (!trimmed) {
            flushParagraph();
            continue;
        }

        // Code fence placeholder — emit on its own
        if (isFencePlaceholder(line)) {
            flushParagraph();
            closeLists();
            out.push(trimmed);
            continue;
        }

        // Horizontal rule
        if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(trimmed)) {
            flushParagraph();
            closeLists();
            out.push('<hr>');
            continue;
        }

        // Heading
        const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            flushParagraph();
            closeLists();
            const level = Math.min(heading[1].length + 2, 6); // h1 → h3 in-bubble
            out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
            continue;
        }

        // Blockquote
        if (/^&gt;\s?/.test(trimmed)) {
            flushParagraph();
            closeLists();
            out.push(`<blockquote>${renderInline(trimmed.replace(/^&gt;\s?/, ''))}</blockquote>`);
            continue;
        }

        // Table: a pipe row followed by a |---|---| separator
        if (
            trimmed.includes('|') &&
            i + 1 < lines.length &&
            /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[i + 1]) &&
            lines[i + 1].includes('-')
        ) {
            flushParagraph();
            closeLists();
            const cells = (row) =>
                row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
            const headers = cells(trimmed);
            const body = [];
            i += 2;
            while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
                body.push(cells(lines[i]));
                i++;
            }
            i--; // step back; the for-loop increments
            let table = '<div class="md-table-wrap"><table><thead><tr>';
            table += headers.map(h => `<th>${renderInline(h)}</th>`).join('');
            table += '</tr></thead><tbody>';
            body.forEach(row => {
                table += '<tr>' + headers
                    .map((_, ci) => `<td>${renderInline(row[ci] || '')}</td>`)
                    .join('') + '</tr>';
            });
            out.push(table + '</tbody></table></div>');
            continue;
        }

        // List item (supports one level of nesting via indentation)
        const listItem = line.match(/^(\s*)(?:([-*+•])|(\d+)[.)])\s+(.*)$/);
        if (listItem) {
            flushParagraph();
            const indent = listItem[1].replace(/\t/g, '  ').length;
            const type = listItem[2] ? 'ul' : 'ol';
            const depth = Math.min(Math.floor(indent / 2) + 1, 3);

            closeLists(depth);
            while (openLists.length < depth) {
                out.push(`<${type}>`);
                openLists.push(type);
            }
            // Same depth but the marker type changed — swap the list
            if (openLists[openLists.length - 1] !== type) {
                out.push(`</${openLists.pop()}>`);
                out.push(`<${type}>`);
                openLists.push(type);
            }
            out.push(`<li>${renderInline(listItem[4])}</li>`);
            continue;
        }

        closeLists();
        paragraph.push(trimmed);
    }
    flushParagraph();
    closeLists();

    let html = out.join('\n');

    // 4. Restore inline code, then fenced blocks.
    html = html.replace(/\u0000S(\d+)\u0000/g, (_, n) => `<code>${escapeHtml(spans[+n])}</code>`);
    html = html.replace(/\u0000F(\d+)\u0000/g, (_, n) => {
        const { lang, code } = fences[+n];
        const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : '';
        return (
            '<div class="code-block">' +
            `<div class="code-block-head">${label}` +
            '<button type="button" class="code-copy-btn" aria-label="Copy code">Copy</button>' +
            '</div>' +
            `<pre><code>${escapeHtml(code)}</code></pre>` +
            '</div>'
        );
    });

    return html;
}

/**
 * Wire up copy buttons on any code blocks inside a rendered message.
 */
function enhanceCodeBlocks(container) {
    container.querySelectorAll('.code-copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const code = btn.closest('.code-block')?.querySelector('code');
            if (!code) return;
            try {
                await navigator.clipboard.writeText(code.textContent);
                btn.textContent = 'Copied';
            } catch (e) {
                btn.textContent = 'Copy failed';
            }
            setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
        });
    });
}

// ============================================================
// Typing Indicator
// ============================================================
function showTyping() {
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.classList.add('hidden');
}

// ============================================================
// Clear Chat
// ============================================================
async function clearChat() {
    createNewChat();
}

// ============================================================
// Helpers
// ============================================================
function scrollToBottom() {
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function autoResizeTextarea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
}

// ============================================================
// Credential Persistence (localStorage)
// ============================================================

/**
 * Restore saved credentials from localStorage on page load.
 * Silently re-submits API key and AIDR token to the backend
 * so the server-side session is re-hydrated.
 */
async function restoreSavedCredentials() {
    const savedProvider = localStorage.getItem(LS_KEYS.PROVIDER);
    const savedModel = localStorage.getItem(LS_KEYS.MODEL);
    const savedPersona = localStorage.getItem(LS_KEYS.PERSONA);
    const savedOllamaUrl = localStorage.getItem(LS_KEYS.OLLAMA_URL);
    const savedApiKey = localStorage.getItem(LS_KEYS.API_KEY);
    const savedAidrToken = localStorage.getItem(LS_KEYS.AIDR_TOKEN);
    const savedAidrBaseUrl = localStorage.getItem(LS_KEYS.AIDR_BASE_URL);

    // Restore form field values (Ollama URL first, so onProviderChange()
    // fetches models against the saved server rather than an empty field)
    if (savedOllamaUrl && ollamaUrlInput) {
        ollamaUrlInput.value = savedOllamaUrl;
    }
    if (savedProvider && providerSelect) {
        providerSelect.value = savedProvider;
        onProviderChange();
    }
    if (savedPersona && personaSelect) {
        personaSelect.value = savedPersona;
        personaHint.textContent = PERSONA_HINTS[savedPersona] || '';
        updatePersonaBadge(savedPersona);
        applyPersonaTheme(savedPersona);
    }
    if (savedAidrBaseUrl && aidrBaseUrlSelect) {
        aidrBaseUrlSelect.value = savedAidrBaseUrl;
    }

    // Re-submit saved settings to the server session. Ollama has no API key,
    // so its URL must be restored to the session even without one.
    const isOllamaRestore = savedProvider === 'ollama' && savedOllamaUrl;
    if (savedApiKey || isOllamaRestore) {
        try {
            const settings = {
                provider: savedProvider || providerSelect.value,
                model: savedModel || modelSelect.value,
                persona: savedPersona || personaSelect.value,
                ollama_url: savedOllamaUrl || ollamaUrlInput.value,
            };
            if (savedApiKey) {
                settings.api_key = savedApiKey;
            }
            const resp = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (resp.ok) {
                if (savedApiKey) {
                    hasApiKey = true;
                }
                updateFooterIndicator(settings.provider, settings.model);
                updatePersonaBadge(settings.persona);
                console.log('[Credentials] ✅ Settings restored from saved data.');
            }
        } catch (e) {
            console.warn('[Credentials] Could not restore settings:', e);
        }
    }

    // Restore model selection after fetching models
    if (savedModel) {
        await fetchModels();
        modelSelect.value = savedModel;
        updateFooterIndicator(
            savedProvider || providerSelect.value,
            savedModel
        );
    }

    // Re-connect AIDR if we have a saved token
    if (savedAidrToken) {
        try {
            const resp = await fetch('/api/aidr-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: savedAidrToken,
                    base_url: savedAidrBaseUrl || '',
                }),
            });
            const data = await resp.json();
            if (resp.ok && data.configured) {
                isAidrConfigured = true;
                if (aidrConnectBtn) {
                    aidrConnectBtn.classList.add('connected');
                    aidrConnectText.textContent = '✓ Connected';
                }
                if (aidrConnectStatus) {
                    aidrConnectStatus.textContent = 'AIDR restored from saved credentials.';
                    aidrConnectStatus.className = 'aidr-connect-status success';
                }
                aidrBadge.classList.remove('aidr-disabled');
                aidrBadge.setAttribute('aria-pressed', 'true');
                if (aidrText) aidrText.textContent = 'AIDR Protected';
                isAidrEnabled = true;
                console.log('[Credentials] ✅ AIDR token restored from saved data.');
            }
        } catch (e) {
            console.warn('[Credentials] Could not restore AIDR token:', e);
        }
    }

    // Update banners after restoration
    updateSetupBanner();
}

/**
 * Clear all saved credentials from localStorage.
 */
function forgetSavedCredentials() {
    Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
    hasApiKey = false;
    isAidrConfigured = false;

    // Reset form fields
    if (apiKeyInput) apiKeyInput.value = '';
    if (aidrTokenInput) aidrTokenInput.value = '';
    if (aidrBaseUrlSelect) aidrBaseUrlSelect.value = 'https://api.us-2.crowdstrike.com/aidr/aiguard';

    // Reset AIDR button state
    if (aidrConnectBtn) {
        aidrConnectBtn.classList.remove('connected');
        aidrConnectText.textContent = 'Connect AIDR';
    }
    if (aidrConnectStatus) {
        aidrConnectStatus.textContent = 'Saved credentials have been cleared.';
        aidrConnectStatus.className = 'aidr-connect-status';
    }

    updateSetupBanner();
    console.log('[Credentials] 🗑️ All saved credentials cleared.');
}

/**
 * Check if any credentials are currently saved in localStorage.
 */
function hasSavedCredentials() {
    return !!(localStorage.getItem(LS_KEYS.API_KEY) || localStorage.getItem(LS_KEYS.AIDR_TOKEN));
}

// ============================================================
// Sidebar & Chat History
// ============================================================
async function loadChatList() {
    try {
        const resp = await fetch('/api/chats');
        const data = await resp.json();
        chats = data.chats || [];
        renderChatList();
        
        // If we just loaded and have no active chat, select the first one or create new
        if (!activeChatId) {
            if (chats.length > 0) {
                switchChat(chats[0].id);
            } else {
                createNewChat();
            }
        }
    } catch (e) {
        console.error('Failed to load chat list:', e);
    }
}

function renderChatList() {
    if (!sidebarContent) return;

    sidebarContent.innerHTML = '';

    const visible = chatFilter
        ? chats.filter(c => (c.title || '').toLowerCase().includes(chatFilter))
        : chats;

    if (chats.length === 0) {
        sidebarContent.innerHTML = '<div class="sidebar-empty">No previous chats.</div>';
        return;
    }
    if (visible.length === 0) {
        sidebarContent.innerHTML = `<div class="sidebar-empty">No chats match “${escapeHtml(chatFilter)}”.</div>`;
        return;
    }

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Older': []
    };

    visible.forEach(chat => {
        const chatDate = new Date(chat.updated_at);
        const dateString = chatDate.toDateString();
        const diffDays = Math.floor((new Date() - chatDate) / (1000 * 60 * 60 * 24));

        if (dateString === today) {
            groups['Today'].push(chat);
        } else if (dateString === yesterday) {
            groups['Yesterday'].push(chat);
        } else if (diffDays <= 7) {
            groups['Previous 7 Days'].push(chat);
        } else {
            groups['Older'].push(chat);
        }
    });

    for (const [groupName, groupChats] of Object.entries(groups)) {
        if (groupChats.length > 0) {
            const label = document.createElement('div');
            label.className = 'sidebar-group-label';
            label.textContent = groupName;
            sidebarContent.appendChild(label);

            groupChats.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'chat-list-item' + (chat.id === activeChatId ? ' active' : '') + (chat.aidr_triggered ? ' aidr-flagged' : '');
                item.dataset.id = chat.id;
                
                const icon = chat.aidr_triggered 
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

                item.innerHTML = `
                    <div class="chat-list-item-icon" title="${chat.aidr_triggered ? 'AIDR Block Triggered' : 'Chat'}">${icon}</div>
                    <div class="chat-list-item-title">${escapeHtml(chat.title)}</div>
                    <div class="chat-list-item-actions">
                        <button class="chat-list-action-btn edit-btn" title="Rename" data-action="rename">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="chat-list-action-btn delete-btn" title="Delete" data-action="delete">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;

                // Handle clicks
                item.addEventListener('click', (e) => {
                    const btn = e.target.closest('.chat-list-action-btn');
                    if (btn) {
                        e.stopPropagation();
                        if (btn.dataset.action === 'delete') {
                            deleteChat(chat.id);
                        } else if (btn.dataset.action === 'rename') {
                            startRenaming(item, chat.id);
                        }
                    } else {
                        switchChat(chat.id);
                    }
                });

                sidebarContent.appendChild(item);
            });
        }
    }
}

async function createNewChat() {
    try {
        const resp = await fetch('/api/chats', { method: 'POST' });
        const data = await resp.json();
        
        activeChatId = data.id;
        chatMessages.innerHTML = '';

        // Fresh chat — reset the AIDR timeline, usage counter and resend target
        activityEvents = [];
        lastUserMessage = '';
        resetUsage();
        renderActivity();

        // Show welcome screen using the persona the new chat was created with
        const currentPersona = data.persona || document.body.dataset.persona || 'customer_support';
        updatePersonaBadge(currentPersona);
        applyPersonaTheme(currentPersona);
        const welcome = document.createElement('div');
        welcome.className = 'welcome-screen';
        welcome.id = 'welcomeScreen';
        welcome.innerHTML = `
            <div class="welcome-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
            <h2>Welcome to AI Chat</h2>
            <p>Your conversations are protected by CrowdStrike AIDR security guardrails.</p>
            <div class="welcome-cards" id="welcomeCards"></div>
        `;
        chatMessages.appendChild(welcome);
        updateWelcomeCards(currentPersona);
        
        loadChatList();
        
        if (window.innerWidth <= 640) {
            appWrapper.classList.remove('mobile-sidebar-open');
        }
    } catch (e) {
        console.error('Failed to create chat:', e);
    }
}

async function switchChat(id) {
    if (activeChatId === id && document.querySelectorAll('.message').length > 0) {
        if (window.innerWidth <= 640) appWrapper.classList.remove('mobile-sidebar-open');
        return;
    }
    
    activeChatId = id;
    renderChatList(); // Update active class
    
    try {
        const resp = await fetch(`/api/chats/${id}`);
        const data = await resp.json();
        
        chatMessages.innerHTML = '';
        
        // Restore the AIDR timeline and usage total for this chat
        activityEvents = Array.isArray(data.aidr_events) ? data.aidr_events : [];
        resetUsage();
        renderActivity();

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                if (msg.role === 'system') return;
                if (msg.blocked === 'input') {
                    // Show what the user actually typed, then the block card —
                    // matching what they saw live.
                    appendMessage('user', msg.content, null, { aidr: msg.aidr });
                    appendBlockedMessage(
                        '⚠️ Your message was blocked by CrowdStrike AIDR security.',
                        'input',
                        msg.aidr
                    );
                    return;
                }
                if (msg.blocked === 'output') {
                    appendBlockedMessage(
                        '⚠️ The AI response was blocked by CrowdStrike AIDR security.',
                        'output',
                        msg.aidr
                    );
                    return;
                }
                appendMessage(msg.role, msg.content, null, {
                    aidr: msg.aidr,
                    usage: msg.usage,
                });
                addUsage(msg.usage);
            });
            // Remember the last prompt so Regenerate works after a reload
            const lastUser = [...data.messages].reverse()
                .find(m => m.role === 'user' && m.content);
            lastUserMessage = lastUser ? lastUser.content : '';
        } else {
            // Empty chat, show welcome
            const currentPersona = data.persona || document.body.dataset.persona || 'customer_support';
            const welcome = document.createElement('div');
            welcome.className = 'welcome-screen';
            welcome.id = 'welcomeScreen';
            welcome.innerHTML = `
                <div class="welcome-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <h2>Welcome to AI Chat</h2>
                <p>Your conversations are protected by CrowdStrike AIDR security guardrails.</p>
                <div class="welcome-cards" id="welcomeCards"></div>
            `;
            chatMessages.appendChild(welcome);
            updateWelcomeCards(currentPersona);
        }
        
        // Apply persona from this chat
        if (data.persona && personaSelect) {
            personaSelect.value = data.persona;
            updatePersonaBadge(data.persona);
            applyPersonaTheme(data.persona);
        }
        
        scrollToBottom();
        
        if (window.innerWidth <= 640) {
            appWrapper.classList.remove('mobile-sidebar-open');
        }
    } catch (e) {
        console.error('Failed to switch chat:', e);
    }
}

async function deleteChat(id) {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
        await fetch(`/api/chats/${id}`, { method: 'DELETE' });
        
        if (activeChatId === id) {
            activeChatId = null;
        }
        
        loadChatList();
    } catch (e) {
        console.error('Failed to delete chat:', e);
    }
}

function startRenaming(itemEl, id) {
    const titleEl = itemEl.querySelector('.chat-list-item-title');
    const oldTitle = titleEl.textContent;
    
    titleEl.contentEditable = true;
    titleEl.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(titleEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    const saveRename = async () => {
        titleEl.contentEditable = false;
        const newTitle = titleEl.textContent.trim();
        
        if (newTitle && newTitle !== oldTitle) {
            try {
                await fetch(`/api/chats/${id}/rename`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle })
                });
                loadChatList();
            } catch (e) {
                console.error('Failed to rename chat:', e);
                titleEl.textContent = oldTitle;
            }
        } else {
            titleEl.textContent = oldTitle;
        }
    };
    
    titleEl.addEventListener('blur', saveRename, { once: true });
    titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleEl.blur(); // Triggers save
        } else if (e.key === 'Escape') {
            titleEl.textContent = oldTitle;
            titleEl.blur(); // Cancels rename implicitly because content matches oldTitle
        }
    });
}


// ============================================================
// AIDR Verdict Panels
//
// The guard already returns detector names, policies, redactions and timing —
// these render it instead of collapsing everything to "blocked".
// ============================================================
const VERDICT_LABELS = {
    allowed: 'Allowed',
    blocked: 'Blocked',
    aidr_error: 'Guard unavailable',
    aidr_unavailable: 'Guard not configured',
};

function firedDetectors(aidr) {
    return (aidr && Array.isArray(aidr.detectors) ? aidr.detectors : [])
        .filter(d => d && d.detected);
}

/**
 * Collapsible AIDR verdict for one guard call. Returns null when there is
 * nothing worth showing (guard disabled, or a clean pass with no detail).
 */
function buildVerdictPanel(aidr, opts = {}) {
    if (!aidr || !aidr.status) return null;
    if (aidr.status === 'aidr_unavailable') return null;

    const fired = firedDetectors(aidr);
    const isBlocked = aidr.status === 'blocked';
    const isError = aidr.status === 'aidr_error';

    // A clean pass with no detectors, no redaction and no timing has nothing
    // to disclose — don't clutter every message with an empty panel.
    if (!isBlocked && !isError && !fired.length && !aidr.transformed
        && aidr.latency_ms === undefined) {
        return null;
    }

    const details = document.createElement('details');
    details.className = 'aidr-verdict ' + (
        isBlocked ? 'is-blocked' : isError ? 'is-error'
        : aidr.transformed ? 'is-transformed' : 'is-allowed'
    );
    if (opts.open) details.open = true;

    const summary = document.createElement('summary');
    const bits = [];
    bits.push(`<span class="verdict-dot"></span>`);
    bits.push(`<span class="verdict-label">AIDR ${escapeHtml(aidr.event_type || 'guard')}</span>`);
    bits.push(`<span class="verdict-status">${escapeHtml(VERDICT_LABELS[aidr.status] || aidr.status)}</span>`);
    if (aidr.transformed) bits.push('<span class="verdict-chip warn">Redacted</span>');
    if (fired.length) {
        bits.push(`<span class="verdict-chip">${fired.length} detector${fired.length === 1 ? '' : 's'}</span>`);
    }
    if (aidr.latency_ms !== undefined && aidr.latency_ms !== null) {
        bits.push(`<span class="verdict-latency">${aidr.latency_ms} ms</span>`);
    }
    summary.innerHTML = bits.join('');
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'verdict-body';

    if (isError) {
        body.innerHTML += `
            <div class="verdict-warning">
                The AIDR guard could not be reached, so this turn was
                <strong>not inspected</strong> and was allowed through
                (fail-open).
                ${aidr.error ? `<code>${escapeHtml(aidr.error)}</code>` : ''}
            </div>`;
    }

    if (aidr.policy) {
        body.innerHTML += `
            <div class="verdict-row">
                <span class="verdict-key">Policy</span>
                <span class="verdict-val">${escapeHtml(aidr.policy)}</span>
            </div>`;
    }

    if (fired.length) {
        const rows = fired.map(d => {
            const meta = [];
            if (d.confidence !== null && d.confidence !== undefined) {
                const pct = typeof d.confidence === 'number' && d.confidence <= 1
                    ? `${Math.round(d.confidence * 100)}%`
                    : String(d.confidence);
                meta.push(`<span class="detector-confidence">${escapeHtml(pct)}</span>`);
            }
            if (d.entities && d.entities.length) {
                meta.push(d.entities.slice(0, 8)
                    .map(e => `<span class="entity-chip">${escapeHtml(e)}</span>`)
                    .join(''));
            }
            const detail = d.detail
                ? `<div class="detector-detail">${escapeHtml(d.detail)}</div>`
                : '';
            return `
                <li class="detector-item">
                    <div class="detector-head">
                        <code class="detector-name">${escapeHtml(d.name)}</code>
                        ${meta.join('')}
                    </div>
                    ${detail}
                </li>`;
        }).join('');
        body.innerHTML += `
            <div class="verdict-row column">
                <span class="verdict-key">Detectors fired</span>
                <ul class="detector-list">${rows}</ul>
            </div>`;
    } else if (!isError) {
        body.innerHTML += `
            <div class="verdict-row">
                <span class="verdict-key">Detectors</span>
                <span class="verdict-val muted">None fired</span>
            </div>`;
    }

    details.appendChild(body);

    // Redaction diff — what AIDR actually masked
    if (aidr.redacted && aidr.redacted.before && aidr.redacted.after) {
        body.appendChild(buildRedactionDiff(aidr.redacted));
    } else if (aidr.transformed && aidr.guard_output) {
        const wrap = document.createElement('div');
        wrap.className = 'verdict-row column';
        wrap.innerHTML = `
            <span class="verdict-key">Content after AIDR</span>
            <pre class="redaction-block">${escapeHtml(aidr.guard_output)}</pre>`;
        body.appendChild(wrap);
    }

    return details;
}

/**
 * A standalone notice for input-side redaction, shown above the reply so the
 * user can see what left their message before the model saw it.
 */
function buildRedactionNotice(aidr) {
    if (!aidr || !aidr.transformed) return null;
    const el = document.createElement('div');
    el.className = 'redaction-notice';
    el.innerHTML = `
        <div class="redaction-notice-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            AIDR redacted content in your message before it reached the model
        </div>`;
    if (aidr.redacted && aidr.redacted.before && aidr.redacted.after) {
        el.appendChild(buildRedactionDiff(aidr.redacted));
    }
    return el;
}

/**
 * Word-level before/after diff of an AIDR redaction.
 */
function buildRedactionDiff(redacted) {
    const wrap = document.createElement('div');
    wrap.className = 'redaction-diff';

    const before = String(redacted.before).split(/(\s+)/);
    const after = String(redacted.after).split(/(\s+)/);
    const { removed, added } = diffTokens(before, after);

    wrap.innerHTML = `
        <div class="diff-col">
            <span class="diff-label">Before</span>
            <pre class="redaction-block">${removed}</pre>
        </div>
        <div class="diff-col">
            <span class="diff-label">After AIDR</span>
            <pre class="redaction-block">${added}</pre>
        </div>`;
    return wrap;
}

/**
 * Longest-common-subsequence token diff. Returns escaped HTML for each side
 * with the differing runs wrapped in <mark>.
 */
function diffTokens(a, b) {
    const n = a.length, m = b.length;
    // Guard against pathological input — fall back to plain text.
    if (n * m > 400000) {
        return { removed: escapeHtml(a.join('')), added: escapeHtml(b.join('')) };
    }

    const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j]
                ? lcs[i + 1][j + 1] + 1
                : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }

    let removed = '', added = '';
    let i = 0, j = 0;
    const flushRemoved = (s) => s ? `<mark class="diff-removed">${escapeHtml(s)}</mark>` : '';
    const flushAdded = (s) => s ? `<mark class="diff-added">${escapeHtml(s)}</mark>` : '';
    let pendingA = '', pendingB = '';

    while (i < n && j < m) {
        if (a[i] === b[j]) {
            removed += flushRemoved(pendingA); pendingA = '';
            added += flushAdded(pendingB); pendingB = '';
            removed += escapeHtml(a[i]);
            added += escapeHtml(b[j]);
            i++; j++;
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            pendingA += a[i++];
        } else {
            pendingB += b[j++];
        }
    }
    while (i < n) pendingA += a[i++];
    while (j < m) pendingB += b[j++];
    removed += flushRemoved(pendingA);
    added += flushAdded(pendingB);

    return { removed, added };
}

// ============================================================
// AIDR Activity Timeline
// ============================================================
function ingestAidrEvents(events) {
    if (!Array.isArray(events) || !events.length) return;
    activityEvents = activityEvents.concat(events);
    if (activityEvents.length > 200) {
        activityEvents = activityEvents.slice(-200);
    }
    renderActivity();
}

function renderActivity() {
    if (!activityList || !activityStats) return;

    // Header badge
    if (activityCount) {
        const blocked = activityEvents.filter(e => e.status === 'blocked').length;
        if (blocked > 0) {
            activityCount.textContent = String(blocked);
            activityCount.classList.remove('hidden');
        } else {
            activityCount.classList.add('hidden');
        }
    }

    if (!activityEvents.length) {
        activityStats.innerHTML = '';
        activityList.innerHTML =
            '<div class="drawer-empty">No guarded turns yet. Send a message with AIDR enabled to populate the timeline.</div>';
        return;
    }

    const total = activityEvents.length;
    const blocked = activityEvents.filter(e => e.status === 'blocked').length;
    const redacted = activityEvents.filter(e => e.transformed).length;
    const errors = activityEvents.filter(e => e.status === 'aidr_error').length;
    const latencies = activityEvents
        .map(e => e.latency_ms)
        .filter(v => typeof v === 'number');
    const avg = latencies.length
        ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
        : null;

    activityStats.innerHTML = `
        <div class="stat-tile"><span class="stat-val">${total}</span><span class="stat-key">Guarded</span></div>
        <div class="stat-tile ${blocked ? 'danger' : ''}"><span class="stat-val">${blocked}</span><span class="stat-key">Blocked</span></div>
        <div class="stat-tile ${redacted ? 'warn' : ''}"><span class="stat-val">${redacted}</span><span class="stat-key">Redacted</span></div>
        <div class="stat-tile"><span class="stat-val">${avg === null ? '—' : avg + 'ms'}</span><span class="stat-key">Avg guard</span></div>
        ${errors ? `<div class="stat-tile danger"><span class="stat-val">${errors}</span><span class="stat-key">Guard errors</span></div>` : ''}
    `;

    activityList.innerHTML = '';
    [...activityEvents].reverse().forEach(e => {
        const item = document.createElement('div');
        item.className = 'activity-item status-' + (e.status || 'unknown');

        const fired = firedDetectors(e).map(d => d.name);
        const time = e.ts ? new Date(e.ts).toLocaleTimeString() : '—';

        item.innerHTML = `
            <div class="activity-head">
                <span class="activity-phase">${escapeHtml(e.phase || '—')}</span>
                <span class="activity-status">${escapeHtml(VERDICT_LABELS[e.status] || e.status || '—')}</span>
                <span class="activity-time">${escapeHtml(time)}</span>
            </div>
            ${e.preview ? `<div class="activity-preview">${escapeHtml(e.preview)}${e.preview.length >= 160 ? '…' : ''}</div>` : ''}
            <div class="activity-meta">
                ${e.policy ? `<span class="verdict-chip">${escapeHtml(e.policy)}</span>` : ''}
                ${fired.length
                    ? fired.map(n => `<span class="entity-chip">${escapeHtml(n)}</span>`).join('')
                    : '<span class="verdict-val muted">no detectors</span>'}
                ${e.transformed ? '<span class="verdict-chip warn">redacted</span>' : ''}
                ${typeof e.latency_ms === 'number' ? `<span class="activity-time">${e.latency_ms} ms</span>` : ''}
            </div>
            ${e.error ? `<div class="verdict-warning"><code>${escapeHtml(e.error)}</code></div>` : ''}
        `;
        activityList.appendChild(item);
    });
}

// ============================================================
// Drawers (activity / red-team / compare)
// ============================================================
const DRAWERS = {
    activity: () => ({ panel: activityPanel, overlay: activityOverlay, btn: activityBtn }),
    redteam: () => ({ panel: redteamPanel, overlay: redteamOverlay, btn: redteamBtn }),
    compare: () => ({ panel: comparePanel, overlay: compareOverlay, btn: null }),
};

function openDrawer(name) {
    const { panel, overlay, btn } = DRAWERS[name]();
    if (!panel) return;
    lastFocusedBeforeDialog = document.activeElement;
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('active');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    focusFirstIn(panel);
}

function closeDrawer(name) {
    const { panel, overlay, btn } = DRAWERS[name]();
    if (!panel) return;
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('active');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    restoreFocus();
}

function toggleDrawer(name) {
    const { panel } = DRAWERS[name]();
    if (!panel) return;
    if (panel.classList.contains('active')) {
        closeDrawer(name);
        return;
    }
    // Only one drawer at a time
    Object.keys(DRAWERS).forEach(k => { if (k !== name) closeDrawer(k); });
    if (name === 'redteam') loadRedteam();
    if (name === 'activity') renderActivity();
    openDrawer(name);
}

// ============================================================
// Red-Team Prompt Library
// ============================================================
async function loadRedteam() {
    const persona = (personaSelect && personaSelect.value)
        || document.body.dataset.persona
        || 'customer_support';

    if (redteamCache[persona]) {
        renderRedteam(redteamCache[persona]);
        return;
    }

    redteamList.innerHTML = '<div class="drawer-empty">Loading…</div>';
    try {
        const resp = await fetch(`/api/redteam?persona=${encodeURIComponent(persona)}`);
        const data = await resp.json();
        redteamCache[persona] = data.prompts || [];
        renderRedteam(redteamCache[persona]);
    } catch (e) {
        console.warn('Could not load red-team library:', e);
        redteamList.innerHTML = '<div class="drawer-empty">Could not load the prompt library.</div>';
    }
}

function renderRedteam(prompts) {
    redteamList.innerHTML = '';
    if (!prompts.length) {
        redteamList.innerHTML = '<div class="drawer-empty">No prompts available.</div>';
        return;
    }

    // Group by detector category
    const groups = new Map();
    prompts.forEach(p => {
        if (!groups.has(p.category)) groups.set(p.category, []);
        groups.get(p.category).push(p);
    });

    groups.forEach((items, category) => {
        const label = document.createElement('div');
        label.className = 'drawer-group-label';
        label.textContent = category;
        redteamList.appendChild(label);

        items.forEach(p => {
            const card = document.createElement('div');
            card.className = 'redteam-card';
            card.innerHTML = `
                <div class="redteam-head">
                    <span class="redteam-icon">${escapeHtml(p.icon || '⚠️')}</span>
                    <span class="redteam-label">${escapeHtml(p.label)}</span>
                    ${p.expect ? `<code class="redteam-expect">${escapeHtml(p.expect)}</code>` : ''}
                </div>
                <pre class="redteam-prompt">${escapeHtml(p.prompt)}</pre>
                <div class="redteam-actions">
                    <button type="button" class="msg-action-btn" data-act="load">Load</button>
                    <button type="button" class="msg-action-btn primary" data-act="send">Send</button>
                </div>`;

            card.querySelector('[data-act="load"]').addEventListener('click', () => {
                chatInput.value = p.prompt;
                sendBtn.disabled = false;
                autoResizeTextarea();
                closeDrawer('redteam');
                chatInput.focus();
            });
            card.querySelector('[data-act="send"]').addEventListener('click', () => {
                closeDrawer('redteam');
                sendMessage(p.prompt);
            });

            redteamList.appendChild(card);
        });
    });
}

// ============================================================
// A/B Compare — AIDR on vs off
// ============================================================
async function runCompare() {
    const prompt = chatInput.value.trim() || lastUserMessage;
    if (!prompt) {
        showAidrError('Type a prompt (or send one first) to compare AIDR on vs off.');
        chatInput.focus();
        return;
    }

    comparePromptEl.innerHTML = `<span class="compare-prompt-label">Prompt</span><pre>${escapeHtml(prompt)}</pre>`;
    compareGrid.innerHTML = '<div class="drawer-empty">Running both paths…</div>';
    openDrawer('compare');

    try {
        const resp = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt }),
        });
        const data = await resp.json();
        if (!resp.ok) {
            compareGrid.innerHTML =
                `<div class="drawer-empty">${escapeHtml(data.error || 'Comparison failed.')}</div>`;
            if (data.needs_setup) setTimeout(openSettings, 800);
            return;
        }
        renderCompare(data);
    } catch (e) {
        console.error('Compare failed:', e);
        compareGrid.innerHTML = '<div class="drawer-empty">Network error running the comparison.</div>';
    }
}

function renderCompare(data) {
    compareGrid.innerHTML = '';

    const column = (title, sub, run, guarded) => {
        const col = document.createElement('div');
        col.className = 'compare-col' + (guarded ? ' guarded' : ' unguarded');

        const blocked = !!run.blocked;
        const verdictText = blocked
            ? `Blocked on ${run.block_type === 'input' ? 'input' : 'output'}`
            : run.error ? 'Provider error' : 'Delivered';

        col.innerHTML = `
            <div class="compare-col-head">
                <span class="compare-col-title">${escapeHtml(title)}</span>
                <span class="compare-col-sub">${escapeHtml(sub)}</span>
                <span class="compare-verdict ${blocked ? 'blocked' : 'allowed'}">${escapeHtml(verdictText)}</span>
            </div>`;

        const bodyEl = document.createElement('div');
        bodyEl.className = 'compare-col-body';
        if (blocked) {
            bodyEl.innerHTML =
                '<div class="compare-blocked">AIDR stopped this turn — no model output was returned to the user.</div>';
        } else if (run.error) {
            bodyEl.innerHTML = `<div class="verdict-warning">${escapeHtml(run.error)}</div>`;
        } else {
            bodyEl.innerHTML = formatMessage(run.response || '');
            enhanceCodeBlocks(bodyEl);
        }
        col.appendChild(bodyEl);

        if (guarded) {
            [run.aidr_input, run.aidr_output].forEach(a => {
                const panel = buildVerdictPanel(a, { open: blocked });
                if (panel) col.appendChild(panel);
            });
        }
        if (run.usage) {
            const u = document.createElement('div');
            u.className = 'msg-usage standalone';
            u.textContent = formatUsage(run.usage);
            col.appendChild(u);
        }
        return col;
    };

    compareGrid.appendChild(column(
        'AIDR ON', `${data.provider} · ${data.model}`, data.guarded, true
    ));
    compareGrid.appendChild(column(
        'AIDR OFF', `${data.provider} · ${data.model}`, data.unguarded, false
    ));
}

// ============================================================
// Export transcript
// ============================================================
function exportTranscript() {
    if (!activeChatId) {
        showAidrError('Nothing to export yet — start a conversation first.');
        return;
    }
    window.location.href = `/api/chats/${activeChatId}/export`;
}

// ============================================================
// Token / cost counter
// ============================================================
function resetUsage() {
    sessionUsage = { input_tokens: 0, output_tokens: 0, cost_usd: 0, priced: false };
    renderUsage();
}

function addUsage(usage) {
    if (!usage) return;
    sessionUsage.input_tokens += usage.input_tokens || 0;
    sessionUsage.output_tokens += usage.output_tokens || 0;
    if (typeof usage.cost_usd === 'number') {
        sessionUsage.cost_usd += usage.cost_usd;
        sessionUsage.priced = true;
    }
    renderUsage();
}

function formatUsage(usage) {
    const parts = [
        `${(usage.input_tokens || 0).toLocaleString()} in`,
        `${(usage.output_tokens || 0).toLocaleString()} out`,
    ];
    if (typeof usage.cost_usd === 'number') {
        parts.push(`$${usage.cost_usd < 0.01 ? usage.cost_usd.toFixed(4) : usage.cost_usd.toFixed(2)}`);
    }
    return parts.join(' · ');
}

function renderUsage() {
    if (!usageIndicator) return;
    const { input_tokens, output_tokens, cost_usd, priced } = sessionUsage;
    if (!input_tokens && !output_tokens) {
        usageIndicator.classList.add('hidden');
        usageIndicator.textContent = '';
        return;
    }
    const total = input_tokens + output_tokens;
    let text = `${total.toLocaleString()} tokens`;
    if (priced) {
        text += ` · $${cost_usd < 0.01 ? cost_usd.toFixed(4) : cost_usd.toFixed(2)}`;
    }
    usageIndicator.textContent = text;
    usageIndicator.title =
        `${input_tokens.toLocaleString()} input · ${output_tokens.toLocaleString()} output` +
        (priced ? '' : ' — no published rate for this model, cost not shown');
    usageIndicator.classList.remove('hidden');
}
