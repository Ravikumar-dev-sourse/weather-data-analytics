import requests
import os
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

API_KEY = os.getenv("WEATHER_API_KEY")

cities = [
    "Chennai",
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Kolkata"
]

weather_data = []

url = "https://api.openweathermap.org/data/2.5/weather"

for city in cities:

    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }

    response = requests.get(url, params=params)

    if response.status_code == 200:

        data = response.json()

        weather = {
            "city": data["name"],
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "temperature": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "wind_speed": data["wind"]["speed"],
            "weather": data["weather"][0]["description"],
            "latitude": data["coord"]["lat"],
            "longitude": data["coord"]["lon"]
        }

        weather_data.append(weather)

        print(f"Collected data for {city}")

    else:
        print(f"Failed to collect data for {city}")
        print(response.json())


df = pd.DataFrame(weather_data)

df.to_csv("../dataset/weather_data.csv", index=False)

print("\nWeather data collection completed!")
print(df)