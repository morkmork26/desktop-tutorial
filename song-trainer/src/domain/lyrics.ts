export interface LyricToken {
  readonly id: string
  readonly text: string
  readonly normalized: string
  readonly lineIndex: number
}

export function tokenizeLyrics(input: string): LyricToken[] {
  const lines = input.replaceAll('\r\n', '\n').split('\n')
  return lines.flatMap((line, lineIndex) =>
    [...line.matchAll(/\S+/gu)].map((match, tokenIndex) => {
      const text = match[0]
      return {
        id: `line-${lineIndex}-token-${tokenIndex}`,
        text,
        normalized: text.toLocaleLowerCase().replace(/(^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$)/gu, ''),
        lineIndex,
      }
    }),
  )
}
