
import os
import shutil


PROJECT_ROOT = "/Users/kajtek/sejm/git/parlament"

hooks_to_archive = [
    f"{PROJECT_ROOT}/src/hooks/useDashboardData.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useInterpellationDetails.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useLatarnik.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useMpProfile.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useRankings.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useSejmPrints.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useSpeeches.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useVoteDetails.legacy.ts",
    f"{PROJECT_ROOT}/src/hooks/useVotesList.legacy.ts"
]

scripts_to_archive = [
    f"{PROJECT_ROOT}/scripts/add_fts_column.py",
    f"{PROJECT_ROOT}/scripts/apply_migration_manually.py",
    f"{PROJECT_ROOT}/scripts/check_2103_refs.py",
    f"{PROJECT_ROOT}/scripts/check_bill_2103.py",
    f"{PROJECT_ROOT}/scripts/check_bill_status.py",
    f"{PROJECT_ROOT}/scripts/check_bills_content.py",
    f"{PROJECT_ROOT}/scripts/check_fts_config.py",
    f"{PROJECT_ROOT}/scripts/check_pgvector.py",
    f"{PROJECT_ROOT}/scripts/check_process.py",
    f"{PROJECT_ROOT}/scripts/debug_api.py",
    f"{PROJECT_ROOT}/scripts/debug_prompt_490049.py",
    f"{PROJECT_ROOT}/scripts/double_verify.py",
    f"{PROJECT_ROOT}/scripts/find_budget_bill.py",
    f"{PROJECT_ROOT}/scripts/fix_process_dates.py",
    f"{PROJECT_ROOT}/scripts/inspect_process_43.py",
    f"{PROJECT_ROOT}/scripts/repair_schema.py",
    f"{PROJECT_ROOT}/scripts/reset_term10_analyses.py",
    f"{PROJECT_ROOT}/scripts/reset_vote_490049.py",
    f"{PROJECT_ROOT}/scripts/setup_fts_trigger.py",
    f"{PROJECT_ROOT}/scripts/setup_polish_fts.py",
    f"{PROJECT_ROOT}/scripts/sync_analysis_to_description.py",
    f"{PROJECT_ROOT}/scripts/test_gemini_key.py",
    f"{PROJECT_ROOT}/scripts/test_legislative_api.py",
    f"{PROJECT_ROOT}/scripts/test_narrator.py",
    f"{PROJECT_ROOT}/scripts/test_persona_endpoint.py"
]

def move_files(files, dest_dir_relative):
    dest_dir = os.path.join(PROJECT_ROOT, dest_dir_relative)
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
        print(f"Created directory: {dest_dir}")
    
    for file_path in files:
        if os.path.exists(file_path):
            try:
                shutil.move(file_path, os.path.join(dest_dir, os.path.basename(file_path)))
                print(f"Moved: {file_path}")
            except Exception as e:
                print(f"Error moving {file_path}: {e}")
        else:
            print(f"Skipped (not found): {file_path}")

print("Starting cleanup...")
move_files(hooks_to_archive, "src/archive")
move_files(scripts_to_archive, "scripts/archive")
print("Cleanup complete.")

