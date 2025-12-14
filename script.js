// ===== API CONFIGURATION =====
const API_BASE_URL = 'http://localhost:5000/api'; // Change to your backend URL

// ===== STATE MANAGEMENT =====
let currentFormData = null;
let currentWeather = null;
let currentRecommendations = null;
let currentSchedule = null;
let chatHistory = [];

// ===== DOM ELEMENTS =====
const farmForm = document.getElementById('farmForm');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherSection = document.getElementById('weather-section');
const resultsSection = document.getElementById('results-section');
const scheduleSection = document.getElementById('schedule-section');
const assistantInput = document.getElementById('assistantInput');
const sendBtn = document.getElementById('sendBtn');
const chatBox = document.getElementById('chatBox');
const quickBtns = document.querySelectorAll('.quick-btn');

// Navbar AI Chat elements
const navAiBtn = document.getElementById('navAiBtn');
const navAiModal = document.getElementById('navAiModal');
const closeNavAi = document.getElementById('closeNavAi');
const navAiChat = document.getElementById('navAiChat');
const navAiInput = document.getElementById('navAiInput');
const navAiSend = document.getElementById('navAiSend');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadDemoData(); // Load demo data for testing
});

function initializeEventListeners() {
    farmForm.addEventListener('submit', handleFormSubmit);
    sendBtn.addEventListener('click', handleSendMessage);
    assistantInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
    quickBtns.forEach(btn => {
        btn.addEventListener('click', handleQuickQuestion);
    });

    // Navbar AI Chat listeners
    navAiBtn.addEventListener('click', toggleNavAiModal);
    closeNavAi.addEventListener('click', closeNavAiModal);
    navAiSend.addEventListener('click', handleNavAiSend);
    navAiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNavAiSend();
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar-ai-chat')) {
            navAiModal.classList.add('hidden');
        }
    });
}

// ===== FORM SUBMISSION =====
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        location: document.getElementById('location').value,
        soilType: document.getElementById('soilType').value,
        season: document.getElementById('season').value,
        farmArea: document.getElementById('farmArea').value || 'Not specified'
    };

    currentFormData = formData;
    showLoadingSpinner(true);

    try {
        // Fetch weather data
        const weatherData = await fetchWeatherData(formData.location);
        currentWeather = weatherData;

        // Fetch crop recommendations
        const recommendations = await fetchRecommendations(formData);
        currentRecommendations = recommendations;

        // Fetch crop schedule
        const schedule = await fetchSchedule(formData);
        currentSchedule = schedule;

        // Display results
        displayWeatherData(weatherData);
        displayRecommendations(recommendations, formData);
        displaySchedule(schedule, formData);
        displayRiskAlerts(weatherData);

        // Enable assistant
        enableAssistant();

        // Show sections
        showLoadingSpinner(false);
        weatherSection.classList.remove('hidden');
        resultsSection.classList.remove('hidden');
        scheduleSection.classList.remove('hidden');

        // Scroll to results
        setTimeout(() => {
            weatherSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    } catch (error) {
        console.error('Error:', error);
        showLoadingSpinner(false);
        alert('Error fetching data. Please check your internet connection and try again.');
    }
}

// ===== API CALLS =====
async function fetchWeatherData(location) {
    try {
        const response = await fetch(`${API_BASE_URL}/weather?location=${location}`);
        
        if (!response.ok) {
            return generateMockWeatherData();
        }
        
        return await response.json();
    } catch (error) {
        console.warn('Weather API failed, using mock data:', error);
        return generateMockWeatherData();
    }
}

async function fetchRecommendations(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            return generateMockRecommendations(formData);
        }

        return await response.json();
    } catch (error) {
        console.warn('Recommendation API failed, using mock data:', error);
        return generateMockRecommendations(formData);
    }
}

async function fetchSchedule(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            return generateMockSchedule(formData);
        }

        return await response.json();
    } catch (error) {
        console.warn('Schedule API failed, using mock data:', error);
        return generateMockSchedule(formData);
    }
}

