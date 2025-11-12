# AI Agent System Designer

Aplikacja do wizualnego projektowania i generowania konfiguracji dla systemów agentowych AI przy użyciu Vertex AI Agent Builder, zasilana przez Gemini.

## Wdrożenie na Firebase Hosting

Aby wdrożyć tę aplikację na Firebase Hosting, wykonaj następujące kroki:

### 1. Wymagania wstępne

- Zainstalowane [Node.js](https://nodejs.org/) i npm.
- Konto Google i utworzony projekt Firebase.

### 2. Instalacja Firebase CLI

Jeśli nie masz zainstalowanych narzędzi Firebase CLI, zainstaluj je globalnie za pomocą npm:

```bash
npm install -g firebase-tools
```

### 3. Logowanie do Firebase

Zaloguj się na swoje konto Google za pomocą CLI:

```bash
firebase login
```

### 4. Konfiguracja projektu

1.  Otwórz plik `.firebaserc`.
2.  Zastąp `TWOJ-ID-PROJEKTU-FIREBASE` rzeczywistym ID Twojego projektu Firebase.

    ```json
    {
      "projects": {
        "default": "my-ai-agent-designer-project"
      }
    }
    ```

### 5. Wdrożenie

Po skonfigurowaniu projektu, wdróż aplikację na Firebase Hosting za pomocą polecenia:

```bash
firebase deploy --only hosting
```

Po zakończeniu wdrożenia, CLI wyświetli adres URL, pod którym Twoja aplikacja jest dostępna publicznie.

### Ważna uwaga dotycząca klucza API

Aplikacja została zaprojektowana tak, aby pobierać klucz Google AI API ze zmiennej środowiskowej `process.env.API_KEY`. Standardowe wdrożenie na Firebase Hosting **nie** obsługuje wstrzykiwania zmiennych środowiskowych do statycznych plików JavaScript w ten sposób.

Aby aplikacja działała poprawnie, musisz upewnić się, że środowisko, w którym ją uruchamiasz (np. niestandardowy serwer, platforma CI/CD z krokiem pre-build), zastępuje `process.env.API_KEY` w plikach `.ts`/`.tsx` rzeczywistym kluczem API przed wdrożeniem. Alternatywnie, możesz użyć Firebase Cloud Functions do dynamicznego serwowania plików z wstrzykniętym kluczem.
