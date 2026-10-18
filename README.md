# app-undercontroll

App mobile (Expo SDK 57 + Expo Router) da Pelluci. Gerenciador de pacotes: **bun**.

```sh
bun install
bun start
bun run lint
bun run test
```

## Rodando no Expo Go com backend local

Fluxo para abrir o app no **Expo Go** em um celular físico consumindo o `core-api` rodando no Mac (`localhost:8080`).

### Pré-requisitos

- Expo Go do SDK 57 instalado no celular (App Store / Play Store).
- Celular e Mac **na mesma rede Wi‑Fi** (sem isolamento de clientes / rede de convidados).

### 1. Suba o backend

No repositório `core-api`, com Postgres, Redis e RabbitMQ disponíveis (ex.: `docker compose up -d postgres redis rabbitmq`):

```sh
SPRING_PROFILES_ACTIVE=dev DEV_SEED_PASSWORD=123 ./mvnw spring-boot:run
```

O Spring escuta em `0.0.0.0:8080`, então ele já fica acessível pelo IP do Mac na rede local.

### 2. Suba o app e escaneie o QR code

```sh
bun start
```

- iOS: escaneie o QR code com a câmera e abra no Expo Go. Na primeira vez, permita o acesso à **Rede Local** quando o Expo Go pedir.
- Android: escaneie o QR code pelo próprio Expo Go.

### Como o app encontra a API

`providers/apiHost.js` resolve a URL base nesta ordem:

1. `EXPO_PUBLIC_API_URL`, se definida.
2. O host do servidor de desenvolvimento do Expo (`Constants.expoConfig.hostUri`, ex.: `192.168.0.10:8081`) sem a porta, montando `http://192.168.0.10:${EXPO_PUBLIC_API_PORT:-8080}/v1/api`. Como o Metro roda no Mac, esse é o IP do Mac na rede local.
3. Fallback para emulador/simulador: `10.0.2.2` no Android e `localhost` no iOS.

Se a detecção automática não funcionar (ex.: VPN ou várias interfaces de rede), defina a URL manualmente:

```sh
ipconfig getifaddr en0
EXPO_PUBLIC_API_URL=http://<ip-do-mac>:8080/v1/api bun start
```

Variáveis `EXPO_PUBLIC_*` são embutidas no bundle; reinicie o `bun start` (de preferência com `--clear`) depois de alterá-las.

### Firewall do macOS

Na primeira vez que o Java/Metro aceitar conexões externas, o macOS pode perguntar se deseja permitir conexões de entrada. Clique em **Permitir**. Se o firewall estiver bloqueando, libere `java` e `node`/`bun` em Ajustes do Sistema → Rede → Firewall → Opções.

Teste pelo navegador do celular: `http://<ip-do-mac>:8080/v1/api` deve responder (mesmo que com 401/404), o que confirma que a rede e o firewall estão ok.

### HTTP sem TLS

Em desenvolvimento o Expo Go aceita `http://` para IPs da rede local: no iOS o Expo Go é distribuído com `NSAllowsArbitraryLoads` e no Android com `usesCleartextTraffic="true"`. Em builds próprias (development build / release) isso **não** vale automaticamente; use HTTPS ou configure ATS/cleartext explicitamente.

### `--tunnel`

`bun start --tunnel` expõe apenas o **Metro** (o bundle JS) por um túnel público; a API em `localhost:8080` continua inacessível pelo celular. Com túnel, a detecção automática é ignorada e o app cai no fallback `localhost`, então é preciso expor a API por conta própria (ex.: ngrok/cloudflared apontando para a porta 8080) e passar `EXPO_PUBLIC_API_URL=https://<url-publica>/v1/api`.

### Limitações do Expo Go

Todas as dependências nativas do projeto estão incluídas no Expo Go do SDK 57. A splash screen configurada não aparece no Expo Go (ele mostra o ícone do app); valide-a em uma build de release.
