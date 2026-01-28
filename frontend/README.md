# Frontend - Angular

Aplikacja kliencka systemu rezerwacji wizyt lekarskich. Projekt wykorzystuje najnowsze standardy Angulara oraz rygorystyczne reguły statycznej analizy kodu.

## Wymagania środowiskowe

- **Node.js:** v20.19.0
- **Angular CLI:** 20.3.13
- **Menedżer pakietów:** npm

## Konfiguracja projektu (Zadania projektowe)

### 1. Nazewnictwo i Prefiksy

Każdy nowo generowany komponent automatycznie otrzymuje prefix **`mg-`**.

- Konfiguracja w `angular.json`: `"prefix": "mg"`
- Wymuszane przez ESLint: `@angular-eslint/component-selector`

### 2. Standardy kodu (ESLint)

Projekt posiada bardzo rygorystyczny linter. Wymagane jest:

- **Modyfikatory dostępu:** Każda metoda i właściwość musi mieć jawnie określony zasięg (`public`, `private` lub `protected`).
- **Typowanie zwrotne:** Każda funkcja/metoda musi mieć jawnie zdefiniowany typ zwracany (np. `void`, `string`, `Observable<User>`).
- **Zmienne:** Zakaz używania `var`. Wymuszone użycie `const` dla stałych referencyjnych.

### 3. Style i Design (SCSS)

- Wszystkie kolory muszą być zdefiniowane jako zmienne w `src/_variables.scss`.
- Import zmiennych w komponentach odbywa się poprzez: `@use 'variables' as *;` (dzięki konfiguracji `stylePreprocessorOptions` w `angular.json`).

## Dostępne komendy

| Komenda             | Opis                                                                                      |
| :------------------ | :---------------------------------------------------------------------------------------- |
| `npm install`       | Instaluje wszystkie zależności projektu.                                                  |
| `ng serve`          | Uruchamia serwer deweloperski na [http://localhost:4200](http://localhost:4200).          |
| `npm run lint`      | Sprawdza zgodność kodu z zasadami TypeScript i HTML (ESLint).                             |
| `npm run lintstyle` | Sprawdza poprawność plików SCSS (Stylelint).                                              |
| `ng build`          | Kompiluje aplikację do folderu `dist/` przy użyciu buildera `@angular/build:application`. |

## 📁 Struktura plików styli

- `src/styles.scss` - Główne style aplikacji.
- `src/_variables.scss` - Plik ze zmiennymi (kolory, typografia, odstępy).
