
import { pipeline, env } from '@xenova/transformers';

// Skip local checks for models (we load from CDN)
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton instance to prevent multiple model loads
class BrowserAI {
    private static instance: BrowserAI;
    private extractor: any = null;
    private modelName = 'Xenova/all-MiniLM-L6-v2';
    private isLoading = false;
    private loadPromise: Promise<void> | null = null;

    // Progress callback
    public onProgress: ((progress: number, task: string) => void) | null = null;

    private constructor() { }

    public static getInstance(): BrowserAI {
        if (!BrowserAI.instance) {
            BrowserAI.instance = new BrowserAI();
        }
        return BrowserAI.instance;
    }

    /**
     * Initializes the model. Safe to call multiple times.
     */
    public async init() {
        if (this.extractor) return;
        if (this.loadPromise) return this.loadPromise;

        this.isLoading = true;

        this.loadPromise = (async () => {
            try {
                this.extractor = await pipeline('feature-extraction', this.modelName, {
                    quantized: true, // Use smaller quantized model
                    progress_callback: (data: any) => {
                        if (data.status === 'progress' && this.onProgress) {
                            // data.progress represents percentage (0-100) or ratio? Usually ratio or percentage depending on version.
                            // Xenova v2 usually returns { status: 'progress', name: '...', file: '...', progress: 42.5, loaded: 123, total: 456 }
                            if (data.progress) {
                                this.onProgress(Math.round(data.progress), "Loading Neural Network...");
                            }
                        }
                    }
                });
            } catch (error) {
                console.error("Failed to load AI model:", error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        })();

        return this.loadPromise;
    }

    /**
     * Generates an embedding for the text.
     * Returns a 384-dimensional vector.
     */
    public async getEmbedding(text: string): Promise<number[] | null> {
        if (!text || text.trim().length === 0) return null;

        // Ensure loaded
        if (!this.extractor) {
            await this.init();
        }

        try {
            // output is a Tensor { data: Float32Array, dims: [1, 384] }
            const output = await this.extractor(text, { pooling: 'mean', normalize: true });
            if (output && output.data) {
                // Convert Float32Array to standard array
                return Array.from(output.data);
            }
        } catch (e) {
            console.error("AI Inference Error:", e);
        }
        return null;
    }
}

export const browserAI = BrowserAI.getInstance();
