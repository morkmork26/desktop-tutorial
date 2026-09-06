use serde::Serialize;
use std::{
    fs::{self, File, OpenOptions},
    io::{self, Read, Write},
    path::{Path, PathBuf},
};
use thiserror::Error;
use uuid::Uuid;

const COPY_BUFFER_BYTES: usize = 128 * 1024;

#[derive(Debug, Error)]
pub enum ImportError {
    #[error("The selected path is not a regular file.")]
    NotAFile,
    #[error("Only WAV and MP3 files are supported in V1.")]
    UnsupportedExtension,
    #[error("The file contents do not match its WAV or MP3 extension.")]
    InvalidHeader,
    #[error("The destination is outside the app-owned audio directory.")]
    UnsafeDestination,
    #[error("Could not copy the audio file: {0}")]
    Io(#[from] io::Error),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedAudio {
    pub stored_name: String,
    pub stored_path: String,
    pub original_name: String,
    pub byte_length: u64,
}

pub fn validate_audio(path: &Path) -> Result<&'static str, ImportError> {
    if !path.is_file() {
        return Err(ImportError::NotAFile);
    }
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or(ImportError::UnsupportedExtension)?;
    if extension != "wav" && extension != "mp3" {
        return Err(ImportError::UnsupportedExtension);
    }

    let mut header = [0_u8; 12];
    let read = File::open(path)?.read(&mut header)?;
    let valid = match extension.as_str() {
        "wav" => read >= 12 && &header[0..4] == b"RIFF" && &header[8..12] == b"WAVE",
        "mp3" => {
            (read >= 3 && &header[0..3] == b"ID3")
                || (read >= 2 && header[0] == 0xff && header[1] & 0xe0 == 0xe0)
        }
        _ => false,
    };
    if !valid {
        return Err(ImportError::InvalidHeader);
    }
    Ok(if extension == "wav" { "wav" } else { "mp3" })
}

pub fn copy_audio_atomically(
    source: &Path,
    audio_dir: &Path,
) -> Result<ImportedAudio, ImportError> {
    let extension = validate_audio(source)?;
    fs::create_dir_all(audio_dir)?;
    let canonical_dir = audio_dir.canonicalize()?;
    let stored_name = format!("{}.{}", Uuid::new_v4(), extension);
    let destination = canonical_dir.join(&stored_name);
    if destination.parent() != Some(canonical_dir.as_path()) {
        return Err(ImportError::UnsafeDestination);
    }
    let temporary = canonical_dir.join(format!(".{stored_name}.part"));
    let result = copy_then_rename(source, &temporary, &destination);
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result?;

    let original_name = source
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("Imported audio")
        .to_owned();
    Ok(ImportedAudio {
        stored_name,
        stored_path: destination.to_string_lossy().into_owned(),
        original_name,
        byte_length: destination.metadata()?.len(),
    })
}

fn copy_then_rename(source: &Path, temporary: &Path, destination: &Path) -> io::Result<()> {
    let mut input = File::open(source)?;
    let mut output = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(temporary)?;
    let mut buffer = vec![0_u8; COPY_BUFFER_BYTES];
    loop {
        let read = input.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        output.write_all(&buffer[..read])?;
    }
    output.sync_all()?;
    drop(output);
    fs::rename(temporary, destination)
}

pub fn audio_directory(app_data_dir: PathBuf) -> PathBuf {
    app_data_dir.join("audio")
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn write_wav(path: &Path) {
        let mut bytes = b"RIFF\x24\x00\x00\x00WAVEfmt ".to_vec();
        bytes.extend_from_slice(&[0; 32]);
        fs::write(path, bytes).unwrap();
    }

    #[test]
    fn accepts_valid_wav_header_case_insensitively() {
        let directory = tempdir().unwrap();
        let source = directory.path().join("voice.WAV");
        write_wav(&source);
        assert_eq!(validate_audio(&source).unwrap(), "wav");
    }

    #[test]
    fn rejects_extension_header_mismatch() {
        let directory = tempdir().unwrap();
        let source = directory.path().join("not-a-song.mp3");
        write_wav(&source);
        assert!(matches!(
            validate_audio(&source),
            Err(ImportError::InvalidHeader)
        ));
    }

    #[test]
    fn creates_duplicate_safe_names_and_leaves_no_partial_file() {
        let directory = tempdir().unwrap();
        let source = directory.path().join("song.wav");
        let destination = directory.path().join("managed");
        write_wav(&source);
        let first = copy_audio_atomically(&source, &destination).unwrap();
        let second = copy_audio_atomically(&source, &destination).unwrap();
        assert_ne!(first.stored_name, second.stored_name);
        assert!(destination.join(first.stored_name).is_file());
        assert!(!fs::read_dir(destination).unwrap().any(|entry| entry
            .unwrap()
            .path()
            .extension()
            .is_some_and(|ext| ext == "part")));
    }
}
