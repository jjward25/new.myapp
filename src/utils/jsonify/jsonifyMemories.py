import pandas as pd
import json
import numpy as np

def excel_to_json(excel_file, sheet_name, output_json_file):
    try:
        # Read the Excel file, using the first row as the header
        df = pd.read_excel(excel_file, sheet_name=sheet_name, header=0)
        print(f"DataFrame loaded successfully with {len(df)} rows and {len(df.columns)} columns.")

        # Print the DataFrame to debug
        print("DataFrame content:")
        print(df.head())  # Print the first few rows to verify the data

        # Convert Timestamp objects to strings
        for column in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[column]):
                df[column] = df[column].astype(str)

        # Replace NaN with None
        df = df.applymap(lambda x: None if pd.isna(x) else x)

        # Convert the DataFrame to a list of dictionaries (one for each row)
        data = df.to_dict(orient='records')
        print(f"Converted DataFrame to list of dictionaries with {len(data)} records.")
        
        # Print the data to debug
        print("Data to be written to JSON:")
        print(data)

        # Write the list of dictionaries to a JSON file
        with open(output_json_file, 'w') as json_file:
            json.dump(data, json_file, indent=4)
        print(f"Data successfully written to {output_json_file}.")
    
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
excel_file = r'C:\Users\Joe\Desktop\Coding\new.myapp\src\utils\life.xlsx'
sheet_name = 'memories'
output_json_file = 'memories.json'
excel_to_json(excel_file, sheet_name, output_json_file)
