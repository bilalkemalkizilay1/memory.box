import os
import shutil
import re

FRONTEND_DIR = r"C:\Users\kemal\.gemini\antigravity\scratch\memory-box\frontend\src"

def move_file(src, dst):
    src_path = os.path.join(FRONTEND_DIR, src)
    dst_path = os.path.join(FRONTEND_DIR, dst)
    if os.path.exists(src_path):
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.move(src_path, dst_path)
        print(f"Moved {src} to {dst}")
    else:
        print(f"Skipped {src} (not found)")

def copy_file(src, dst):
    src_path = os.path.join(FRONTEND_DIR, src)
    dst_path = os.path.join(FRONTEND_DIR, dst)
    if os.path.exists(src_path):
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src} to {dst}")
    else:
        print(f"Skipped {src} (not found)")

# Move main components based on feature
copy_file("components/CirclesPanel.tsx", "features/circles/desktop/CirclesPanel.tsx")
move_file("components/CirclesPanel.tsx", "features/circles/mobile/CirclesPanel.tsx")

copy_file("components/DiaryPanel.tsx", "features/memories/desktop/DiaryPanel.tsx")
move_file("components/DiaryPanel.tsx", "features/memories/mobile/DiaryPanel.tsx")

copy_file("components/SenPanel.tsx", "features/profile/desktop/SenPanel.tsx")
move_file("components/SenPanel.tsx", "features/profile/mobile/SenPanel.tsx")

copy_file("components/HakkindaPanel.tsx", "features/profile/desktop/HakkindaPanel.tsx")
move_file("components/HakkindaPanel.tsx", "features/profile/mobile/HakkindaPanel.tsx")

copy_file("components/EditMemoryModal.tsx", "features/memories/desktop/EditMemoryModal.tsx")
move_file("components/EditMemoryModal.tsx", "features/memories/mobile/EditMemoryModal.tsx")

move_file("components/CreateMemoryFlow.tsx", "features/memories/mobile/CreateMemoryFlow.tsx")

# BottomNav and BottomSheet are Mobile UI primitives, Sidebar is Desktop UI
move_file("components/BottomNav.tsx", "app/mobile/BottomNav.tsx")
move_file("components/BottomSheet.tsx", "app/mobile/BottomSheet.tsx")
move_file("components/Sidebar.tsx", "app/desktop/Sidebar.tsx")

# Rename MapComponent to MapCanvas
copy_file("components/MapComponent.tsx", "features/map/desktop/DesktopMapExperience.tsx")
copy_file("components/MapComponent.tsx", "features/map/mobile/MobileMapExperience.tsx")
move_file("components/MapComponent.tsx", "features/map/shared/MapCanvas.tsx")

# Replace App.tsx with the root router
move_file("App.tsx", "app/App.tsx")
