const BUCKET = 'guide-photos'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 3 * 1024 * 1024

export type UploadResult = { url: string } | { error: string }

// O bucket também valida tipo e tamanho; a checagem aqui só evita uma ida ao
// servidor para receber erro.
export const useImageUpload = () => {
  const { user } = useAuth()
  const supabase = useSupabase()

  const uploadImage = async (file: File, folder = ''): Promise<UploadResult> => {
    if (!user.value) return { error: 'Sessão expirada. Entre novamente.' }
    if (!ACCEPTED_TYPES.includes(file.type)) return { error: 'Use uma imagem JPG, PNG ou WebP.' }
    if (file.size > MAX_BYTES) return { error: 'A imagem precisa ter até 3 MB.' }

    // A policy do bucket exige que a primeira pasta seja o uid de quem envia.
    // Nome com timestamp porque a URL pública é cacheada por CDN.
    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const prefix = folder ? `${folder}/` : ''
    const path = `${user.value.id}/${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', contentType: file.type })

    if (error) return { error: `Falha no envio: ${error.message}` }

    return { url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
  }

  return { uploadImage, ACCEPTED_TYPES, MAX_BYTES }
}
