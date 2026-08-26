from flask import Flask, jsonify,request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import joblib
import os
import requests
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["weather_database"]
collection = db["weather"]

model = joblib.load("weather_model.pkl")


@app.route("/")
def home():
    return jsonify({"message": "Weather API is running"})


@app.route("/api/weather")
def weather():
    data = list(collection.find({}, {"_id": 0}).limit(100))
    return jsonify(data)


@app.route("/api/cities")
def cities():
    cities = collection.distinct("city")
    return jsonify(cities)


@app.route("/api/weather/<city>")
def city_weather(city):

    start = request.args.get("start")
    end = request.args.get("end")

    query = {"city": city}

    if start and end:
        query["date"] = {
            "$gte": start,
            "$lte": end
        }

    data = list(
        collection.find(
            query,
            {"_id": 0}
        ).sort("date", 1)
    )

    return jsonify(data)
@app.route("/api/summary")
def summary():

    pipeline = [
        {
            "$group": {
                "_id": "$city",
                "avg_temperature": {"$avg": "$temperature"},
                "avg_humidity": {"$avg": "$humidity"},
                "avg_wind": {"$avg": "$wind_speed"},
                "total_rain": {"$sum": "$precipitation"}
            }
        }
    ]

    data = list(collection.aggregate(pipeline))

    result = []

    for item in data:
        result.append({
            "city": item["_id"],
            "avg_temperature": round(item["avg_temperature"], 2),
            "avg_humidity": round(item["avg_humidity"], 2),
            "avg_wind": round(item["avg_wind"], 2),
            "total_rain": round(item["total_rain"], 2)
        })

    return jsonify(result)

@app.route("/api/predict", methods=["POST"])
def predict():

    data = request.get_json()

    humidity = float(data["humidity"])
    pressure = float(data["pressure"])
    precipitation = float(data["precipitation"])
    wind_speed = float(data["wind_speed"])

    prediction = model.predict([[
        humidity,
        pressure,
        precipitation,
        wind_speed
    ]])

    return jsonify({
        "predicted_temperature": round(
            float(prediction[0]), 2
        )
    })
@app.route("/api/live-weather/<city>")
def live_weather(city):

    api_key = os.getenv("OPENWEATHER_API_KEY")

    url = "https://api.openweathermap.org/data/2.5/weather"

    params = {
        "q": city,
        "appid": api_key,
        "units": "metric"
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        return jsonify({
            "error": "Unable to get live weather"
        }), response.status_code

    data = response.json()

    rain = data.get("rain", {}).get("1h", 0)

    return jsonify({
    "city": city,
    "temperature": data["main"]["temp"],
    "humidity": data["main"]["humidity"],
    "pressure": data["main"]["pressure"],
    "wind_speed": round(data["wind"]["speed"] * 3.6, 2),
    "rain": rain,
    "weather": data["weather"][0]["description"],
    "updated_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
})


if __name__ == "__main__":
    app.run(debug=True)