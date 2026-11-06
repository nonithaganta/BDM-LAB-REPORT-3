# Quick API checks

Start the server with `npm install` and `npm start`, then run:

```bash
# Health check
curl http://localhost:3000/

# Create
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"The Alchemist","author":"Paulo Coelho","price":299}'

# Search, sort, filter and paginate
curl "http://localhost:3000/books?search_q=alchemist&order_by=price&order=DESC&min_price=100&max_price=500&limit=5&offset=0"

# Validation failure (400)
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"author":"Unknown Author","price":"abc"}'

# Missing record (404)
curl http://localhost:3000/books/999999
```
