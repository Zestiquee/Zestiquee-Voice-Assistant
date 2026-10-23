import os
import zipfile

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_ZIP = os.path.join(WORKSPACE_ROOT, 'public', 'zestiquee-project.zip')

EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    'dist',
    '.aistudio',
    '__pycache__',
}

EXCLUDE_FILES = {
    'zestiquee-project.zip',
}

os.makedirs(os.path.dirname(OUTPUT_ZIP), exist_ok=True)

print(f"Creating zip archive at: {OUTPUT_ZIP}")
with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(WORKSPACE_ROOT):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file in EXCLUDE_FILES or file.endswith('.pyc'):
                continue
            
            full_path = os.path.join(root, file)
            # Skip if it's the target zip itself
            if os.path.abspath(full_path) == os.path.abspath(OUTPUT_ZIP):
                continue
                
            rel_path = os.path.relpath(full_path, WORKSPACE_ROOT)
            zipf.write(full_path, rel_path)

size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
print(f"Zip created successfully! Size: {size_mb:.2f} MB")
