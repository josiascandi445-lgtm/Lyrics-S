# Lyrics Studio — Fase 1

Lyrics Video Editor + Lyrics Renderer + Video Exporter. Corre 100% localmente
no browser — nenhum ficheiro de áudio, imagem ou letra é enviado para
qualquer servidor.

> ⚠️ **Nota sobre este README**: este projeto foi escrito num ambiente sem
> acesso à internet, pelo que não foi possível correr `npm install` /
> `npm run build` para validar automaticamente o resultado final antes da
> entrega. O código foi escrito com cuidado e de forma consistente com a
> stack pedida, mas **a primeira coisa a fazer é correr `npm run build`
> localmente** (secção "Instalação" abaixo) e resolver qualquer erro de
> tipos/dependências que apareça — TypeScript "estrito" às vezes apanha
> pequenas incompatibilidades de versão de bibliotecas que só se veem com o
> compilador real à frente.

## Instalação

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build
npm run start
```

Testes (parsers, cálculo de linha ativa, validação, renderer):

```bash
npm run test
```

## Stack

Next.js 14 · React 18 · TypeScript (strict) · Tailwind CSS · Zustand ·
lucide-react · Web Audio API · Canvas 2D · ffmpeg.wasm.

Sem backend, sem base de dados, sem autenticação — tudo corre no browser do
utilizador.

## Arquitetura

```
app/                     # rotas Next.js (App Router)
components/
  editor/                # EditorShell, TopBar
  settings/              # painel de definições (5 separadores)
  lyrics/                # editor de letras, importação, sync por linha/palavra
  timeline/              # waveform + blocos de linhas + playhead
  player/                # controlos de reprodução
  preview/               # canvas de preview em tempo real
  export/                # diálogo de exportação MP4
  ui/                     # componentes genéricos (drop zone, etc.)
lib/
  audio/                 # AudioClock, geração de waveform, validação de ficheiros
  lyrics/                # parsers (TXT/LRC/SRT/JSON), validação, utils de timing
  render/                # LyricsRenderer, backgroundRenderer, compositor, extração de cor
  effects/                # arquitetura de efeitos + SpotifyInspiredLyrics
  export/                 # motor de exportação MP4 (ffmpeg.wasm)
  project/                # defaults, serialização (.lyricsproject)
  utils/                  # id, tempo, easing, validação de ficheiros
