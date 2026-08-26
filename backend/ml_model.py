from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import pandas as pd
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Get MongoDB connection string
MONGO_URI = os.getenv("MONGODB_URI")

if not MONGO_URI:
    print("ERROR: MONGO_URI not found in .env")
    exit()

print("MongoDB URI loaded:", True)

# MongoDB connection
client = MongoClient(MONGO_URI)

# Test connection
client.admin.command("ping")

print("MongoDB connection successful!")

# Database and collection
db = client["weather_database"]
collection = db["weather"]

# Get weather data
data = list(
    collection.find(
        {},
        {"_id": 0}
    )
)

print("Total records:", len(data))

# Convert to DataFrame
df = pd.DataFrame(data)

# Required columns
features = [
    "humidity",
    "pressure",
    "precipitation",
    "wind_speed"
]

X = df[features]
y = df["temperature"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Random Forest model
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

# Train
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)

# Evaluation
mae = mean_absolute_error(
    y_test,
    predictions
)

r2 = r2_score(
    y_test,
    predictions
)

print("MAE:", round(mae, 2))
print("R2 Score:", round(r2, 2))

# Save model
joblib.dump(
    model,
    "weather_model.pkl"
)

print("Model saved successfully!")