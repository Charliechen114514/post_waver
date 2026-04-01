#!/usr/bin/env python3
"""
Cleanup Article Redundant Content

Removes redundant content extracted from HTML (copyright, navigation, related posts)
and fixes image references.
"""

import os
import re
from pathlib import Path

POSTS_DIR = Path(__file__).parent.parent / 'blog' / 'source' / '_posts'

# Patterns that indicate the end of actual article content
END_PATTERNS = [
    r'^:::::: post-copyright',
    r'^::: post-copyright',
    r'^::::: tag_share',
    r'^::::::::::::::::::::::::::::: relatedPosts',
]

def should_end_at_line(line):
    """Check if this line indicates the end of actual content"""
    for pattern in END_PATTERNS:
        if re.match(pattern, line):
            return True
    return False

def fix_image_references(line):
    """Fix image references with complex attributes"""
    # Convert: ![alt](/img/loading.gif){original="image.png"}
    # To: ![alt](/img/image.png)
    return re.sub(
        r'!\[(.*?)\]\(/img/loading\.gif\)\{original="([^"]+)"\}',
        r'![\1](/img/\2)',
        line
    )

def cleanup_article(file_path):
    """Cleanup a single article file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    end_line = len(lines)
    for i, line in enumerate(lines):
        if should_end_at_line(line):
            end_line = i
            break

    if end_line == len(lines):
        return False, 0

    # Keep only content before the redundant section
    cleaned_lines = lines[:end_line]

    # Fix image references
    fixed_lines = [fix_image_references(line) for line in cleaned_lines]

    # Remove trailing empty lines
    while fixed_lines and fixed_lines[-1].strip() == '':
        fixed_lines.pop()

    removed_lines = len(lines) - len(fixed_lines)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
        f.write('\n')

    return True, removed_lines

def main():
    files = list(POSTS_DIR.glob('*.md'))

    print(f"🧹 Cleaning up {len(files)} articles...\n")

    cleaned = 0
    total_removed = 0

    for file_path in sorted(files):
        was_cleaned, removed = cleanup_article(file_path)

        if was_cleaned:
            cleaned += 1
            total_removed += removed
            print(f"✅ {file_path.name}: removed {removed} lines")
        else:
            print(f"⏭️  {file_path.name}: already clean")

    print(f"\n📊 Summary:")
    print(f"   Cleaned: {cleaned}/{len(files)}")
    print(f"   Total lines removed: {total_removed}")

if __name__ == '__main__':
    main()
