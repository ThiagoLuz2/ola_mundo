# Ionic + Vue + Capacitor + Supabase

Aplicação híbrida demonstrativa para Android e web. A interface é construída com Ionic Framework e Vue 3, o Vue Router controla as telas e rotas protegidas, o Capacitor empacota o build web como aplicativo Android e o Supabase oferece autenticação, banco PostgreSQL e armazenamento de arquivos.

## Arquitetura e ferramentas

- **Ionic Framework** fornece componentes adaptáveis para celular e navegação visual consistente.
- **Vue 3** organiza a interface em componentes `.vue`; Composition API e TypeScript mantêm estado e operações assíncronas junto das telas.
- **Vue Router** encaminha login e perfil, e impede o acesso ao perfil sem sessão válida.
- **Capacitor** reúne os arquivos compilados pelo Vite (`dist/`) no projeto Android nativo. O Android Studio abre a pasta `android/`, compila com Gradle e executa no emulador ou dispositivo.
- **Supabase JS** acessa Auth, Postgres e Storage pela rede. A chave publicável/anon pode estar no cliente; a segurança dos dados é garantida pelas políticas RLS, nunca por uma chave `service_role`.

## Integração Supabase

1. Crie um projeto no Supabase e copie a Project URL e a chave publishable (ou anon) de **Project Settings → API**.
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Execute [`supabase/schema.sql`](./supabase/schema.sql) no **SQL Editor**. Ele cria a tabela `profiles`, habilita Row Level Security e configura o bucket público `avatars` com limite de 5 MB e política de upload na pasta correspondente ao usuário autenticado.
4. Em **Authentication → URL Configuration**, adicione a URL local `http://localhost:5173/**` à lista de redirect URLs e também o URI `io.ionic.starter://auth/callback`. Configure a confirmação de e-mail de acordo com a política do projeto.

Auth oferece cadastro, login por e-mail/senha e solicitação de recuperação. O link abre a tela para definir uma nova senha; no Android, o deep link configurado na Activity devolve o código PKCE ao app. O perfil grava nome, data de nascimento, nickname e URL da foto. Imagens permitidas: JPEG, PNG e WebP. Como o bucket de avatares é público, qualquer pessoa com o URL da imagem pode visualizá-la; usuários autenticados só podem enviar arquivos para sua própria pasta.

## Rodar no navegador

Execute os comandos na pasta que contém este `package.json`:

```sh
npm install
npm run dev
```

## Rodar no Android Studio

Pré-requisitos: Android Studio, Android SDK, JDK compatível com o Gradle do projeto e um emulador ou dispositivo com depuração USB.

```sh
npm install
npm run cap:sync
npm run android:open
```

`cap:sync` executa primeiro `npm run build` e depois atualiza os assets e plugins Android, evitando o erro de diretório web `www` inexistente. O app usa `webDir: 'dist'` no [`capacitor.config.ts`](./capacitor.config.ts); rode os comandos dentro desta pasta do projeto, não na pasta pai. No Android Studio, aguarde a sincronização do Gradle e escolha **Run** com um emulador/dispositivo.

Para atualizar o app nativo após mudanças no Vue, rode `npm run cap:sync` novamente. Para obter um APK de depuração sem abrir a interface do Studio, use `android\gradlew.bat assembleDebug` dentro da pasta `android`.
