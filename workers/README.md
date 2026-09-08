# workers/

Pasta reservada para a arquitetura (secção 4/35 da spec original: "Web
Workers para tarefas pesadas quando necessário").

Nesta Fase 1, a codificação de vídeo já corre num Web Worker interno da
própria biblioteca `@ffmpeg/ffmpeg`. A renderização de cada frame (desenho
no `OffscreenCanvas`) ainda corre no thread principal — ver a secção
"Limitações conhecidas da exportação" no README principal.

Uma melhoria natural para uma próxima iteração é mover o loop de
`lib/export/exportEngine.ts` que desenha cada frame para um worker dedicado
aqui (ex.: `frameRenderWorker.ts`), transferindo um `OffscreenCanvas` para
esse worker e comunicando por `postMessage`. A separação já existente entre
`lib/render` (puro, sem dependências de DOM/React) e o resto da app torna
essa migração direta, sem alterar a lógica de renderização em si.
