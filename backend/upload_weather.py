import pandas as pd
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Load CSV
df = pd.read_csv("C:/Users/ELCOT/Documents/excel for data analytics/weather_data_project/dataset/historical_weather.csv")

# Convert date
df["date"] = pd.to_datetime(df["date"])

# Convert DataFrame to MongoDB records
records = df.to_dict("records")

# Connect MongoDB
client = MongoClient(os.getenv("MONGODB_URI"))

db = client["weather_database"]
collection = db["weather"]

# Clear old data if any
collection.delete_many({})

# Insert records
collection.insert_many(records)

print("Weather data uploaded successfully!")
print("Records inserted:", collection.count_documents({}))

client.close()