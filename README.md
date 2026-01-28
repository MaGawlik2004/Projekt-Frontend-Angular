# System Rezerwacji Wizyt Lekarskich

Zintegrowany system webowy do zarządzania rezerwacjami wizyt medycznych, zbudowany w nowoczesnej architekturze opartej na mikroserwisach i kontenerach.

## Architektura Projektu

Projekt składa się z trzech głównych warstw:

- **Frontend**: Aplikacja SPA zbudowana w Angularze 20+.
- **Backend**: Asynchroniczne API zbudowane w FastAPI (Python).
- **Database**: Baza danych NoSQL MongoDB.

Całość jest zarządzana przez **Docker Compose**, co zapewnia spójność środowiska u każdego dewelopera.

## Technologie

| Warstwa          | Technologia                                      |
| :--------------- | :----------------------------------------------- |
| **Frontend**     | Angular, SCSS, ESLint, Stylelint                 |
| **Backend**      | Python, FastAPI, Motor (Async MongoDB), Pydantic |
| **Baza Danych**  | MongoDB                                          |
| **Orkiestracja** | Docker, Docker Compose                           |

## Szybki start (Docker)

Najprostszym sposobem na uruchomienie całego systemu jest użycie Dockera. Nie musisz instalować lokalnie Pythona, Node.js ani MongoDB.

1. **Uruchomienie systemu:**
   W katalogu głównym projektu wykonaj:

   ```bash
   docker-compose up --build
   ```

2. **Dostęp do usług**
   - Aplikacja Frontend: http://localhost:4200
   - Backend API: http://localhost:8000
   - Dokumentacja API (Swagger): http://localhost:8000/docs
   - Baza Danych MongoDB: localhost:27017

## Struktura repozytorium

```bash
/project
├── /frontend          # Aplikacja Angularowa (Logic & UI)
│   ├── src/           # Kod źródłowy frontendu
│   ├── Dockerfile     # Konfiguracja obrazu frontendu
│   └── README.md      # Szczegóły konfiguracji lintera i styli
├── /backend           # API Python/FastAPI
│   ├── app/           # Główna logika backendu
│   ├── Dockerfile     # Konfiguracja obrazu backendu
│   └── README.md      # Szczegóły zależności i modeli
├── docker-compose.yml # Definicja wszystkich usług systemu
└── .gitignore         # Wykluczenia z kontroli wersji
```

## Autor

Mateusz Gawlik
