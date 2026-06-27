import sys
import os
import re
from urllib.parse import quote

def main():
    if len(sys.argv) < 2:
        print("Usage: python bridge.py <file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    metadata_match = re.search(r'(// ==UserScript==\s*.*?// ==/UserScript==)', content, re.DOTALL)

    if not metadata_match:
        print("Error: UserScript metadata block not found.", file=sys.stderr)
        sys.exit(1)

    metadata_block = metadata_match.group(1)
    lines = metadata_block.splitlines()

    # Append " (bridge)" to the @name line (idempotent)
    for i, line in enumerate(lines):
        m = re.match(r'(//\s*@name\s+)(.+)$', line)
        if m:
            prefix, name_val = m.groups()
            if not re.search(r'\(bridge\)\s*$', name_val):
                lines[i] = f"{prefix}{name_val} (bridge)"
            break

    # Find the position of the last @require or the end of the metadata block
    insert_pos = -1
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip().startswith('// @'):
            insert_pos = i + 1
            break
    
    if insert_pos == -1:  # Should not happen if block is valid
        insert_pos = len(lines) - 1

    abs_path = os.path.abspath(file_path)
    file_url = 'file:///' + quote(abs_path.replace(os.sep, '/'))
    new_require_line = f"// @require      {file_url}"
    lines.insert(insert_pos, new_require_line)

    modified_metadata = "\n".join(lines)
    print(modified_metadata)

if __name__ == "__main__":
    main()