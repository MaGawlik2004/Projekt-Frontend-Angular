# Backend - FastAPI Medical Reservation System

Serwis API odpowiedzialny za obsługę logiki biznesowej systemu rezerwacji wizyt, autoryzację oraz komunikację z bazą danych MongoDB.

## Technologie

- **Python 3.12.8**
- **FastAPI** (asynchroniczny framework webowy)
- **Motor** (asynchroniczny sterownik MongoDB)
- **Pydantic** (walidacja danych i schematy modeli)
- **Uvicorn** (serwer ASGI)

## Wymagania środowiskowe

- Python 3.11 lub nowszy
- Zainstalowana i uruchomiona baza MongoDB (lub kontener Docker z MongoDB)

## Zależności i Instalacja lokalna

Jeśli nie używasz Dockera, możesz uruchomić backend bezpośrednio na systemie:

1. **Stwórz i aktywuj środowisko wirtualne:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

   Serwer będzie dostępny pod adresem: http://localhost:8000

## Struktura katalogów

```bash
/backend
│-- app/
│   │-- main.py          # Punkt wejścia aplikacji i konfiguracja FastAPI
│   │-- database.py      # Konfiguracja połączenia z MongoDB (Motor)
│   │-- models/          # Modele Pydantic (schematy danych)
│   │-- routes/          # Definicje endpointów API
│   └-- crud/            # Operacje na bazie danych (Create, Read, Update, Delete)
│-- Dockerfile           # Instrukcja budowania obrazu kontenera
└-- requirements.txt     # Lista zależności Pythona
```

## Dokumentacja API

Po uruchomieniu aplikacji, pełna interaktywna dokumentacja (Swagger UI) jest dostępna pod adresem: http://localhost:8000/docs

Można tam testować endpointy bez konieczności używania zewnętrznych narzędzi typu Postman.
