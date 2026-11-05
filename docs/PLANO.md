# Moonlight Vega OS — roteiro de desenvolvimento

## Estado inicial
- Repositório criado, Vega CLI instalado no Codespaces.
- MoonlightWeb testado com sucesso no navegador do computador.
- **Ainda não** foi comprovado que WebRTC/WebCodecs funcionam no WebView do Fire TV.

## Etapa 1 — Aplicativo instalável
1. Rodar `bash scripts/bootstrap.sh` no Codespaces (na raiz).
2. Configurar `STREAM_URL` em `app/src/App.tsx`.
3. `cd app && npm install && npx react-native build-vega`.
4. Transferir o arquivo `.vpkg` ao PC na mesma rede do Fire TV.
5. Ativar modo de desenvolvedor e instalar usando Vega Device Adapter (VDA).

## Etapa 2 — Testes indispensáveis no Fire TV real
- Abrir a interface MoonlightWeb em WebView.
- Confirmar HTTPs confiável, sinalização WSS e sessão WebRTC.
- Inspecionar logs `[Moonlight Vega]` com capacidade de WebRTC e WebCodecs.
- Testar H.264 1920×1080 a 60 fps, sem prometer suporte até confirmar hardware/API.
- Medir atraso, perda de quadros, estabilidade e áudio.
- Conferir setas, OK (Enter), Voltar (keyCode 27) e mídia.

## Etapa 3 — Controle do PC
- Diferenciar navegação nos menus e entrada enviada ao PC durante streaming.
- Usar eventos de teclado do WebView para navegação local.
- Adaptar o frontend MoonlightWeb/ponte de input apenas após verificar onde o
  backend recebe eventos (não assumir que eventos sintéticos simulam cliques reais).
- Avaliar modo cursor: setas movimentam ponteiro, OK = clique esquerdo,
  botão alternativo = clique direito, Voltar = retorna ao menu.
- Definir regras para teclas Home, volume e Power (normalmente reservadas ao sistema).

## Limitações e segurança
- A primeira versão é um app Vega usando WebView, não um decodificador
  Moonlight inteiramente reimplementado em código nativo.
- Codec H.264 é o ponto de partida para SDR; 1080p60 depende de testes do Fire TV.
- WebCodecs e WebRTC no runtime real são um risco técnico a validar.
- Preferir HTTPS com certificado válido; evitar ignorar alertas TLS.
- Codespaces constrói o pacote, mas sem roteamento de rede não consegue
  acessar diretamente um Fire TV na LAN do usuário.
