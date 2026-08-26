import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("WEATHER_API_KEY")

city = "Chennai"

url = "https://api.openweathermap.org/data/2.5/weather"

params = {
    "q": city,
    "appid": API_KEY,
    "units": "metric"
}

response = requests.get(url, params=params)

print("Status code:", response.status_code)

if response.status_code == 200:
    data = response.json()

    print("City:", data["name"])
    print("Temperature:", data["main"]["temp"], "°C")
    print("Humidity:", data["main"]["humidity"], "%")
    print("Weather:", data["weather"][0]["description"])
    print("Wind speed:", data["wind"]["speed"], "m/s")

else:
    print("Error:", response.json())