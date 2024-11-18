import requests
import pandas as pd
import random
from bs4 import BeautifulSoup

# URL of the FIFA 24 players page on FIFA Index
url = 'https://www.fifaindex.com/players/'

# Headers to mimic a browser request
headers = {
    "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    "Accept-Encoding": 'gzip, deflate, br, zstd',
    "Accept-Language": 'en-US,en;q=0.9',
    "Cache-Control": 'max-age=0',
    "Cookie": '__qca=I0-745799192-1722051647840; __cf_bm=j6dmVFGnVTbUE_Z0Y0BAjFuVfIkZsH7PwwH_gi9jABo-1722051452-1.0.1.1-vVnit9cYobyiVh5wxQ1MpZbFGNILzv4qE3dv8mQyxuFduOblg4Ng0LYt0U2NNOR5_vAYIODTpXDY51Kqq23JaQ; cf_clearance=BuZ.hAfN7XnQIvnHGJcvoBuu4JH87LmIrNVomZWqwGE-1722051452-1.0.1.1-90A8AxNVO28v.SwarJGZ_cR97ECs865W_LR3t.q0E1QtEe6mG8HT4zJeJhyC9OqozN9YxasxFAVm2OSQXUS4Ag; _ga_JNP72VLH86=GS1.1.1722051452.1.0.1722051452.0.0.0; _ga=GA1.2.1117494608.1722051453; _gid=GA1.2.748336567.1722051453; usprivacy=1YNY; _li_dcdm_c=.fifaindex.com; _lc2_fpi=ccdfaad9d699--01j3s47r5whf5mgerdb61cer8d; _lc2_fpi_meta=%7B%22w%22%3A1722051453116%7D; _lr_retry_request=true; _lr_env_src_ats=false; panoramaId_expiry=1722656253319; _cc_id=d9c1585463d0c784d606c50d330aa1c; panoramaId=1f5a04c768d644de1bc8d96f092516d53938cb1f29643044037638f6aaaa2c29; _scor_uid=fb545c72d4d44d9bb3e5214767220465; connectId=%7B%22puid%22%3A%226243ecad7305eb9b181211463cd0b73b1098a3c143df40391fa37cfaff086b2c%22%2C%22vmuid%22%3A%22aL6YKULQdL5ALePQk2XgK3Odzve3tJ2CVW078jfN3ooduE1sKLmGlyhFP6FD3EK9lAO8AerW9-W3siqQka6Q1w%22%2C%22connectid%22%3A%22aL6YKULQdL5ALePQk2XgK3Odzve3tJ2CVW078jfN3ooduE1sKLmGlyhFP6FD3EK9lAO8AerW9-W3siqQka6Q1w%22%2C%22connectId%22%3A%22aL6YKULQdL5ALePQk2XgK3Odzve3tJ2CVW078jfN3ooduE1sKLmGlyhFP6FD3EK9lAO8AerW9-W3siqQka6Q1w%22%2C%22ttl%22%3A86400000%2C%22lastSynced%22%3A1722051453340%2C%22lastUsed%22%3A1722051453340%7D; _lr_geo_location_state=NJ; _lr_geo_location=US; TAPAD=%7B%22id%22%3A%221ac01f05-4678-408d-b180-f405079d6e3a%22%7D; __gads=ID=8904c16c647b7abc:T=1722051454:RT=1722051773:S=ALNI_MafI42hchiRHaZUnVjesyIkwexvhw; __gpi=UID=00000eb7283abd8f:T=1722051454:RT=1722051773:S=ALNI_MYvll5miEe2tygEGJ1AOCvFNeEp9Q; __eoi=ID=2895d6ece174fb11:T=1722051454:RT=1722051773:S=AA-Afja60HRVwNji8KFIb9K4W0S6',
    "If-Modified-Since": 'Sat, 27 Jul 2024 03:29:13 GMT',
    "Priority": 'u=0, i',
    "Sec-Ch-Ua": '"Chromium";v="126", "Google Chrome";v="126"',
    "Sec-Ch-Ua-Mobile": '?0',
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": 'document',
    "Sec-Fetch-Mode": 'navigate',
    "Sec-Fetch-Site": 'none',
    "Sec-Fetch-User": '?1',
    "Upgrade-Insecure-Requests": '1',
    "User-Agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
}

# Function to scrape player data from the website
def scrape_fifa_players(url, headers):
    players_data = []
    
    # Loop through multiple pages
    for page in range(1, 51):  # Adjust range for more pages
        print(f'Scraping page {page}...')
        response = requests.get(f"{url}?page={page}", headers=headers)
        soup = BeautifulSoup(response.content, 'html.parser')
        print("Response gave: ", response.status_code)
        
        # Find player cards
        players = soup.find_all('a', class_='link-player')

        print(f"Found {len(players)} players on page {page}.")
        # print("Players: ", players)
        
        for player in players:
                if player.text.strip() == '' or player.text.strip().count(' ') < 1:
                    continue
                full_name = player.text.strip()
                first_name, last_name = full_name.split(' ', 1)
                print(f"First Name: {first_name}, Last Name: {last_name}")
                
                players_data.append({
                    'First Name': first_name,
                    'Last Name': last_name
                })

    return players_data

# Scrape the player data
players_data = scrape_fifa_players(url, headers)

# Create a DataFrame
df = pd.DataFrame(players_data)

# Randomize first and last names
df['First Name'] = random.sample(list(df['First Name']), len(df))
df['Last Name'] = random.sample(list(df['Last Name']), len(df))

# Save to CSV
csv_filename = 'fifa_24_players_randomized.csv'
df.to_csv(csv_filename, index=False)

print(f"CSV file '{csv_filename}' created with randomized names.")