async function fetchRiskAnalysis(weatherData) {
    try {
        const response = await fetch(`${API_BASE_URL}/risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(weatherData)
        });

        if (!response.ok) {
            return generateMockRiskAlerts(weatherData);
        }

        return await response.json();
    } catch (error) {
        console.warn('Risk API failed, using mock data:', error);
        return generateMockRiskAlerts(weatherData);
    }
}

// ===== DISPLAY FUNCTIONS =====
function displayWeatherData(weatherData) {
    // Update weather cards
    document.getElementById('temperature').textContent = Math.round(weatherData.temperature || 28);
    document.getElementById('humidity').textContent = weatherData.humidity || 65;
    document.getElementById('rainfall').textContent = weatherData.rainfall_prediction || 45;
    document.getElementById('windSpeed').textContent = Math.round(weatherData.wind_speed || 12);

    // Display forecast
    const forecastList = document.getElementById('forecastList');
    forecastList.innerHTML = '';

    const forecast = weatherData.forecast_7day || generateMock7DayForecast();
    forecast.forEach(day => {
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <div class="forecast-day-name">${day.day}</div>
            <div class="forecast-condition">${day.condition_emoji || '🌤️'}</div>
            <div class="forecast-temp">${day.temp_max}°C / ${day.temp_min}°C</div>
            <div class="forecast-condition">${day.condition || 'Partly Cloudy'}</div>
        `;
        forecastList.appendChild(forecastDay);
    });
}

function displayRecommendations(recommendations, formData) {
    // Display top crop
    const topCrop = recommendations.crops[0];
    document.getElementById('topCropName').textContent = topCrop.name;
    document.getElementById('topCropScore').textContent = `${Math.round(topCrop.score)}%`;
    document.getElementById('topCropYield').textContent = topCrop.expected_yield || '2000-2500 kg/acre';

    // Display all crops
    const cropRecommendations = document.getElementById('cropRecommendations');
    cropRecommendations.innerHTML = '';

    recommendations.crops.forEach(crop => {
        const cropCard = document.createElement('div');
        cropCard.className = 'crop-card';
        cropCard.innerHTML = `
            <div class="crop-card-name">${crop.name}</div>
            <div class="crop-card-score">${Math.round(crop.score)}%</div>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                ${crop.reason || 'Suitable for current conditions'}
            </p>
            <div class="crop-card-badge">${crop.season || formData.season.toUpperCase()}</div>
        `;
        cropRecommendations.appendChild(cropCard);
    });

    // Display compatibility
    document.getElementById('soilMatch').textContent = recommendations.soil_compatibility || 'Highly Compatible';
    document.getElementById('tempRange').textContent = recommendations.temp_range || '20-30°C';
    document.getElementById('rainfallRange').textContent = recommendations.rainfall_range || '40-80 mm';
    document.getElementById('cropDuration').textContent = recommendations.crop_duration || '90-120 days';
}

function displaySchedule(schedule, formData) {
    // Populate schedule table
    const scheduleBody = document.getElementById('scheduleBody');
    scheduleBody.innerHTML = '';

    schedule.activities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.activity}</td>
            <td>${formatDate(activity.recommended_date)}</td>
            <td>${activity.duration || '1-2 days'}</td>
            <td>${activity.details || '--'}</td>
        `;
        scheduleBody.appendChild(row);
    });

    // Display timeline
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    schedule.activities.forEach(activity => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <div class="timeline-date">${formatDate(activity.recommended_date)}</div>
            <div class="timeline-activity">
                <strong>${activity.activity}</strong>
                <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">${activity.details || ''}</p>
            </div>
        `;
        timeline.appendChild(timelineItem);
    });
}

