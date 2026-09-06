mod import;

use import::{audio_directory, copy_audio_atomically, ImportedAudio};
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn import_audio(app: tauri::AppHandle, source_path: String) -> Result<ImportedAudio, String> {
    let app_data = app.path().app_data_dir().map_err(|error| error.to_string())?;
    copy_audio_atomically(std::path::Path::new(&source_path), &audio_directory(app_data))
        .map_err(|error| error.to_string())
}

pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_v1_project_schema",
        sql: include_str!("../migrations/0001_v1.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:rhythm-song-trainer.sqlite", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![import_audio])
        .run(tauri::generate_context!())
        .expect("Rhythm Song Trainer failed to start");
}
