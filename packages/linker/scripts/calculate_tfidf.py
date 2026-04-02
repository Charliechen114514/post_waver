#!/usr/bin/env python3
"""
TF-IDF based content similarity calculator with Chinese text segmentation

Input (JSON via stdin):
{
  "posts": [
    {"id": "post-1", "title": "...", "tags": ["tag1", "tag2"], "contentHash": "..."},
    ...
  ]
}

Output (JSON via stdout):
{
  "post-1": [
    {"id": "post-2", "score": 0.8234},
    ...
  ],
  ...
}
"""

import sys
import json
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def main():
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        posts = input_data['posts']

        if len(posts) < 2:
            # Not enough posts to calculate similarity
            print(json.dumps({}))
            return

        # Prepare text for each post
        # Combine title and tags for better semantic matching
        texts = []
        ids = []

        for post in posts:
            # Combine title (weight 2) and tags (weight 1)
            title_text = post.get('title', '') + ' ' * 2  # Title gets more weight
            tags_text = ' '.join(post.get('tags', []))
            combined_text = title_text + ' ' + tags_text

            texts.append(combined_text.strip())
            ids.append(post['id'])

        # Configure TF-IDF vectorizer
        # max_features=5000 prevents memory issues with large corpora
        vectorizer = TfidfVectorizer(
            tokenizer=jieba.lcut,
            max_features=5000,
            min_df=1,  # Include terms that appear in at least 1 document
            sublinear_tf=True  # Use sublinear TF scaling (1 + log(tf))
        )

        # Calculate TF-IDF matrix
        tfidf_matrix = vectorizer.fit_transform(texts)

        # Calculate cosine similarity matrix
        # This gives us similarity between all pairs of posts
        similarity_matrix = cosine_similarity(tfidf_matrix)

        # Build result: for each post, find top 10 most similar posts
        result = {}

        for i, current_id in enumerate(ids):
            # Get similarities for current post (row i)
            similarities = similarity_matrix[i]

            # Get indices of posts sorted by similarity (descending)
            # We want the most similar posts (highest scores)
            similar_indices = np.argsort(similarities)[::-1]

            # Filter out the post itself (highest similarity is always self)
            similar_indices = similar_indices[similar_indices != i]

            # Take top 10 candidates
            top_indices = similar_indices[:10]

            # Build result for current post
            related_posts = []
            for idx in top_indices:
                score = float(similarities[idx])
                # Only include posts with meaningful similarity (score > 0)
                if score > 0:
                    related_posts.append({
                        'id': ids[idx],
                        'score': round(score, 4)  # Round to 4 decimal places
                    })

            result[current_id] = related_posts

        # Output result as JSON
        print(json.dumps(result, ensure_ascii=False))

    except json.JSONDecodeError as e:
        # Input parsing error
        print(json.dumps({'error': f'Invalid JSON input: {str(e)}'}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        # General error - output to stderr for debugging
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
