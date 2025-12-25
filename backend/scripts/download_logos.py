import os
import requests
import sys

# Add backend to path for internal imports if needed (though we'll use direct SQL for simplicity if possible)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.db import db

def download_logos():
    parties = [
        ('PiS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Prawo_i_Sprawiedliwo%C5%9B%C4%87_logo.svg/512px-Prawo_i_Sprawiedliwo%C5%9B%C4%87_logo.svg.png'),
        ('KO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Koalicja_Obywatelska_logo.svg/512px-Koalicja_Obywatelska_logo.svg.png'),
        ('Polska2050', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Polska_2050_Szymona_Ho%C5%82owni_logo.svg/512px-Polska_2050_Szymona_Ho%C5%82owni_logo.svg.png'),
        ('PSL', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Polskie_Stronnictwo_Ludowe_Logo.svg/512px-Polskie_Stronnictwo_Ludowe_Logo.svg.png'),
        ('Lewica', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Nowa_Lewica_logo.svg/512px-Nowa_Lewica_logo.svg.png'),
        ('Razem', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Partia_Razem_logo.svg/512px-Partia_Razem_logo.svg.png'),
        ('Konfederacja', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Konfederacja_Wolno%C5%9B%C4%87_i_Niepodleg%C5%82o%C5%9B%C4%87_logo.svg/512px-Konfederacja_Wolno%C5%9B%C4%87_i_Niepodleg%C5%82o%C5%9B%C4%87_logo.svg.png'),
        ('Konfederacja_KP', 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Confederation_of_the_Polish_Crown_logo.png'),
        ('Republikanie', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Logo_Partii_Republika%C5%84skiej.svg/512px-Logo_Partii_Republika%C5%84skiej.svg.png'),
        ('PS', 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Suwerenna_Polska_Logo.png'),
        ('Kukiz15', 'https://upload.wikimedia.org/wikipedia/commons/b/b3/KUKIZ15.png')
    ]

    base_path = "public/assets/parties"
    os.makedirs(base_path, exist_ok=True)

    with db.get_cursor() as cur:
        for p_id, url in parties:
            ext = "png" # Most are png or thumbnails
            filename = f"{p_id.lower()}.{ext}"
            file_path = os.path.join(base_path, filename)
            
            try:
                print(f"Downloading {p_id} from {url}...")
                response = requests.get(url, stream=True, timeout=10)
                if response.status_code == 200:
                    with open(file_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    # Update DB with LOCAL path (relative to public for frontend)
                    local_url = f"/assets/parties/{filename}"
                    cur.execute("UPDATE parties SET logo_url = %s WHERE id = %s", (local_url, p_id))
                    print(f"Saved to {file_path} and updated DB.")
                else:
                    print(f"Failed to download {p_id}: {response.status_code}")
            except Exception as e:
                print(f"Error downloading {p_id}: {e}")

    print("Download and local path update completed.")

if __name__ == "__main__":
    download_logos()
