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

## Struktura plików styli

## 📁 Struktura Projektu

Projekt podąża za architekturą modularną z podziałem na domeny biznesowe:

```text
src/
├── _variables.scss          # Globalne zmienne SCSS (kolory, breakpointy)
├── styles.scss              # Globalne style aplikacji
├── app/
│   ├── components/          # Komponenty interfejsu użytkownika
│   │   ├── admin/           # Panel administratora i detale lekarzy
│   │   ├── auth/            # Ekrany logowania i rejestracji
│   │   ├── confirm-modal/   # Uniwersalne okno dialogowe do potwierdzania akcji (np. usuwanie)
│   │   ├── doctor/          # Panel lekarza, grafik i zarządzanie wizytami
│   │   ├── shared/          # Współdzielone elementy (kalendarz, formularze pomocnicze)
│   │   ├── toast-container/ # Host dla dynamicznie wyświetlanych powiadomień systemowych
│   │   └── user/            # Rezerwacje, wyszukiwarka lekarzy i panel pacjenta
│   ├── services/            # Logika biznesowa i komunikacja z API
│   │   ├── admin/           # Zarządzanie zasobami systemowymi
│   │   ├── auth/            # Obsługa sesji, tokenów JWT i logowania
│   │   ├── doctor/          # Serwis obsługujący grafik i dane medyczne
│   │   ├── language/        # Internacjonalizacja i zmiana języka aplikacji
│   │   ├── patient/         # Obsługa profilu pacjenta i procesu rezerwacji
│   │   └── toast/           # Zarządzanie stanem i kolejką powiadomień (Toast Service)
│   ├── models/              # Definicje typów, interfejsów i klas danych
│   ├── guards/              # Strażnicy tras (zabezpieczanie dostępu przed nieautoryzowanym wejściem)
│   ├── validators/          # Niestandardowa walidacja formularzy (np. walidacja domen)
│   └── not-found/           # Obsługa błędu 404 i strony Page Not Found
└── main.ts                  # Główny punkt wejścia aplikacji
