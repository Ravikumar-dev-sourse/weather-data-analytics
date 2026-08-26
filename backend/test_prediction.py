import requests

data = {
    "humidity": 60,
    "pressure": 1005,
    "precipitation": 0,
    "wind_speed": 12
}

response = requests.post(
    "http://127.0.0.1:5000/api/predict",
    json=data
)

print(response.json())