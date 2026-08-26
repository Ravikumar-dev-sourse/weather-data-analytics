from flask import Flask, jsonify, request
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

# ---------------- MongoDB ----------------

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    print("ERROR: MONGODB_URI is not set")

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000
)

db = client["weather_database"]
collection = db["weather"]

# Test MongoDB connection
try:
    client.admin.command("ping")
    print("MongoDB connected successfully")
except Exception as e:
    print("MongoDB connection error:", e)


# ---------------- ML Model ----------------

model = joblib.load("weather_model.pkl")


# ---------------- Home ----------------

@app.route("/")
def home():
    return jsonify({
        "message": "Weather API is running"
    })


# ---------------- Weather ----------------

@app.route("/api/weather")
def weather():

    try:
        data = list(
            collection.find(
                {},
                {"_id": 0}
            ).limit(100)
        )

        return jsonify(data)

    except Exception as e:
        print("Weather error:", e)

        return jsonify({
            "error": "MongoDB weather data error",
            "details": str(e)
        }), 500


# ---------------- Cities ----------------

@app.route("/api/cities")
def cities():

    try:
        cities = collection.distinct("city")

        return jsonify(cities)

    except Exception as e:
        print("Cities error:", e)

        return jsonify({
            "error": "Unable to get cities",
            "details": str(e)
        }), 500


# ---------------- City Weather ----------------

@app.route("/api/weather/<city>")
def city_weather(city):

    try:

        start = request.args.get("start")
        end = request.args.get("end")

        query = {
            "city": city
        }

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

    except Exception as e:

        print("City weather error:", e)

        return jsonify({
            "error": "Unable to get city weather",
            "details": str(e)
        }), 500


# ---------------- Summary ----------------

@app.route("/api/summary")
def summary():

    try:

        pipeline = [
            {
                "$group": {
                    "_id": "$city",
                    "avg_temperature": {
                        "$avg": "$temperature"
                    },
                    "avg_humidity": {
                        "$avg": "$humidity"
                    },
                    "avg_wind": {
                        "$avg": "$wind_speed"
                    },
                    "total_rain": {
                        "$sum": "$precipitation"
                    }
                }
            }
        ]

        data = list(
            collection.aggregate(pipeline)
        )

        result = []

        for item in data:

            result.append({
                "city": item["_id"],
                "avg_temperature": round(
                    item.get("avg_temperature", 0), 2
                ),
                "avg_humidity": round(
                    item.get("avg_humidity", 0), 2
                ),
                "avg_wind": round(
                    item.get("avg_wind", 0), 2
                ),
                "total_rain": round(
                    item.get("total_rain", 0), 2
                )
            })

        return jsonify(result)

    except Exception as e:

        print("Summary error:", e)

        return jsonify({
            "error": "Unable to generate summary",
            "details": str(e)
        }), 500


# ---------------- Prediction ----------------

@app.route("/api/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        humidity = float(data["humidity"])
        pressure = float(data["pressure"])
        precipitation = float(data["precipitation"])
        wind_speed = float(data["wind_speed"])

        prediction = model.predict([
            [
                humidity,
                pressure,
                precipitation,
                wind_speed
            ]
        ])

        return jsonify({
            "predicted_temperature": round(
                float(prediction[0]), 2
            )
        })

    except Exception as e:

        print("Prediction error:", e)

        return jsonify({
            "error": "Prediction failed",
            "details": str(e)
        }), 500


# ---------------- Live Weather ----------------

@app.route("/api/live-weather/<city>")
def live_weather(city):

    try:

        api_key = os.getenv("OPENWEATHER_API_KEY")

        if not api_key:
            return jsonify({
                "error": "OPENWEATHER_API_KEY is not configured"
            }), 500

        url = "https://api.openweathermap.org/data/2.5/weather"

        params = {
            "q": city,
            "appid": api_key,
            "units": "metric"
        }

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        if response.status_code != 200:

            return jsonify({
                "error": "Unable to get live weather"
            }), response.status_code

        data = response.json()

        rain = data.get(
            "rain",
            {}
        ).get(
            "1h",
            0
        )

        return jsonify({

            "city": city,

            "temperature": data["main"]["temp"],

            "humidity": data["main"]["humidity"],

            "pressure": data["main"]["pressure"],

            "wind_speed": round(
                data["wind"]["speed"] * 3.6,
                2
            ),

            "rain": rain,

            "weather": data["weather"][0]["description"],

            "updated_at": datetime.now().strftime(
                "%d-%m-%Y %H:%M:%S"
            )
        })

    except Exception as e:

        print("Live weather error:", e)

        return jsonify({
            "error": "Live weather failed",
            "details": str(e)
        }), 500


# ---------------- Error Handler ----------------

@app.errorhandler(Exception)
def handle_error(e):

    print("SERVER ERROR:", e)

    return jsonify({
        "error": "Internal server error",
        "details": str(e)
    }), 500


# ---------------- Run ----------------

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )