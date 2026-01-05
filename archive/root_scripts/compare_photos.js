import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
    console.log("Fetching MEPs...");
    const { data, error } = await supabase
        .from('euro_meps')
        .select('full_name, photo_url, api_id')
        .in('full_name', ['Andrzej BUŁA', 'Adam JARUBAS']);

    if (error) {
        console.error(error);
        return;
    }

    console.table(data);
}

main();