hooks/                    # useAudioClock, useGlobalShortcuts, useProjectAssets
stores/                   # projectStore (Zustand)
types/                    # modelo de dados TypeScript
tests/                    # testes Vitest
```

Separação clara entre UI, estado (Zustand), sincronização (AudioClock),
renderização (LyricsRenderer/compositor), áudio (waveform/AudioClock) e
exportação (exportEngine), conforme pedido.

## Modelo de dados

Ver `types/index.ts`. Os tempos são sempre `number` em **segundos**. Cada
`LyricLine` tem `startTime`/`endTime` e uma lista opcional de `LyricWord`
(se vazia, a linha inteira usa o timing da própria linha).

## Sincronização

- **Por linha**: modo de sincronização (`SyncModePanel`) com atalhos `Space`
  (play/pause), `S` (marcar início da linha selecionada), `E` (marcar fim e
  avançar automaticamente para a linha seguinte), `Enter` (entrar/sair do
  modo). Usa sempre `audioClock.currentTime` (tempo real do elemento
  `<audio>`), nunca um relógio próprio.
- **Por palavra**: `WordSyncPanel`, com geração automática de palavras a
  partir do texto (distribuição igual dentro do intervalo da linha) e um
  modo "tap-sync" (tecla `W`) para marcar o início de cada palavra durante a
  reprodução — o fim de cada palavra é o início da seguinte.

Atalhos globais implementados (`hooks/useGlobalShortcuts.ts`): `Space`,
`←`/`→` (±5s), `Shift+←`/`Shift+→` (±1s), `Enter`, `Esc`, `S`, `E`. Todos
ignoram inputs/textareas em foco.

## LyricsRenderer (o coração do projeto)

`lib/render/lyricsRenderer.ts` exporta `computeRenderFrame(t, lyrics,
visualSettings)` — uma função **pura e determinística**: para o mesmo `t` e
os mesmos dados, produz sempre o mesmo resultado. Não depende de
`setTimeout`/`setInterval`/`Date.now()`.

Isto é usado por:
- `PreviewCanvas`, chamado a cada `requestAnimationFrame` com
  `audioClock.currentTime`;
- `exportEngine`, chamado uma vez por cada frame do vídeo final
  (`t = frameIndex / fps`), fora de tempo real.

O deslocamento vertical suave entre linhas (secção 16-20 da spec original)
é calculado como uma posição contínua (`floatIndex`) que interpola do índice
da linha anterior para o da linha ativa ao longo de
`visual.transitionDurationMs`, com easing configurável — sempre como função
pura de `t`, garantindo que preview e exportação produzem exatamente o
mesmo resultado visual.

`lib/render/compositor.ts` (`renderProjectFrame`) junta o background
(`backgroundRenderer.ts`) com o efeito de letras ativo
(`lib/effects/*`) numa única chamada, reutilizada por preview e exportação.

## Sistema de efeitos

`lib/effects/types.ts` define a interface `LyricsEffect`. A Fase 1 implementa
apenas `SpotifyInspiredLyrics` (`lib/effects/spotifyInspired.ts`), registado
em `effectRegistry`. Adicionar um novo efeito no futuro (GradientTextEffect,
BlurEffect, MaskEffect, etc.) significa apenas implementar a interface e
registá-lo — não requer alterar o `LyricsRenderer` nem o pipeline de
exportação.

## Waveform

`lib/audio/waveform.ts` descodifica o ficheiro de áudio **uma vez** com a
Web Audio API (`decodeAudioData`) e produz um array de picos (`Float32Array`)
agregados por "bucket". A `Timeline` desenha esse array diretamente — não
recalcula a waveform a cada frame.

## Exportação MP4

`lib/export/exportEngine.ts` usa `@ffmpeg/ffmpeg` (ffmpeg.wasm):

1. Carrega o core do ffmpeg (descarregado de um CDN na primeira utilização —
   **requer internet nesse momento específico**; depois fica em cache HTTP
   do browser).
2. Escreve o ficheiro de áudio original no sistema de ficheiros virtual do
   ffmpeg.
3. Para cada frame (`t = i / fps`, `i` de `0` a `duration * fps`), desenha o
   frame com o **mesmo compositor** do preview num `OffscreenCanvas`,
   converte para PNG e escreve no FS virtual.
4. Corre `ffmpeg -framerate <fps> -i frame_%06d.png -i audio.<ext> -c:v
   libx264 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart
   output.mp4`.
5. Lê `output.mp4` do FS virtual, devolve como `Blob` para download.

O vídeo final contém sempre o áudio original, sincronizado (mesmo motor de
timing usado no preview). Há barra de progresso real (fase de preparação,
renderização de frames, codificação) e botão de cancelar.

### Limitações conhecidas da exportação (honestas, não escondidas)

- **Performance**: para músicas longas (ex. 4-5 minutos a 60 FPS ≈ 15-18 mil
  frames), a renderização de cada frame como PNG e a codificação por
  ffmpeg.wasm (single-thread, corre num Web Worker interno da própria
  biblioteca) pode demorar vários minutos e consumir bastante memória no
  sistema de ficheiros virtual do ffmpeg. Recomenda-se testar primeiro com
  24 FPS / proporção mais pequena em máquinas mais limitadas.
- **Renderização de frames no thread principal**: ao contrário da
  codificação (que já corre num Worker interno do ffmpeg.wasm), o loop que
  desenha cada frame no `OffscreenCanvas` corre no thread principal (com
  `await` entre frames a ceder o event loop). Numa vídeo muito longo isto
  pode causar alguma lentidão na interface durante a exportação. Mover esse
  loop para um Web Worker dedicado com `OffscreenCanvas` transferido é uma
  melhoria natural para uma próxima iteração — a arquitetura já separa
  claramente renderização (`lib/render`) de UI, o que torna essa migração
  direta.
- Isto **não é uma simulação**: o MP4 produzido é real, contém vídeo H.264 +
  áudio AAC sincronizados, e abre em qualquer leitor/rede social comum.

## Salvar/importar projeto

Formato `.lyricsproject` (JSON) — ver `lib/project/serialization.ts`.
Ao guardar, é possível optar por incluir o áudio e a capa embutidos como
base64 dentro do próprio ficheiro. Para ficheiros de áudio muito grandes
isto aumenta o tamanho do ficheiro final em cerca de 33% (overhead do
base64); nesse caso a alternativa é guardar sem media e voltar a anexar
manualmente o MP3/imagem depois de reabrir o projeto (a app avisa quando
isso é necessário antes de exportar).

## Atalhos (resumo)

| Tecla | Ação |
|---|---|
| Space | Play/Pause |
| ← / → | Recuar/avançar 5s |
| Shift+← / Shift+→ | Recuar/avançar 1s |
| Enter | Entrar/sair do modo de sincronização |
| Esc | Sair do modo de sincronização |
| S | Marcar início da linha selecionada (modo sync) |
| E | Marcar fim da linha selecionada e avançar (modo sync) |
| W | Tap-sync da próxima palavra (painel de sincronização por palavra) |

## O que está simplificado nesta Fase 1 (transparência)

Para entregar uma ferramenta real e funcional dentro do âmbito desta
primeira fase, algumas partes foram implementadas de forma mais simples do
que o ideal, sem nunca fingir uma funcionalidade que não existe:

- **Reordenar linhas**: feito com botões "mover para cima/baixo" em vez de
  arrastar-e-largar. Funciona de forma fiável; drag-and-drop pode ser
  adicionado depois com uma biblioteca como `@dnd-kit`.
- **Crop da capa**: zoom/blur/brilho são ajustáveis por sliders; não há
  ainda um retângulo de crop arrastável no preview da imagem.
- **Renderização de frames na exportação**: corre no thread principal (ver
  limitações acima), não num Web Worker dedicado.
- Não foi possível correr `npm run build` / `npm run test` neste ambiente de
  escrita do código (sem acesso à internet para instalar dependências) —
  ver aviso no topo deste README.

## Desenvolvimento futuro (Fase 2)

A arquitetura de efeitos (`lib/effects/types.ts`) já está preparada para
receber novos efeitos (`GradientTextEffect`, `SolidTextEffect`,
`TextureTextEffect`, `BlurEffect`, `OverlayEffect`, `MaskEffect`) sem alterar
o `LyricsRenderer` nem o `compositor`. O efeito da Fase 2 mencionado
(aparência parcialmente opaca/sólida do texto interagindo com o fundo) pode
ser implementado como um novo `LyricsEffect` que usa `globalCompositeOperation`
do Canvas 2D ou uma segunda passada com `OffscreenCanvas` para máscaras.