function displayRiskAlerts(weatherData) {
    const riskAlerts = document.getElementById('riskAlerts');
    riskAlerts.innerHTML = '';

    const alerts = generateRiskAlerts(weatherData);

    if (alerts.length === 0) {
        const noAlert = document.createElement('div');
        noAlert.className = 'alert alert-success';
        noAlert.innerHTML = `
            <span class="alert-icon">✅</span>
            <div class="alert-content">
                <div class="alert-title">All Clear</div>
                <p>No weather risks detected. Conditions are favorable for farming.</p>
            </div>
        `;
        riskAlerts.appendChild(noAlert);
        return;
    }

    alerts.forEach(alert => {
        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${alert.severity}`;
        alertEl.innerHTML = `
            <span class="alert-icon">${alert.icon}</span>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <p>${alert.message}</p>
            </div>
        `;
        riskAlerts.appendChild(alertEl);
    });
}

// ===== RISK ALERT LOGIC =====
function generateRiskAlerts(weatherData) {
    const alerts = [];
    const temp = weatherData.temperature || 28;
    const rainfall = weatherData.rainfall_prediction || 45;
    const humidity = weatherData.humidity || 65;

    // Drought alert
    if (rainfall < 30) {
        alerts.push({
            severity: 'warning',
            icon: '🌵',
            title: 'Drought Risk',
            message: `Low rainfall predicted (${rainfall}mm). Consider irrigation planning.`
        });
    }

    // Flood alert
    if (rainfall > 200) {
        alerts.push({
            severity: 'danger',
            icon: '🌊',
            title: 'Flood Risk',
            message: `High rainfall predicted (${rainfall}mm). Prepare drainage systems.`
        });
    }

    // Heat stress
    if (temp > 40) {
        alerts.push({
            severity: 'danger',
            icon: '🔥',
            title: 'Heat Stress Alert',
            message: `High temperature (${temp}°C). Increase irrigation frequency.`
        });
    }

    // Cold stress
    if (temp < 5) {
        alerts.push({
            severity: 'warning',
            icon: '❄️',
            title: 'Cold Stress Alert',
            message: `Low temperature (${temp}°C). Frost protection may be needed.`
        });
    }

    // Low humidity
    if (humidity < 30) {
        alerts.push({
            severity: 'warning',
            icon: '💨',
            title: 'Low Humidity',
            message: `Very dry conditions (${humidity}%). High evapotranspiration expected.`
        });
    }

    return alerts;
}

// ===== CHAT / ASSISTANT =====
async function handleSendMessage() {
    const message = assistantInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addChatMessage(message, 'user');
    assistantInput.value = '';

    // Generate response
    const response = generateAssistantResponse(message);
    
    setTimeout(() => {
        addChatMessage(response, 'assistant');
    }, 500);
}

function handleQuickQuestion(e) {
    const question = e.target.getAttribute('data-question');
    let message = '';

    switch (question) {
        case 'why-crop':
            message = `Why is ${currentRecommendations?.crops[0]?.name || 'this crop'} recommended?`;
            break;
        case 'weather-risk':
            message = 'What are the weather risks for my farm?';
            break;
        case 'next-step':
            message = 'What should I do now?';
            break;
    }

    if (message) {
        assistantInput.value = message;
        handleSendMessage();
    }
}

function addChatMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function generateAssistantResponse(message) {
    const msg = message.toLowerCase();
    const topCrop = currentRecommendations?.crops[0];

    if (msg.includes('why') && topCrop) {
        return `${topCrop.name} is recommended because it matches your soil type (${currentFormData?.soilType}), is ideal for the ${currentFormData?.season} season, and the current weather conditions (${Math.round(currentWeather?.temperature)}°C, ${currentWeather?.rainfall_prediction}mm rainfall) are perfect for its growth.`;
    }

    if (msg.includes('risk') || msg.includes('weather')) {
        const alerts = generateRiskAlerts(currentWeather);
        if (alerts.length === 0) {
            return 'Good news! Weather conditions are favorable with no major risks detected. You can proceed with farming activities as scheduled.';
        }
        return `I've identified ${alerts.length} risk(s): ${alerts.map(a => a.title).join(', ')}. Please check the risk alerts section for detailed recommendations.`;
    }

    if (msg.includes('what should i do') || msg.includes('next step')) {
        const nextActivity = currentSchedule?.activities[0];
        return `Based on your crop plan, your next step is: ${nextActivity?.activity || 'Prepare your field'} on ${nextActivity ? formatDate(nextActivity.recommended_date) : 'the scheduled date'}. Make sure to follow the farming calendar for best results.`;
    }

    if (msg.includes('irrigation') || msg.includes('water')) {
        return `For ${topCrop?.name || 'your crop'}, irrigation needs depend on rainfall. Current rainfall prediction is ${currentWeather?.rainfall_prediction}mm. If this is below the crop's requirement, plan supplementary irrigation accordingly.`;
    }

    if (msg.includes('fertiliz') || msg.includes('nutrient')) {
        return `Your ${currentFormData?.soilType} soil compatibility is good. Consult the schedule table for recommended fertilization dates. Always follow local agricultural guidelines for fertilizer application.`;
    }

    return `I'm here to help with questions about your crop recommendations, weather conditions, and farming schedule. Try asking about "why this crop?", "weather risks", or "next steps".`;
}

function enableAssistant() {
    assistantInput.disabled = false;
    sendBtn.disabled = false;
}

// ===== NAVBAR AI CHAT FUNCTIONS =====
function toggleNavAiModal(e) {
    e.stopPropagation();
    navAiModal.classList.toggle('hidden');
}

function closeNavAiModal() {
    navAiModal.classList.add('hidden');
}

async function handleNavAiSend() {
    const message = navAiInput.value.trim();
    if (!message) return;

    // Add user message
    addNavAiMessage(message, 'user');
    navAiInput.value = '';

    // Generate response
    const response = generateAssistantResponse(message);
    
    setTimeout(() => {
        addNavAiMessage(response, 'assistant');
    }, 500);
}

function addNavAiMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
    navAiChat.appendChild(messageDiv);
    navAiChat.scrollTop = navAiChat.scrollHeight;
}

