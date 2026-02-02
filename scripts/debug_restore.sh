#!/bin/bash
read -p "Podaj adres IP VPS (np. 173.212.213.229): " VPS_IP
if [ -z "$VPS_IP" ]; then
    VPS_IP="173.212.213.229"
    echo "Używam domyślnego IP: $VPS_IP"
fi

echo "🔍 Łączę się z serwerem, aby sprawdzić co poszło nie tak..."
ssh -t root@$VPS_IP "
echo '---------------------------------------------------'
echo '📂 Ostatnie 50 linii z /root/restore.log:'
echo '---------------------------------------------------'
tail -n 50 /root/restore.log || echo '❌ Brak pliku restore.log!'

echo ''
echo '---------------------------------------------------'
echo '📊 Sprawdzam czy są jakiekolwiek tabele w bazie:'
echo '---------------------------------------------------'
DB_ID=\$(docker ps -qf name=db | head -n 1)
if [ -n \"\$DB_ID\" ]; then
    echo \"Kontener DB ID: \$DB_ID\"
    docker exec \$DB_ID psql -U kajtek -d otwarty_parlament -c '\dt' || echo '❌ Błąd połączenia z bazą.'
    
    echo ''
    echo '---------------------------------------------------'
    echo '🔢 Liczę rekordy (używając poprawnych nazw tabel):'
    echo '---------------------------------------------------'
    echo "Tabela 'votes':"
    docker exec \$DB_ID psql -U kajtek -d otwarty_parlament -c 'SELECT count(*) FROM votes;' 2>/dev/null || echo '❌ Tabela votes nie istnieje.'
    
    echo "Tabela 'mps':"
    docker exec \$DB_ID psql -U kajtek -d otwarty_parlament -c 'SELECT count(*) FROM mps;' 2>/dev/null || echo '❌ Tabela mps nie istnieje.'

    echo "Tabela 'speeches':"
    docker exec \$DB_ID psql -U kajtek -d otwarty_parlament -c 'SELECT count(*) FROM speeches;' 2>/dev/null || echo '❌ Tabela speeches nie istnieje.'
else
    echo '❌ Nie znaleziono kontenera bazy danych!'
fi
"
echo "---------------------------------------------------"
echo "Koniec raportu."
