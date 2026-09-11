const apiKey = "dcd8a920e81fdf39e07e80bb719fe6ee";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const weatherIcon = code =>
    `https://openweathermap.org/img/wn/${code}@2x.png`;

function getDateTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);

    return {
        date: date.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC"
        }),
        time: date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC"
        })
    };
}

function getDay(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);

    return date.toLocaleDateString("en-IN", {
        weekday: "short",
        timeZone: "UTC"
    });
}

function getHour(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);

    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        hour12: true,
        timeZone: "UTC"
    });
}

async function getWeather(city) {

    try {

        const currentURL =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const forecastURL =
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const currentResponse = await fetch(currentURL);

        if (!currentResponse.ok) {
            if (currentResponse.status === 401)
                throw new Error("API key is not active yet.");
            if (currentResponse.status === 404)
                throw new Error("City not found.");
            throw new Error("Unable to get weather data.");
        }

        const current = await currentResponse.json();

        const forecastResponse = await fetch(forecastURL);

        if (!forecastResponse.ok)
            throw new Error("Forecast data unavailable.");

        const forecast = await forecastResponse.json();

        /* Current weather */

        document.getElementById("city").textContent =
            `${current.name}, ${current.sys.country}`;

        const dateTime = getDateTime(
            current.dt,
            current.timezone
        );

        document.getElementById("date").textContent =
            dateTime.date;

        document.getElementById("time").textContent =
            dateTime.time;

        document.getElementById("temperature").textContent =
            `${Math.round(current.main.temp)}°`;

        document.getElementById("feelsLike").textContent =
            `${Math.round(current.main.feels_like)}°`;

        document.getElementById("condition").textContent =
            current.weather[0].description;

        document.getElementById("weatherIcon").src =
            weatherIcon(current.weather[0].icon);

        document.getElementById("humidity").textContent =
            `${current.main.humidity}%`;

        document.getElementById("wind").textContent =
            `${Math.round(current.wind.speed * 3.6)} km/h`;

        /* Hourly */

        const hourly = document.getElementById("hourlyForecast");

        hourly.innerHTML = "";

        forecast.list.slice(0, 6).forEach((item, index) => {

            const time =
                index === 0
                    ? "Now"
                    : getHour(item.dt, forecast.city.timezone);

            hourly.innerHTML += `
                <div class="hour">
                    <span>${time}</span>
                    <img src="${weatherIcon(item.weather[0].icon)}">
                    <strong>${Math.round(item.main.temp)}°</strong>
                    <span>${Math.round(item.pop * 100)}% rain</span>
                </div>
            `;
        });

        /* Precipitation */

        const rainChance =
            Math.round(forecast.list[0].pop * 100);

        document.getElementById("precipitation").textContent =
            `${rainChance}%`;

        /* Daily forecast */

        const daily = document.getElementById("dailyForecast");

        daily.innerHTML = "";

        const days = {};

        forecast.list.forEach(item => {

            const day = getDay(
                item.dt,
                forecast.city.timezone
            );

            if (!days[day]) {
                days[day] = item;
            }

        });

        Object.values(days).slice(0, 5).forEach(item => {

            const day = getDay(
                item.dt,
                forecast.city.timezone
            );

            daily.innerHTML += `
                <div class="day">
                    <span>${day}</span>

                    <img src="${weatherIcon(item.weather[0].icon)}">

                    <strong>
                        ${Math.round(item.main.temp_max || item.main.temp)}°
                    </strong>

                    <small>
                        ${Math.round(item.main.temp_min || item.main.temp)}°
                    </small>
                </div>
            `;
        });

        /* Air Quality */

        await getAirQuality(
            current.coord.lat,
            current.coord.lon
        );

    } catch (error) {

        alert(error.message);
        console.error(error);

    }
}


async function getAirQuality(lat, lon) {

    const url =
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {

        const response = await fetch(url);

        if (!response.ok)
            throw new Error("Air quality unavailable.");

        const data = await response.json();

        const aqi = data.list[0].main.aqi;

        const levels = {
            1: "Good",
            2: "Fair",
            3: "Moderate",
            4: "Poor",
            5: "Very Poor"
        };

        document.getElementById("airQuality").textContent =
            `${levels[aqi]} (${aqi}/5)`;

    } catch (error) {

        document.getElementById("airQuality").textContent =
            "Unavailable";

    }
}


/* Search */

searchBtn.addEventListener("click", () => {

    const city = cityInput.value.trim();

    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    getWeather(city);
});


/* Enter key */

cityInput.addEventListener("keypress", event => {

    if (event.key === "Enter") {
        searchBtn.click();
    }

});


/* Default city */

getWeather("Kolkata");