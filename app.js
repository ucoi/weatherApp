"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const weatherForm = document.querySelector('.weatherForm');
const cityInput = document.querySelector('.cityInput');
const card = document.querySelector('.card');
const forecastSection = document.querySelector('.forecast');
const forecastGrid = document.querySelector('.forecastGrid');
const statusArea = document.querySelector('.statusArea');
const unitToggle = document.querySelector('.unitToggle');
const toggleLabel = document.querySelector('.toggleLabel');
const historyList = document.querySelector('.historyList');
const locationBtn = document.querySelector('.locationBtn');
if (!weatherForm || !cityInput || !card || !forecastSection || !forecastGrid || !statusArea || !unitToggle || !toggleLabel || !historyList || !locationBtn) {
    throw new Error('Required weather elements could not be found in the page.');
}
const apiKey = '165ae638de5cb73e8a5b37895517e08e';
let unit = (localStorage.getItem('weatherUnit') === 'imperial' ? 'imperial' : 'metric');
const storedHistory = localStorage.getItem('weatherHistory');
let historyCities = [];
try {
    const parsed = storedHistory ? JSON.parse(storedHistory) : [];
    historyCities = Array.isArray(parsed)
        ? parsed.filter((item) => typeof item === 'string')
        : [];
}
catch {
    historyCities = [];
}
function initialize() {
    unitToggle.checked = unit === 'imperial';
    toggleLabel.textContent = unit === 'imperial' ? '°F' : '°C';
    loadHistory();
    const lastCity = historyCities[0];
    if (lastCity) {
        fetchAndDisplay(lastCity);
    }
    else {
        displayWelcome();
    }
}
weatherForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) {
        displayError('Please enter a city name.');
        return;
    }
    await fetchAndDisplay(city);
});
unitToggle.addEventListener('change', async () => {
    unit = unitToggle.checked ? 'imperial' : 'metric';
    localStorage.setItem('weatherUnit', unit);
    toggleLabel.textContent = unit === 'imperial' ? '°F' : '°C';
    const currentCity = card.dataset.city;
    if (currentCity) {
        await fetchAndDisplay(currentCity);
    }
});
locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        displayError('Geolocation is not supported by your browser.');
        return;
    }
    showStatus('Getting your location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchByCoordinates(latitude, longitude);
    }, () => {
        displayError('Unable to access your location.');
    }, { timeout: 10000 });
});
historyList.addEventListener('click', async (event) => {
    const target = event.target;
    const button = target instanceof Element ? target.closest('button[data-city]') : null;
    if (!(button instanceof HTMLButtonElement))
        return;
    await fetchAndDisplay(button.dataset.city ?? '');
});
async function fetchAndDisplay(city) {
    try {
        showStatus('Loading weather...');
        const weatherData = await getWeatherData(city);
        const forecastData = await getForecastData(city);
        displayWeatherInfo(weatherData);
        displayForecast(forecastData);
        saveHistory(weatherData.name);
    }
    catch (error) {
        displayError(parseError(error));
    }
}
async function fetchByCoordinates(lat, lon) {
    try {
        showStatus('Loading weather...');
        const weatherData = await getWeatherDataByCoordinates(lat, lon);
        const forecastData = await getForecastDataByCoordinates(lat, lon);
        const geocodedCity = await reverseGeocodeCoordinates(lat, lon);
        if (geocodedCity) {
            weatherData.name = geocodedCity;
        }
        displayWeatherInfo(weatherData);
        displayForecast(forecastData);
        saveHistory(weatherData.name);
    }
    catch (error) {
        displayError(parseError(error));
    }
}
async function getWeatherDataByCoordinates(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('unable-to-fetch');
    }
    return response.json();
}
async function getForecastDataByCoordinates(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('forecast-error');
    }
    return response.json();
}
async function reverseGeocodeCoordinates(lat, lon) {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) {
        return null;
    }
    return data[0].name || null;
}
async function getWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(response.status === 404 ? 'city-not-found' : 'unable-to-fetch');
    }
    return response.json();
}
async function getForecastData(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('forecast-error');
    }
    return response.json();
}
function displayWeatherInfo(data) {
    const { name, sys: { country, sunrise, sunset }, weather: [{ description, id }], main: { temp, feels_like, humidity, pressure }, wind: { speed }, dt, } = data;
    card.dataset.city = name;
    card.innerHTML = `
    <div class="weather-details">
      <div class="weather-main">
        <h2>${name}, ${country}</h2>
        <p class="temp">${Math.round(temp)}°${unit === 'metric' ? 'C' : 'F'}</p>
        <p class="description">${description}</p>
        <p>Updated ${formatTime(dt, data.timezone)}</p>
      </div>
      <div class="weather-icon">${getWeatherEmoji(id)}</div>
    </div>
    <div class="weather-meta">
      <div class="meta-item"><strong>Feels like</strong>${Math.round(feels_like)}°${unit === 'metric' ? 'C' : 'F'}</div>
      <div class="meta-item"><strong>Humidity</strong>${humidity}%</div>
      <div class="meta-item"><strong>Wind</strong>${speed} ${unit === 'metric' ? 'm/s' : 'mph'}</div>
      <div class="meta-item"><strong>Pressure</strong>${pressure} hPa</div>
      <div class="meta-item"><strong>Sunrise</strong>${formatTimestamp(sunrise, data.timezone)}</div>
      <div class="meta-item"><strong>Sunset</strong>${formatTimestamp(sunset, data.timezone)}</div>
    </div>
  `;
    hideStatus();
    card.classList.remove('hidden');
    forecastSection.classList.remove('hidden');
    updateTheme(id);
}
function displayForecast(data) {
    const daily = data.list.reduce((acc, item) => {
        const date = item.dt_txt.split(' ')[0];
        if (!acc[date] || item.dt_txt.includes('12:00:00')) {
            acc[date] = item;
        }
        return acc;
    }, {});
    const days = Object.keys(daily).slice(0, 5);
    forecastGrid.innerHTML = days
        .map(date => {
        const item = daily[date];
        const { temp } = item.main;
        const [{ id, description }] = item.weather;
        return `
        <article class="forecast-card">
          <span class="day">${formatDay(date)}</span>
          <span class="forecast-icon">${getWeatherEmoji(id)}</span>
          <span>${description}</span>
          <span class="forecast-temp">${Math.round(temp)}°${unit === 'metric' ? 'C' : 'F'}</span>
        </article>
      `;
    })
        .join('');
}
function saveHistory(city) {
    const normalized = city.trim();
    if (!normalized)
        return;
    historyCities = [normalized, ...historyCities.filter(item => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
    localStorage.setItem('weatherHistory', JSON.stringify(historyCities));
    loadHistory();
}
function loadHistory() {
    historyList.innerHTML = historyCities.length
        ? historyCities
            .map(city => `<li><button type="button" data-city="${city}">${city}</button></li>`)
            .join('')
        : '<li class="empty">No recent cities yet. Search one to start.</li>';
}
function displayError(message) {
    hideStatus();
    forecastSection.classList.add('hidden');
    card.classList.remove('hidden');
    card.innerHTML = `<p class="errorDisplay">${message}</p>`;
}
function displayWelcome() {
    hideStatus();
    forecastSection.classList.add('hidden');
    card.classList.remove('hidden');
    card.innerHTML = `<p class="welcome">Search a city or use current location to see the latest weather instantly.</p>`;
}
function showStatus(message) {
    statusArea.querySelector('span').textContent = message;
    statusArea.classList.remove('hidden');
    card.classList.add('hidden');
    forecastSection.classList.add('hidden');
}
function hideStatus() {
    statusArea.classList.add('hidden');
}
function formatTimestamp(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function formatTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleString([], {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
    });
}
function formatDay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short' });
}
function getWeatherEmoji(weatherId) {
    if (weatherId >= 200 && weatherId < 300)
        return '⛈️';
    if (weatherId >= 300 && weatherId < 600)
        return '🌧️';
    if (weatherId >= 600 && weatherId < 700)
        return '❄️';
    if (weatherId >= 700 && weatherId < 800)
        return '🌫️';
    if (weatherId === 800)
        return '☀️';
    if (weatherId >= 801 && weatherId < 900)
        return '☁️';
    return '🌈';
}
function updateTheme(weatherId) {
    if (weatherId >= 200 && weatherId < 300) {
        document.body.dataset.theme = 'storm';
    }
    else if (weatherId >= 300 && weatherId < 600) {
        document.body.dataset.theme = 'rain';
    }
    else if (weatherId >= 600 && weatherId < 700) {
        document.body.dataset.theme = 'snow';
    }
    else if (weatherId === 800) {
        document.body.dataset.theme = 'clear';
    }
    else if (weatherId > 800) {
        document.body.dataset.theme = 'clouds';
    }
    else {
        document.body.dataset.theme = 'mist';
    }
}
function parseError(error) {
    if (error.message === 'city-not-found') {
        return 'City not found. Please check the spelling and try again.';
    }
    return 'An error occurred while fetching weather data. Please try again.';
}
initialize();
