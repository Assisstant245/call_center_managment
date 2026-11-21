import pandas as pd
from prophet import Prophet


# ==================================================
# 1. CSV FILE READ KARO
# ==================================================

file_path = "data/Call_History.csv"

df = pd.read_csv(file_path)

print("CSV data:")
print(df.head())


# ==================================================
# 2. DATE/TIME KO DATETIME MEIN CONVERT KARO
# ==================================================

df["interval_start"] = pd.to_datetime(
    df["interval_start"]
)

# ==================================================
# 3. REQUIRED COLUMNS CHECK KARO
# ==================================================

required_columns = [
    "interval_start",
    "skill",
    "channel",
    "calls_offered"
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing columns in CSV: {missing_columns}"
    )


# ==================================================
# 4. ALL SKILL + CHANNEL COMBINATIONS FIND KARO
# ==================================================

combinations = (
    df[
        ["skill", "channel"]
    ]
    .drop_duplicates()
    .sort_values(
        ["skill", "channel"]
    )
    .reset_index(drop=True)
)


print("\n========================================")
print("SKILL + CHANNEL COMBINATIONS")
print("========================================")

print(combinations.to_string(index=False))

print(
    "\nTotal combinations:",
    len(combinations)
)


# ==================================================
# 5. RESULT LISTS
# ==================================================

all_forecasts = []

accuracy_results = []


# ==================================================
# 6. HAR SKILL + CHANNEL KE LIYE MODEL
# ==================================================

for _, combination in combinations.iterrows():

    skill = combination["skill"]
    channel = combination["channel"]

    print("\n")
    print("========================================")
    print(f"PROCESSING: {skill} + {channel}")
    print("========================================")


    # ------------------------------------------------
    # Current skill + channel ka data
    # ------------------------------------------------

    combination_df = df[
        (df["skill"] == skill) &
        (df["channel"] == channel)
    ].copy()


    # ------------------------------------------------
    # Prophet ke required columns
    # ------------------------------------------------

    combination_df = combination_df[
        [
            "interval_start",
            "calls_offered"
        ]
    ]

    combination_df = combination_df.rename(
        columns={
            "interval_start": "ds",
            "calls_offered": "y"
        }
    )


    # ------------------------------------------------
    # Date ke according sort
    # ------------------------------------------------

    combination_df = combination_df.sort_values(
        "ds"
    )


    # ------------------------------------------------
    # Missing values remove
    # ------------------------------------------------

    combination_df = combination_df.dropna()


    # ------------------------------------------------
    # Too little data check
    # ------------------------------------------------

    if len(combination_df) < 10:

        print(
            f"Skipping {skill} + {channel}: "
            f"not enough records ({len(combination_df)})"
        )

        continue


    print(
        f"Total records: {len(combination_df)}"
    )


    # ==================================================
    # 7. TRAIN / TEST SPLIT
    # ==================================================

    split_index = int(
        len(combination_df) * 0.8
    )

    train = combination_df.iloc[
        :split_index
    ].copy()

    test = combination_df.iloc[
        split_index:
    ].copy()


    print(
        f"Training records: {len(train)}"
    )

    print(
        f"Testing records: {len(test)}"
    )


    # ==================================================
    # 8. PROPHET MODEL TRAIN
    # ==================================================

    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False
    )

    model.fit(train)


    # ==================================================
    # 9. TEST DATA PAR PREDICTION
    # ==================================================

    future_test = test[
        ["ds"]
    ].copy()

    forecast_test = model.predict(
        future_test
    )


    # ==================================================
    # 10. ACTUAL VS PREDICTED
    # ==================================================

    comparison = test[
        ["ds", "y"]
    ].copy()

    comparison["predicted"] = (
        forecast_test["yhat"]
        .values
    )


    # Negative prediction ko 0 kar do

    comparison["predicted"] = (
        comparison["predicted"]
        .clip(lower=0)
    )


    # ==================================================
    # 11. MAE
    # ==================================================

    comparison["error"] = (
        comparison["y"]
        -
        comparison["predicted"]
    ).abs()

    mae = comparison[
        "error"
    ].mean()


    # ==================================================
    # 12. MAPE
    # ==================================================

    non_zero = (
        comparison["y"] != 0
    )

    if non_zero.any():

        mape = (
            (
                (
                    comparison.loc[
                        non_zero,
                        "y"
                    ]
                    -
                    comparison.loc[
                        non_zero,
                        "predicted"
                    ]
                ).abs()
                /
                comparison.loc[
                    non_zero,
                    "y"
                ]
            ).mean()
            * 100
        )

    else:

        mape = 0


    # ==================================================
    # 13. ACCURACY RESULT SAVE KARO
    # ==================================================

    accuracy_results.append(
        {
            "skill": skill,
            "channel": channel,
            "records": len(combination_df),
            "training_records": len(train),
            "testing_records": len(test),
            "mae": round(mae, 2),
            "mape": round(mape, 2)
        }
    )


    print("\nMODEL ACCURACY")

    print(
        f"Skill: {skill}"
    )

    print(
        f"Channel: {channel}"
    )

    print(
        f"MAE: {mae:.2f} calls"
    )

    print(
        f"MAPE: {mape:.2f}%"
    )


    # ==================================================
    # 14. FINAL MODEL
    # ==================================================

    final_model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False
    )

    final_model.fit(
        combination_df
    )


    # ==================================================
    # 15. NEXT DAY CREATE KARO
    # ==================================================

    last_date = combination_df[
        "ds"
    ].max()

    next_day = (
        last_date.normalize()
        +
        pd.Timedelta(days=1)
    )


    # ==================================================
    # 16. FUTURE BUSINESS HOURS
    # ==================================================

    future_times = pd.date_range(
        start=(
            next_day
            +
            pd.Timedelta(hours=8)
        ),
        end=(
            next_day
            +
            pd.Timedelta(hours=22)
        ),
        freq="30min"
    )


    future = pd.DataFrame(
        {
            "ds": future_times
        }
    )


    # ==================================================
    # 17. FUTURE FORECAST
    # ==================================================

    forecast = final_model.predict(
        future
    )


    # ==================================================
    # 18. NEGATIVE VALUES REMOVE
    # ==================================================

    forecast["yhat"] = (
        forecast["yhat"]
        .clip(lower=0)
    )

    forecast["yhat_lower"] = (
        forecast["yhat_lower"]
        .clip(lower=0)
    )

    forecast["yhat_upper"] = (
        forecast["yhat_upper"]
        .clip(lower=0)
    )


    # ==================================================
    # 19. RESULT CREATE KARO
    # ==================================================

    result = forecast[
        [
            "ds",
            "yhat",
            "yhat_lower",
            "yhat_upper"
        ]
    ].copy()


    # ==================================================
    # 20. SKILL + CHANNEL ADD KARO
    # ==================================================

    result["skill"] = skill

    result["channel"] = channel


    # ==================================================
    # 21. COLUMN ORDER
    # ==================================================

    result = result[
        [
            "ds",
            "skill",
            "channel",
            "yhat",
            "yhat_lower",
            "yhat_upper"
        ]
    ]


    # ==================================================
    # 22. COLUMN NAMES CHANGE
    # ==================================================

    result = result.rename(
        columns={
            "ds": "interval_start",
            "yhat": "forecast_calls",
            "yhat_lower": "forecast_lower",
            "yhat_upper": "forecast_upper"
        }
    )


    # ==================================================
    # 23. CALLS KO INTEGER BANAYEIN
    # ==================================================

    result["forecast_calls"] = (
        result["forecast_calls"]
        .round()
        .astype(int)
    )

    result["forecast_lower"] = (
        result["forecast_lower"]
        .round()
        .astype(int)
    )

    result["forecast_upper"] = (
        result["forecast_upper"]
        .round()
        .astype(int)
    )


    # ==================================================
    # 24. RESULT LIST MEIN ADD KARO
    # ==================================================

    all_forecasts.append(
        result
    )


    print(
        f"Future forecast records: {len(result)}"
    )


