import csv
import json

def csv_to_json(csv_file_path, json_file_path):
    # Open the CSV file
    with open(csv_file_path, mode='r', newline='', encoding='utf-8') as csv_file:
        # Read the CSV file using DictReader
        csv_reader = csv.DictReader(csv_file)
        
        # Convert the CSV data to a list of dictionaries
        data = [row for row in csv_reader]

    # Open the JSON file for writing
    with open(json_file_path, mode='w', encoding='utf-8') as json_file:
        # Convert the list of dictionaries to a JSON array
        json.dump(data, json_file, indent=4)

# Usage example
csv_file_path = 'fifa_24_players_randomized.csv'
json_file_path = 'fifa_24_players.json'

csv_to_json(csv_file_path, json_file_path)

print(f"CSV data has been successfully converted to JSON and saved to {json_file_path}")
