import requests
import pandas as pd

cities = {
    "Chennai": (13.0827, 80.2707),
    "Bangalore": (12.9716, 77.5946),
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Hyderabad": (17.3850, 78.4867),
    "Kolkata": (22.5726, 88.3639)
}

start_date = "2026-07-01"
end_date = "2026-07-30"

all_weather_data = []

url = "https://archive-api.open-meteo.com/v1/archive"

for city, coordinates in cities.items():

    latitude = coordinates[0]
    longitude = coordinates[1]

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m,pressure_msl,precipitation,wind_speed_10m",
        "timezone": "auto"
    }

    response = requests.get(url, params=params)

    if response.status_code == 200:

        data = response.json()

        hourly = data["hourly"]

        df_city = pd.DataFrame({
            "city": city,
            "date": hourly["time"],
            "temperature": hourly["temperature_2m"],
            "humidity": hourly["relative_humidity_2m"],
            "pressure": hourly["pressure_msl"],
            "precipitation": hourly["precipitation"],
            "wind_speed": hourly["wind_speed_10m"]
        })

        all_weather_data.append(df_city)

        print(f"Collected data for {city}")

    else:
        print(f"Failed to collect data for {city}")
        print(response.text)


df = pd.concat(all_weather_data, ignore_index=True)

df["date"] = pd.to_datetime(df["date"])

df.to_csv("../dataset/historical_weather.csv", index=False)

print("\nHistorical weather data collection completed!")
print("Dataset shape:", df.shape)
print(df.head())