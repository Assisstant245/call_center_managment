import pandas as pd
import math
import requests


# ============================================================
# 1. FILE PATHS
# ============================================================

call_history_path = "data/Call_History.csv"
forecast_path = "forecast_output.csv"
output_path = "staffing_output.csv"


# ============================================================
# 2. READ DATA
# ============================================================

history_df = pd.read_csv(call_history_path)
forecast_df = pd.read_csv(forecast_path)


print("Call history loaded:")
print(history_df.head())

print("\nForecast loaded:")
print(forecast_df.head())


# ============================================================
# 3. CONVERT DATE/TIME
# ============================================================

history_df["interval_start"] = pd.to_datetime(
    history_df["interval_start"]
)

forecast_df["interval_start"] = pd.to_datetime(
    forecast_df["interval_start"]
)


# ============================================================
# 4. REQUIRED COLUMNS CHECK
# ============================================================

required_history_columns = [
    "skill",
    "channel",
    "average_handle_time_sec"
]

required_forecast_columns = [
    "interval_start",
    "skill",
    "channel",
    "forecast_calls"
]


missing_history_columns = [
    column
    for column in required_history_columns
    if column not in history_df.columns
]


missing_forecast_columns = [
    column
    for column in required_forecast_columns
    if column not in forecast_df.columns
]


if missing_history_columns:
    raise ValueError(
        f"Missing columns in Call_History.csv: "
        f"{missing_history_columns}"
    )


if missing_forecast_columns:
    raise ValueError(
        f"Missing columns in forecast_output.csv: "
        f"{missing_forecast_columns}"
    )


# ============================================================
# 5. CALCULATE AHT FOR EVERY SKILL + CHANNEL
# ============================================================

aht_df = (
    history_df
    .groupby(
        ["skill", "channel"],
        as_index=False
    )["average_handle_time_sec"]
    .mean()
)


aht_df = aht_df.rename(
    columns={
        "average_handle_time_sec": "aht_sec"
    }
)


print("\n========================================")
print("HISTORICAL AHT BY SKILL + CHANNEL")
print("========================================")

print(
    aht_df.to_string(index=False)
)


# ============================================================
# 6. MATCH FORECAST WITH HISTORICAL AHT
# ============================================================

staffing_df = forecast_df.merge(
    aht_df,
    on=["skill", "channel"],
    how="left"
)


# ============================================================
# 7. CHECK IF ANY AHT IS MISSING
# ============================================================

missing_aht = staffing_df[
    staffing_df["aht_sec"].isna()
]


if not missing_aht.empty:

    missing_combinations = (
        missing_aht[
            ["skill", "channel"]
        ]
        .drop_duplicates()
    )

    raise ValueError(
        "AHT not found for these skill/channel combinations:\n"
        f"{missing_combinations.to_string(index=False)}"
    )


# ============================================================
# 8. INTERVAL LENGTH
# ============================================================

# Forecast is generated in 30-minute intervals.
interval_seconds = 30 * 60


# ============================================================
# 9. CALCULATE WORKLOAD
# ============================================================

staffing_df["workload_seconds"] = (
    staffing_df["forecast_calls"]
    * staffing_df["aht_sec"]
)


# ============================================================
# 10. CALCULATE RAW AGENTS
# ============================================================

staffing_df["raw_agents"] = (
    staffing_df["workload_seconds"]
    / interval_seconds
)


# ============================================================
# 11. ROUND UP REQUIRED AGENTS
# ============================================================

staffing_df["required_agents"] = (
    staffing_df["raw_agents"]
    .apply(math.ceil)
)


# ============================================================
# 12. SELECT OUTPUT COLUMNS
# ============================================================

staffing_df = staffing_df[
    [
        "interval_start",
        "skill",
        "channel",
        "forecast_calls",
        "forecast_lower",
        "forecast_upper",
        "aht_sec",
        "workload_seconds",
        "raw_agents",
        "required_agents"
    ]
]

# ============================================================
# 13. SORT RESULT
# ============================================================

staffing_df = staffing_df.sort_values(
    [
        "interval_start",
        "skill",
        "channel"
    ]
)


# ============================================================
# 14. ROUND DECIMAL VALUES
# ============================================================

staffing_df["forecast_calls"] = (
    staffing_df["forecast_calls"]
    .round(2)
)

staffing_df["forecast_lower"] = (
    staffing_df["forecast_lower"]
    .round(2)
)

staffing_df["forecast_upper"] = (
    staffing_df["forecast_upper"]
    .round(2)
)

staffing_df["aht_sec"] = (
    staffing_df["aht_sec"]
    .round(2)
)

staffing_df["workload_seconds"] = (
    staffing_df["workload_seconds"]
    .round(2)
)

staffing_df["raw_agents"] = (
    staffing_df["raw_agents"]
    .round(2)
)

# ============================================================
# 15. SAVE STAFFING OUTPUT
# ============================================================

staffing_df.to_csv(
    output_path,
    index=False
)


# ============================================================
# 16. DISPLAY RESULT
# ============================================================

print("\n========================================")
print("STAFFING CALCULATION COMPLETED")
print("========================================")

print(
    staffing_df.to_string(index=False)
)


print("\n========================================")
print("FILE SAVED")
print("========================================")

print(
    f"Staffing file: {output_path}"
)

print(
    f"Total staffing records: {len(staffing_df)}"
)
# ============================================================
# 17. SEND STAFFING DATA TO BACKEND
# ============================================================



# ============================================================
# 17. SEND FORECAST + STAFFING DATA TO BACKEND
# ============================================================

FORECAST_BACKEND_URL = (
    "http://localhost:3000/forecast"
)

SCHEDULE_BACKEND_URL = (
    "http://localhost:3000/agent-schedule/generate"
)


for _, row in staffing_df.iterrows():

    # ========================================================
    # A. FORECAST DATA
    # ========================================================

    forecast_payload = {
        "intervalStart": row["interval_start"].isoformat(),

        "intervalEnd": (
            row["interval_start"]
            + pd.Timedelta(minutes=30)
        ).isoformat(),

        "skill": row["skill"],

        "channel": row["channel"],

        "forecastCalls": float(
            row["forecast_calls"]
        ),

        "forecastLower": float(
            row["forecast_lower"]
        ),

        "forecastUpper": float(
            row["forecast_upper"]
        ),

        "requiredAgents": int(
            row["required_agents"]
        )
    }


    print("\n========================================")
    print("SENDING FORECAST DATA")
    print("========================================")

    print(forecast_payload)


    try:

        forecast_response = requests.post(
            FORECAST_BACKEND_URL,
            json=forecast_payload
        )

        print(
            "Forecast backend response:",
            forecast_response.status_code
        )

        print(
            forecast_response.text
        )


    except requests.exceptions.RequestException as error:

        print(
            "Forecast backend connection error:",
            error
        )


    # ========================================================
    # B. AGENT SCHEDULE DATA
    # ========================================================

    schedule_payload = {

        "intervalStart": (
            row["interval_start"].isoformat()
        ),

        "skill": row["skill"],

        "channel": row["channel"],

        "requiredAgents": int(
            row["required_agents"]
        )
    }


    print("\n========================================")
    print("SENDING STAFFING DATA")
    print("========================================")

    print(schedule_payload)


    try:

        schedule_response = requests.post(
            SCHEDULE_BACKEND_URL,
            json=schedule_payload
        )

        print(
            "Schedule backend response:",
            schedule_response.status_code
        )

        print(
            schedule_response.text
        )


    except requests.exceptions.RequestException as error:

        print(
            "Schedule backend connection error:",
            error
        )