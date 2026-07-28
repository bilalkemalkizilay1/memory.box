import os
import re

FRONTEND_DIR = r"C:\Users\kemal\.gemini\antigravity\scratch\memory-box\frontend\src"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace different levels of relative imports to specific top-level dirs
    # E.g. ../../shared -> @/shared
    content = re.sub(r'from\s+[\'"](?:\.\./)+shared/([^\'"]+)[\'"]', r"from '@/shared/\1'", content)
    content = re.sub(r'from\s+[\'"](?:\.\./)+features/([^\'"]+)[\'"]', r"from '@/features/\1'", content)
    content = re.sub(r'from\s+[\'"](?:\.\./)+app/([^\'"]+)[\'"]', r"from '@/app/\1'", content)

    # Specific replacements for leftover old imports
    content = re.sub(r'from\s+[\'"]\.\./\.\./types[\'"]', r"from '@/shared/types/types'", content)
    content = re.sub(r'from\s+[\'"]\.\./types[\'"]', r"from '@/shared/types/types'", content)
    content = re.sub(r'from\s+[\'"]\.\./\.\./services/api[\'"]', r"from '@/shared/api/api'", content)
    content = re.sub(r'from\s+[\'"]\.\./services/api[\'"]', r"from '@/shared/api/api'", content)
    content = re.sub(r'from\s+[\'"]\.\./App\.tsx[\'"]', r"from '@/app/App.tsx'", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            replace_in_file(os.path.join(root, file))

print("Imports fixed.")