// ===== MOCK DATA GENERATORS (for testing without backend) =====
function generateMockWeatherData() {
    return {
        temperature: 28 + Math.random() * 4,
        humidity: 60 + Math.random() * 20,
        rainfall_prediction: 40 + Math.random() * 60,
        wind_speed: 10 + Math.random() * 10,
        forecast_7day: generateMock7DayForecast()
    };
}

function generateMock7DayForecast() {
    const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const conditions = [
        { emoji: '☀️', name: 'Sunny' },
        { emoji: '🌤️', name: 'Partly Cloudy' },
        { emoji: '⛅', name: 'Cloudy' },
        { emoji: '🌧️', name: 'Rainy' }
    ];

    return days.map((day, idx) => {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return {
            day,
            condition_emoji: condition.emoji,
            condition: condition.name,
            temp_max: 28 + Math.random() * 6,
            temp_min: 18 + Math.random() * 4
        };
    });
}

function generateMockRecommendations(formData) {
    const cropsByseason = {
        kharif: ['Rice', 'Maize', 'Cotton'],
        rabi: ['Wheat', 'Barley', 'Chickpea'],
        zaid: ['Watermelon', 'Muskmelon', 'Cucumber']
    };

    const season = formData.season || 'kharif';
    const crops = (cropsByseason[season] || cropsByseason.kharif).map((name, idx) => ({
        name,
        score: 95 - idx * 15,
        reason: `Highly suitable for ${formData.soilType} soil in ${season} season`,
        season: season.toUpperCase(),
        expected_yield: `${2000 - idx * 300}-${2500 - idx * 300} kg/acre`
    }));

    return {
        crops,
        soil_compatibility: 'Highly Compatible',
        temp_range: '20-30°C',
        rainfall_range: '40-80 mm',
        crop_duration: '90-120 days'
    };
}

function generateMockSchedule(formData) {
    const today = new Date();
    const activities = [
        {
            activity: 'Field Preparation',
            recommended_date: addDays(today, 0),
            duration: '5-7 days',
            details: 'Plough and level the field'
        },
        {
            activity: 'Sowing',
            recommended_date: addDays(today, 7),
            duration: '2-3 days',
            details: 'Sow seeds at recommended spacing'
        },
        {
            activity: 'First Irrigation',
            recommended_date: addDays(today, 14),
            duration: '1-2 days',
            details: 'Apply first irrigation if required'
        },
        {
            activity: 'First Fertilization',
            recommended_date: addDays(today, 21),
            duration: '1 day',
            details: 'Apply nitrogen fertilizer'
        },
        {
            activity: 'Weeding',
            recommended_date: addDays(today, 35),
            duration: '3-4 days',
            details: 'Remove weeds from the field'
        },
        {
            activity: 'Second Fertilization',
            recommended_date: addDays(today, 45),
            duration: '1 day',
            details: 'Apply potassium fertilizer'
        },
        {
            activity: 'Harvesting',
            recommended_date: addDays(today, 120),
            duration: '7-10 days',
            details: 'Harvest when crop is mature'
        }
    ];

    return { activities };
}

function generateMockRiskAlerts(weatherData) {
    return generateRiskAlerts(weatherData);
}

// ===== UTILITY FUNCTIONS =====
function showLoadingSpinner(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

function formatDate(date) {
    if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadDemoData() {
    console.log('Frontend ready. Mock data will be used until backend is connected.');
}