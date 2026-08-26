import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://weather-data-analytics.onrender.com";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import "./App.css";

function App() {
  const [weather, setWeather] = useState([]);
  const [city, setCity] = useState("Chennai");
  const [summary, setSummary] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [liveWeather, setLiveWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [predictionInput, setPredictionInput] = useState({
    humidity: 60,
    pressure: 1005,
    precipitation: 0,
    wind_speed: 12
  });

  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  // =========================
  // LIVE WEATHER
  // =========================

  useEffect(() => {
    const getLiveWeather = () => {
      setLoading(true);
      setError("");

        axios.get(`${API_URL}/api/live-weather/${city}`)

        .then((response) => {
          setLiveWeather(response.data);
          setLastUpdated(
            new Date().toLocaleString()
          );
        })
        .catch((error) => {
          console.error(error);
          setError(
            "Unable to load live weather."
          );
        })
        .finally(() => {
          setLoading(false);
        });
    };

    getLiveWeather();

    // Refresh every 5 minutes
    const interval = setInterval(
      getLiveWeather,
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [city]);

  // =========================
  // HISTORICAL WEATHER
  // =========================

  useEffect(() => {
      axios.get(`${API_URL}/api/weather/${city}`)
      .then((response) => {
        setWeather(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [city]);

  // =========================
  // SUMMARY DATA
  // =========================

  useEffect(() => {
     axios.get(`${API_URL}/api/summary`)

      .then((response) => {
        setSummary(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // =========================
  // DATE FILTER
  // =========================

  const filteredWeather =
    startDate &&
    endDate &&
    startDate > endDate
      ? []
      : weather
          .filter((item) => {
            const date = new Date(item.date);

            const start = startDate
              ? new Date(
                  startDate + "T00:00:00"
                )
              : null;

            const end = endDate
              ? new Date(
                  endDate + "T23:59:59"
                )
              : null;

            if (start && date < start)
              return false;

            if (end && date > end)
              return false;

            return true;
          })
          .sort(
            (a, b) =>
              new Date(a.date) -
              new Date(b.date)
          );

  // =========================
  // CLEAR DATE FILTER
  // =========================

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // =========================
  // CITY INSIGHTS
  // =========================

  const hottest =
    summary.length > 0
      ? summary.reduce((a, b) =>
          a.avg_temperature >
          b.avg_temperature
            ? a
            : b
        )
      : null;

  const mostHumid =
    summary.length > 0
      ? summary.reduce((a, b) =>
          a.avg_humidity >
          b.avg_humidity
            ? a
            : b
        )
      : null;

  const rainiest =
    summary.length > 0
      ? summary.reduce((a, b) =>
          a.total_rain >
          b.total_rain
            ? a
            : b
        )
      : null;

  const windiest =
    summary.length > 0
      ? summary.reduce((a, b) =>
          a.avg_wind >
          b.avg_wind
            ? a
            : b
        )
      : null;

  // =========================
  // MANUAL LIVE REFRESH
  // =========================

  const refreshWeather = () => {
    setLoading(true);
    setError("");

    axios
      .get(
        `${API_URL}/api/live-weather/${city}`
      )
      .then((response) => {
        setLiveWeather(response.data);
        setLastUpdated(
          new Date().toLocaleString()
        );
      })
      .catch((error) => {
        console.error(error);
        setError(
          "Unable to load live weather data."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // =========================
  // ML PREDICTION
  // =========================

  const predictTemperature = () => {
    setPredictionLoading(true);

    axios
      .post(
        `${API_URL}/api/predict`,
        predictionInput
      )
      .then((response) => {
        setPrediction(
          response.data
            .predicted_temperature
        );
      })
      .catch((error) => {
        console.error(error);
        alert("Prediction failed");
      })
      .finally(() => {
        setPredictionLoading(false);
      });
  };

  return (

  
    <div className={`dashboard ${darkMode ? "dark-mode" : ""}`}>
      
      {/* =========================
          NAVIGATION
      ========================= */}

      <nav className="navbar">

        <a href="#overview">
          🏠 Overview
        </a>

        <a href="#analytics">
          📊 Analytics
        </a>

        <a href="#prediction">
          🤖 Prediction
        </a>

        <a href="#historical">
          📋 Historical Data
        </a>
        <button
    className="theme-button"
    onClick={() => setDarkMode(!darkMode)}
  >
    {darkMode ? "☀️ Light" : "🌙 Dark"}
  </button>

      </nav>

      {/* =========================
          HEADER
      ========================= */}

      <h1>
        🌦️ Weather Analytics Dashboard
      </h1>

      <p>
        Explore weather patterns across
        major Indian cities
      </p>

      

      {/* =========================
          CITY SELECTION
      ========================= */}

      <select
        value={city}
        onChange={(e) => {
          setCity(e.target.value);
          clearDates();
        }}
      >
        <option value="Chennai">
          Chennai
        </option>

        <option value="Bangalore">
          Bangalore
        </option>

        <option value="Delhi">
          Delhi
        </option>

        <option value="Hyderabad">
          Hyderabad
        </option>

        <option value="Kolkata">
          Kolkata
        </option>

        <option value="Mumbai">
          Mumbai
        </option>
      </select>

      {/* =========================
          REFRESH BUTTON
      ========================= */}

      <button
        className="refresh-btn"
        onClick={refreshWeather}
      >
        🔄 Refresh Weather
      </button>

      {/* =========================
          DATE FILTER
      ========================= */}

      <div className="date-filter">

        <div>
          <label>
            Start Date
          </label>

          <input
            type="date"
            value={startDate}
            min="2026-07-01"
            max={
              endDate ||
              "2026-07-30"
            }
            onChange={(e) =>
              setStartDate(
                e.target.value
              )
            }
          />
        </div>

        <div>
          <label>
            End Date
          </label>

          <input
            type="date"
            value={endDate}
            min={
              startDate ||
              "2026-07-01"
            }
            max="2026-07-30"
            onChange={(e) =>
              setEndDate(
                e.target.value
              )
            }
          />
        </div>

        <button onClick={clearDates}>
          Clear
        </button>

      </div>

      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div className="status-message">
          Loading live weather...
        </div>
      )}

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* =========================
          OVERVIEW / LIVE WEATHER
      ========================= */}

      <div id="overview">

        <h2>
          🔴 Live Weather — {city}
        </h2>

        {liveWeather && (
          <>
            <div className="cards">

              <div className="card">
                <h3>
                  🌡️ Current Temperature
                </h3>

                <p>
                  {liveWeather.temperature} °C
                </p>
              </div>

              <div className="card">
                <h3>
                  💧 Current Humidity
                </h3>

                <p>
                  {liveWeather.humidity} %
                </p>
              </div>

              <div className="card">
                <h3>
                  💨 Current Wind Speed
                </h3>

                <p>
                  {liveWeather.wind_speed} km/h
                </p>
              </div>

              <div className="card">
                <h3>
                  🌧️ Current Rain
                </h3>

                <p>
                  {liveWeather.rain} mm
                </p>
              </div>

              <div className="card">
                <h3>
                  🌤️ Current Condition
                </h3>

                <p>
                  {liveWeather.weather}
                </p>
              </div>

            </div>
            
            <div className="current-condition">

  <h3>
    🌤️ Current Condition
  </h3>

  <div className="condition">
    {liveWeather.weather}
  </div>

  <p>
    🕐 Last updated: {liveWeather.updated_at}
  </p>

</div>
          </>
        )}

      </div>

      {/* =========================
          ANALYTICS
      ========================= */}

      <div id="analytics">

        <h2>
          📊 Historical Weather Analytics
        </h2>

        {/* No data */}

        {filteredWeather.length === 0 && (
          <div className="chart-box">

            <h2>
              No weather data found
            </h2>

            <p>
              Please select another
              date range.
            </p>

          </div>
        )}

        {/* Temperature Trend */}

        {filteredWeather.length > 0 && (
          <div className="chart-box">

            <h2>
              Temperature Trend
            </h2>

            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart
                data={filteredWeather}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="date"
                  hide
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature °C"
                  dot={false}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        )}

        {/* Humidity Trend */}

        {filteredWeather.length > 0 && (
          <div className="chart-box">

            <h2>
              Humidity Trend
            </h2>

            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart
                data={filteredWeather}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="date"
                  hide
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity %"
                  dot={false}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        )}

        {/* Average Temperature */}

        <div className="chart-box">

          <h2>
            Average Temperature by City
          </h2>

          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart data={summary}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="city" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="avg_temperature"
                name="Average Temperature °C"
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* Average Humidity */}

        <div className="chart-box">

          <h2>
            Average Humidity by City
          </h2>

          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart data={summary}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="city" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="avg_humidity"
                name="Average Humidity %"
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* Average Wind */}

        <div className="chart-box">

          <h2>
            Average Wind Speed by City
          </h2>

          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart data={summary}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="city" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="avg_wind"
                name="Average Wind Speed km/h"
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* Total Rain */}

        <div className="chart-box">

          <h2>
            Total Precipitation by City
          </h2>

          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <BarChart data={summary}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="city" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="total_rain"
                name="Total Rainfall mm"
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* City Insights */}

        {summary.length > 0 && (
          <div className="insight-cards">

            <div className="insight-card">

              <h3>
                🔥 Hottest City
              </h3>

              <p>
                {hottest.city}
              </p>

              <span>
                {hottest.avg_temperature} °C
              </span>

            </div>

            <div className="insight-card">

              <h3>
                💧 Most Humid
              </h3>

              <p>
                {mostHumid.city}
              </p>

              <span>
                {mostHumid.avg_humidity} %
              </span>

            </div>

            <div className="insight-card">

              <h3>
                🌧️ Rainiest City
              </h3>

              <p>
                {rainiest.city}
              </p>

              <span>
                {rainiest.total_rain} mm
              </span>

            </div>

            <div className="insight-card">

              <h3>
                💨 Windiest City
              </h3>

              <p>
                {windiest.city}
              </p>

              <span>
                {windiest.avg_wind} km/h
              </span>

            </div>

          </div>
        )}

      </div>

      {/* =========================
          ML PREDICTION
      ========================= */}

      <div
        className="prediction-box"
        id="prediction"
      >

        <h2>
          🤖 Temperature Prediction
        </h2>

        <p>
          Enter weather conditions to
          predict temperature.
        </p>

        <div className="prediction-inputs">

          <div>
            <label>
              Humidity (%)
            </label>

            <input
              type="number"
              value={
                predictionInput.humidity
              }
              onChange={(e) =>
                setPredictionInput({
                  ...predictionInput,
                  humidity:
                    Number(e.target.value)
                })
              }
            />
          </div>

          <div>
            <label>
              Pressure (hPa)
            </label>

            <input
              type="number"
              value={
                predictionInput.pressure
              }
              onChange={(e) =>
                setPredictionInput({
                  ...predictionInput,
                  pressure:
                    Number(e.target.value)
                })
              }
            />
          </div>

          <div>
            <label>
              Precipitation (mm)
            </label>

            <input
              type="number"
              step="0.1"
              value={
                predictionInput.precipitation
              }
              onChange={(e) =>
                setPredictionInput({
                  ...predictionInput,
                  precipitation:
                    Number(e.target.value)
                })
              }
            />
          </div>

          <div>
            <label>
              Wind Speed (km/h)
            </label>

            <input
              type="number"
              step="0.1"
              value={
                predictionInput.wind_speed
              }
              onChange={(e) =>
                setPredictionInput({
                  ...predictionInput,
                  wind_speed:
                    Number(e.target.value)
                })
              }
            />
          </div>

        </div>

        <button
          className="predict-button"
          onClick={predictTemperature}
          disabled={predictionLoading}
        >
          {predictionLoading
            ? "Predicting..."
            : "Predict Temperature"}
        </button>

        {prediction !== null && (
          <div className="prediction-result">

            <h3>
              Predicted Temperature
            </h3>

            <p>
              {prediction} °C
            </p>

          </div>
        )}

      </div>

      {/* =========================
          HISTORICAL DATA
      ========================= */}

      <div id="historical">

        <h2>
          📋 {city} Historical Weather Data
        </h2>

        <table>

          <thead>

            <tr>
              <th>Date</th>
              <th>Temperature</th>
              <th>Humidity</th>
              <th>Pressure</th>
              <th>Rain</th>
              <th>Wind</th>
            </tr>

          </thead>

          <tbody>

            {filteredWeather
              .slice(0, 20)
              .map((item, index) => (

                <tr key={index}>

                  <td>
                    {item.date}
                  </td>

                  <td>
                    {item.temperature} °C
                  </td>

                  <td>
                    {item.humidity} %
                  </td>

                  <td>
                    {item.pressure} hPa
                  </td>

                  <td>
                    {item.precipitation} mm
                  </td>

                  <td>
                    {item.wind_speed} km/h
                  </td>

                </tr>

              ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default App;