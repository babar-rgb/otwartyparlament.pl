
import re
import collections
import sys

def normalize(text):
    text = text.lower()
    # Remove standard prefixes
    text = re.sub(r'^(rządowy|poselski|senacki|komisyjny|obywatelski)\s+projekt\s+ustawy\s+o\s+zmianie\s+ustawy\s+', '', text)
    text = re.sub(r'^(rządowy|poselski|senacki|komisyjny|obywatelski)\s+projekt\s+ustawy\s+o\s+', '', text)
    text = re.sub(r'^sprawozdanie\s+komisji\s+', '', text)
    text = re.sub(r'^uchwała\s+senatu\s+', '', text)
    text = re.sub(r'^wniosek\s+', '', text)
    text = re.sub(r'[^\w\s]', '', text) # Remove punctuation
    return text

def load_stop_words():
    # Basic Polish stopwords + legislation noise
    return set([
        'w', 'z', 'o', 'i', 'na', 'do', 'dla', 'że', 'się', 'jak', 'od', 'tym', 'za', 'przez',
        'ze', 'po', 'co', 'to', 'ale', 'lub', 'ma', 'są', 'będzie', 'jest', 'oraz', 'nad',
        'ustawa', 'ustawy', 'zmianie', 'dnia', 'roku', 'nr', 'poz', 'pkt', 'art',
        'sprawie', 'projekt', 'kodeks', 'prawo', 'przepisy', 'niektórych', 'innych',
        'rzeczypospolitej', 'polskiej', 'sejmu', 'senatu', 'komisji'
    ])

def run():
    # Load existing keys
    existing = set()
    try:
        with open('existing_keys.txt', 'r') as f:
            for line in f:
                existing.add(line.strip().lower())
    except FileNotFoundError:
        print("Warning: existing_keys.txt not found")

    # Load corpus
    words = []
    phrases = [] # Bigrams
    
    stop_words = load_stop_words()

    try:
        with open('corpus.txt', 'r') as f:
            for line in f:
                clean = normalize(line.strip())
                tokens = [t for t in clean.split() if len(t) > 2 and t not in stop_words]
                
                # Unigrams
                for t in tokens:
                    words.append(t)
                
                # Bigrams
                for i in range(len(tokens)-1):
                    phrases.append(f"{tokens[i]} {tokens[i+1]}")
                    
    except FileNotFoundError:
        print("Error: corpus.txt not found")
        return

    # Analyze
    word_counts = collections.Counter(words)
    phrase_counts = collections.Counter(phrases)
    
    print("=== TOP MISSING TERMS (Candidates for Core Terms) ===")
    
    # 1. Check Unigrams
    print("\n--- Top Unigrams ---")
    count = 0
    for word, freq in word_counts.most_common(200):
        if word not in existing and freq > 5:
            print(f"{word} ({freq})")
            existing.add(word) # Prevent dupes if adding loop logic
            count += 1
            if count >= 35: break
            
    # 2. Check Bigrams
    print("\n--- Top Bigrams ---")
    count = 0
    for phrase, freq in phrase_counts.most_common(200):
        if phrase not in existing and freq > 3:
            print(f"{phrase} ({freq})")
            count += 1
            if count >= 35: break

if __name__ == "__main__":
    run()
