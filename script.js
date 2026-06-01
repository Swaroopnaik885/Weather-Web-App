// Using GSAP for animations + Skiper-UI for modern UI components

// CONFIG

const API_KEY = "TGNZM24NDGJ8CPAFNSEX8W4J4";
const BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

// DOM ELEMENTS

const $ = (id) => document.getElementById(id);

const locationInput = $("locationInput");
const searchBtn = $("searchBtn");
const refreshBtn = $("refreshBtn");
const locationName = $("locationName");
const currentTemp = $("currentTemp");
const weatherIcon = $("weatherIcon");
const weatherCondition = $("weatherCondition");
const windSpeed = $("windSpeed");
const humidity = $("humidity");
const rainChance = $("rainChance");
const feelsLike = $("feelsLike");
const hourlyForecast = $("hourlyForecast");
const previousForecast = $("previousForecast");
const weeklyForecast = $("weeklyForecast");
const loadingState = $("loadingState");
const errorState = $("errorState");
const errorMessage = $("errorMessage");
const weatherBackground = $("weatherBackground");

// STATE

let currentLocation = null;
let lastData = null;

// LOADER

const showLoading = () => loadingState.classList.remove("hidden");
const hideLoading = () => loadingState.classList.add("hidden");

const showError = (msg) => {
  errorMessage.textContent = msg;
  errorState.classList.remove("hidden");
};

const hideError = () => errorState.classList.add("hidden");

// API CALL

async function fetchWeather(location) {
  try {
    showLoading();
    hideError();

    const url = `${BASE_URL}/${encodeURIComponent(location)}?unitGroup=metric&include=days,hours,current&key=${API_KEY}&contentType=json`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Failed to fetch weather");

    const data = await res.json();

    lastData = data;
    currentLocation = location;

    await renderAll(data);

  } catch (err) {
    showError(err.message || "Something went wrong");
  } finally {
    hideLoading();
  }
}

// ======================================================
// HELPERS
// ======================================================

function formatHour(time) {
  const [h] = time.split(":");
  const d = new Date();
  d.setHours(+h);
  return d.toLocaleTimeString([], { hour: "numeric" });
}

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function icon(condition = "") {
  condition = condition.toLowerCase();

  if (condition.includes("rain")) return "🌧️";
  if (condition.includes("cloud")) return "☁️";
  if (condition.includes("snow")) return "❄️";
  if (condition.includes("storm") || condition.includes("thunder")) return "⛈️";
  if (condition.includes("clear")) return "☀️";
  if (condition.includes("fog") || condition.includes("mist")) return "🌫️";

  return "🌤️";
}

// ======================================================
// CORE RENDER
// ======================================================

async function renderAll(data) {
  const current = data.currentConditions;

  locationName.textContent = data.resolvedAddress;
  currentTemp.textContent = `${Math.round(current.temp)}°`;
  weatherCondition.textContent = current.conditions;
  weatherIcon.textContent = icon(current.conditions);

  windSpeed.textContent = `${current.windspeed} km/h`;
  humidity.textContent = `${current.humidity}%`;
  rainChance.textContent = `${current.precipprob || 0}%`;
  feelsLike.textContent = `${Math.round(current.feelslike)}°`;

  // 🔥 IMPORTANT: dynamic background engine
  const image = getWeatherBackground(current.conditions);

  weatherBackground.style.backgroundImage = `url("${image}")`;

  renderHourly(data);
  renderPrevious(data);
  renderWeekly(data);
  animateEntrance();
  setupScrollAnimations();

  // Trigger a weather-specific on-screen effect after a short delay (depends on condition)
  try{
    const cond = current.conditions.toLowerCase();
    const delayMap = { storm: 500, thunder:500, rain: 1000, drizzle: 1000, snow: 1500, fog: 2000, mist:2000, haze:2000, clear: 2000, sun:2000 };
    let delay = 1200;
    for(const k in delayMap) if(cond.includes(k)) { delay = delayMap[k]; break; }
    if(window.motionHelpers && typeof window.motionHelpers.showWeatherEffect === 'function'){
      setTimeout(()=> window.motionHelpers.showWeatherEffect(cond, { duration: 4500 }), delay);
    }
  }catch(e){/* ignore */}
}

