export interface ImportResult {
  readonly storedName: string
  readonly storedPath: string
  readonly originalName: string
  readonly byteLength: number
}

export interface ImportAdapter {
  pickAndImport(): Promise<ImportResult | null>
}

export class BrowserImportAdapter implements ImportAdapter {
  async pickAndImport(): Promise<ImportResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.wav,.mp3'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) { resolve(null); return }
        const storedName = `browser-${crypto.randomUUID()}.${file.name.split('.').pop() ?? 'wav'}`
        resolve({
          storedName,
          storedPath: URL.createObjectURL(file),
          originalName: file.name,
          byteLength: file.size,
        })
      }
      input.oncancel = () => resolve(null)
      input.click()
    })
  }
}

export class TauriImportAdapter implements ImportAdapter {
  async pickAndImport(): Promise<ImportResult | null> {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { invoke } = await import('@tauri-apps/api/core')
    const selected = await open({
      title: 'Import a song',
      filters: [{ name: 'Audio', extensions: ['wav', 'mp3'] }],
      multiple: false,
      directory: false,
    })
    if (!selected) return null
    const path = typeof selected === 'string' ? selected : (selected as { path: string }).path
    return invoke<ImportResult>('import_audio', { sourcePath: path })
  }
}

export function createImportAdapter(): ImportAdapter {
  if ('__TAURI_INTERNALS__' in window) return new TauriImportAdapter()
  return new BrowserImportAdapter()
}