# ==================================================
# 25. ALL FORECASTS COMBINE KARO
# ==================================================

if not all_forecasts:

    raise ValueError(
        "No forecast was generated."
    )


final_forecast = pd.concat(
    all_forecasts,
    ignore_index=True
)


# ==================================================
# 26. SORT FORECAST
# ==================================================

final_forecast = final_forecast.sort_values(
    [
        "interval_start",
        "skill",
        "channel"
    ]
)


# ==================================================
# 27. FORECAST CSV SAVE KARO
# ==================================================

output_file = "forecast_output.csv"

final_forecast.to_csv(
    output_file,
    index=False
)


# ==================================================
# 28. ACCURACY DATAFRAME
# ==================================================

accuracy_df = pd.DataFrame(
    accuracy_results
)


# ==================================================
# 29. ACCURACY CSV SAVE KARO
# ==================================================

accuracy_file = "forecast_accuracy.csv"

accuracy_df.to_csv(
    accuracy_file,
    index=False
)


# ==================================================
# 30. FINAL FORECAST DISPLAY
# ==================================================

print("\n")
print("========================================")
print("FINAL FUTURE FORECAST")
print("========================================")

print(
    final_forecast.to_string(
        index=False
    )
)


# ==================================================
# 31. ACCURACY SUMMARY
# ==================================================

print("\n")
print("========================================")
print("ACCURACY SUMMARY")
print("========================================")

print(
    accuracy_df.to_string(
        index=False
    )
)


# ==================================================
# 32. FILE INFORMATION
# ==================================================

print("\n")
print("========================================")
print("FILES SAVED")
print("========================================")

print(
    f"Forecast file: {output_file}"
)

print(
    f"Accuracy file: {accuracy_file}"
)

print(
    f"\nTotal forecast records: "
    f"{len(final_forecast)}"
)

print(
    f"Total combinations processed: "
    f"{len(accuracy_df)}"
) 