function getWeatherBackground(key) {
  key = key.toLowerCase();

  const map = [
    { match: ["clear", "sunny"], url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9" },
    { match: ["clear", "hazy"], url: "https://images.unsplash.com/photo-1527766833261-b09c3163a791" },
    { match: ["sunny", "hazy"], url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee" },
    { match: ["sunny", "wind"], url: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7" },
    { match: ["cloud", "overcast"], url: "https://images.unsplash.com/photo-1534088568595-a066f410bcda" },
    { match: ["cloud", "bright"], url: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63" },
    { match: ["cloud", "dark"], url: "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31" },
    { match: ["partly cloudy", "sun"], url: "https://images.unsplash.com/photo-1527766833261-b09c3163a791" },
    { match: ["rain", "light"], url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29" },
    { match: ["rain", "heavy"], url: "https://images.unsplash.com/photo-1527766833261-b09c3163a791" },
    { match: ["rain", "storm"], url: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63" },
    { match: ["rain", "city"], url: "https://images.unsplash.com/photo-1519692933481-e162a57d6721" },
    { match: ["storm", "lightning"], url: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7" },
    { match: ["thunder", "storm"], url: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28" },
    { match: ["storm", "dark"], url: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63" },
    { match: ["snow", "light"], url: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d" },
    { match: ["snow", "heavy"], url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09" },
    { match: ["snow", "city"], url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131" },
    { match: ["fog"], url: "https://images.unsplash.com/photo-1517816428104-15b5d92151d6" },
    { match: ["mist"], url: "https://images.unsplash.com/photo-1487621167305-5d248087c724" },
    { match: ["haze"], url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee" },
    { match: ["clear night"], url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb" },
    { match: ["rain night"], url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29" },
    { match: ["cloud night"], url: "https://images.unsplash.com/photo-1534088568595-a066f410bcda" },
    { match: ["sunny city"], url: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21" },
    { match: ["rain city"], url: "https://images.unsplash.com/photo-1519692933481-e162a57d6721" },
    { match: ["fog city"], url: "https://images.unsplash.com/photo-1487621167305-5d248087c724" },
    { match: ["default"], url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb" }
  ];

  const orderedMap = map
    .slice()
    .sort(
      (a, b) =>
        Math.max(...b.match.map((m) => m.length)) -
        Math.max(...a.match.map((m) => m.length))
    );

  for (const item of orderedMap) {
    if (item.match.some((m) => key.includes(m))) {
      return item.url;
    }
  }

  return map[map.length - 1].url;
}

// NEXT 24 HOURS (TRUE ROLLING)

function renderHourly(data) {
  hourlyForecast.innerHTML = "";

  const now = new Date().getHours();
  const today = data.days[0].hours;
  const tomorrow = data.days[1]?.hours || [];
  const merged = [...today, ...tomorrow];
  const next24 = merged.slice(now, now + 24);

  next24.forEach((h) => {
    hourlyForecast.innerHTML += `
      <div class="forecast-card" tabindex="0">
        <div class="time">${formatHour(h.datetime)}</div>
        <div class="icon">${icon(h.conditions)}</div>
        <div class="temp">${Math.round(h.temp)}°</div>
      </div>
    `;
  });
}

// PREVIOUS 24 HOURS (YESTERDAY + TODAY)

function renderPrevious(data) {
  previousForecast.innerHTML = "";

  const yesterday = data.days[0]?.hours || [];
  const reversed = [...yesterday].slice(-24).reverse();

  reversed.forEach((h) => {
    previousForecast.innerHTML += `
      <div class="forecast-card" tabindex="0">
        <div class="time">${formatHour(h.datetime)}</div>
        <div class="icon">${icon(h.conditions)}</div>
        <div class="temp">${Math.round(h.temp)}°</div>
      </div>
    `;
  });
}

// WEEK

function renderWeekly(data) {
  weeklyForecast.innerHTML = "";

  data.days.slice(0, 7).forEach((d) => {
    weeklyForecast.innerHTML += `
      <div class="week-card" tabindex="0">
        <h4>${formatDate(d.datetime)}</h4>
        <div style="font-size:22px">${icon(d.conditions)}</div>
        <h3>${Math.round(d.temp)}°</h3>
        <small>${d.conditions}</small>
      </div>
    `;
  });
}

// ANIMATION (Motion One)

function animateEntrance() {
  if (window.motionHelpers && typeof window.motionHelpers.animateOnRender === 'function') {
    window.motionHelpers.animateOnRender();
    return;
  }

  if (!window.gsap) return;

  try{
    gsap.from('.metric-card', { y: 20, scale: 0.985, duration: 0.45, stagger: 0.06, ease: 'power2.out' });
    gsap.from('.forecast-card', { scale: 0.95, y: 8, duration: 0.35, stagger: 0.05, ease: 'power2.out' });
    gsap.from('.week-card', { y: 22, scale: 0.992, duration: 0.55, stagger: 0.08, delay: 0.1, ease: 'power2.out' });
    gsap.to('#weatherIcon', { scale: 1.06, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }catch(e){ console.warn('animateEntrance error', e); }
}

// SCROLL-BASED ANIMATIONS (Motion One)

function setupScrollAnimations() {
  if (!window.gsap) return;

  const cards = document.querySelectorAll('.forecast-card, .week-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        try{
          gsap.from(entry.target, { scale: 0.9, y: 10, duration: 0.35, ease: 'power2.out' });
        }catch(e){}
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px"
  });

  cards.forEach((card) => {
    gsap.set(card, { scale: 0.9, y: 10 });
    observer.observe(card);
  });
}

// GEOLOCATION

function initLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`);
    },
    () => fetchWeather("Mumbai")
  );
}

// EVENTS

searchBtn.onclick = () => {
  if (locationInput.value.trim()) {
    fetchWeather(locationInput.value.trim());
  }
};

locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const query = locationInput.value.trim();
    if (!query) return;
    fetchWeather(query);
  }
});

refreshBtn.onclick = () => {
  if (currentLocation) fetchWeather(currentLocation);
};

// GRAB-AND-DRAG SCROLLING

function enableGrabScroll() {
  const scrollables = document.querySelectorAll('.forecast-scroll');

  scrollables.forEach((container) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.classList.add('grabbing');
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
      container.classList.remove('grabbing');
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
      container.classList.remove('grabbing');
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1; // 1 multiplier for realistic 1:1 scroll feel
      container.scrollLeft = scrollLeft - walk;
    });
  });
}

// initiation

window.onload = () => {
  enableGrabScroll();
  initLocation();

  // quick sanity animation test to verify gsap is available
  setTimeout(()=>{
    if(window.gsap){
      try{ gsap.from('.logo h1', { x: -40, duration: 0.8, ease: 'power2.out' }); }catch(e){}
    }
  }, 300);
};