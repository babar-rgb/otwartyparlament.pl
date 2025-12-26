
const apiAnonKey = import.meta.env.VITE_API_ANON_KEY;

if (!apiAnonKey) {
    console.warn('Missing VITE_API_ANON_KEY');
}

// Robust URL detection logic
const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_POSTGREST_URL;
    if (envUrl && envUrl.startsWith('/')) {
        return `${window.location.origin}${envUrl}`;
    }
    return envUrl || 'http://localhost:3001';
};

const BASE_URL = getApiUrl();

/**
 * Lightweight PostgREST Client to replace @supabase/postgrest-js
 * Implements the subset of the API used by the application.
 */
class PostgrestBuilder<T = any> {
    url: string;
    method: string;
    headers: Record<string, string>;
    queryParams: URLSearchParams;
    body: any;

    constructor(url: string, method = 'GET') {
        this.url = url;
        this.method = method;
        this.headers = {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${apiAnonKey}`,
            // 'ApiKey': apiAnonKey
        };
        this.queryParams = new URLSearchParams();
    }

    select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated' | null, head?: boolean }) {
        this.queryParams.append('select', columns);
        if (options?.count) {
            this.headers['Prefer'] = `count=${options.count}`;
        }
        if (options?.head) {
            this.method = 'HEAD';
        }
        return this;
    }

    eq(column: string, value: any) {
        this.queryParams.append(column, `eq.${value}`);
        return this;
    }

    neq(column: string, value: any) {
        this.queryParams.append(column, `neq.${value}`);
        return this;
    }

    gt(column: string, value: any) {
        this.queryParams.append(column, `gt.${value}`);
        return this;
    }

    gte(column: string, value: any) {
        this.queryParams.append(column, `gte.${value}`);
        return this;
    }

    lt(column: string, value: any) {
        this.queryParams.append(column, `lt.${value}`);
        return this;
    }

    lte(column: string, value: any) {
        this.queryParams.append(column, `lte.${value}`);
        return this;
    }

    ilike(column: string, value: any) {
        this.queryParams.append(column, `ilike.${value}`);
        return this;
    }

    like(column: string, value: any) {
        this.queryParams.append(column, `like.${value}`);
        return this;
    }

    // Full Text Search support
    textSearch(column: string, query: string, options?: { config?: string, type?: 'plain' | 'phrase' | 'websearch' | null }) {
        const type = options?.type || 'plain';
        const config = options?.config ? `(${options.config})` : '';
        // PostgREST syntax: col=fts(config).query
        // or col=wfts(config).query for websearch
        let operator = 'fts';
        if (type === 'websearch') operator = 'wfts';
        else if (type === 'phrase') operator = 'phfts'; // less common, but checking docs might be needed. assuming standard text search handling

        // Simplified for our use case: 
        // PostgREST: column=fts.query or column=wfts.query
        // We append the modifier if config is present? PostgREST docs say: fts(english).query

        const opString = config ? `${operator}${config}` : operator;
        this.queryParams.append(column, `${opString}.${query}`);
        return this;
    }

    in(column: string, values: any[]) {
        const formatted = values.map(v => {
            if (typeof v === 'string') {
                // simple quoting, ideally check for commas
                // PostgREST typically accepts "val"
                return `"${v.replace(/"/g, '\\"')}"`;
            }
            return v;
        }).join(',');
        this.queryParams.append(column, `in.(${formatted})`);
        return this;
    }

    or(filters: string, options?: { foreignTable?: string }) {
        const key = options?.foreignTable ? `${options.foreignTable}.or` : 'or';
        this.queryParams.append(key, `(${filters})`);
        return this;
    }

    order(column: string, options?: { ascending?: boolean, foreignTable?: string }) {
        const dir = options?.ascending === false ? 'desc' : 'asc';
        const key = 'order'; // PostgREST supports multple order params
        const val = options?.foreignTable ? `${options.foreignTable}(${column}.${dir})` : `${column}.${dir}`;
        this.queryParams.append(key, val);
        return this;
    }

    range(from: number, to: number) {
        this.headers['Range-Unit'] = 'items';
        this.headers['Range'] = `${from}-${to}`;
        return this;
    }

    limit(count: number) {
        this.queryParams.append('limit', count.toString());
        return this;
    }

    single() {
        this.headers['Accept'] = 'application/vnd.pgrst.object+json';
        return this;
    }

    maybeSingle() {
        this.headers['Accept'] = 'application/vnd.pgrst.object+json';
        return this;
    }

    // Support for simple .filter() generic usage
    filter(column: string, operator: string, value: any) {
        this.queryParams.append(column, `${operator}.${value}`);
        return this;
    }

    async then(
        resolve: (val: { data: T | null, error: any, count: number | null, status: number, statusText: string }) => void,
        _reject?: (err: any) => void
    ) {
        const queryString = this.queryParams.toString();
        // Handle URLs that might already have query params? usually not in this builder pattern
        const fullUrl = queryString ? `${this.url}?${queryString}` : this.url;

        try {
            const res = await fetch(fullUrl, {
                method: this.method,
                headers: this.headers,
                body: this.body ? JSON.stringify(this.body) : undefined
            });

            const status = res.status;
            const statusText = res.statusText;

            if (!res.ok) {
                const text = await res.text();
                // Mimic PostgREST error structure
                let errorMsg = text;
                try {
                    const jsonErr = JSON.parse(text);
                    errorMsg = jsonErr.message || jsonErr;
                } catch { }

                resolve({
                    data: null,
                    error: { message: errorMsg, code: status.toString(), details: text },
                    count: null,
                    status,
                    statusText
                });
                return;
            }

            let data = null;
            // Check if response has content
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('json')) {
                data = await res.json();
            }

            let count = null;
            const contentRange = res.headers.get('Content-Range');
            if (contentRange) {
                // Format: 0-24/35734 or */35734
                const parts = contentRange.split('/');
                if (parts.length > 1 && parts[1] !== '*') {
                    count = parseInt(parts[1], 10);
                }
            }

            resolve({ data, error: null, count, status, statusText });
        } catch (err) {
            // Network error or JSON parse error
            resolve({
                data: null,
                error: { message: err instanceof Error ? err.message : String(err), code: "CLIENT_ERROR" },
                count: null,
                status: 0,
                statusText: "Client Error"
            });
        }
    }
}

class DbClient {
    from(table: string) {
        return new PostgrestBuilder(`${BASE_URL}/${table}`);
    }

    rpc(func: string, params: any = {}) {
        const builder = new PostgrestBuilder(`${BASE_URL}/rpc/${func}`, 'POST');
        builder.body = params;
        return builder;
    }
}

export const db = new DbClient();
