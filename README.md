# Web-Vision-2.0
Buildathon
# DMRC local stack

Requirements: Docker with Compose.

    docker compose up --build

Then open http://localhost:8000

- Website: moving trains on the sample Yellow and Blue lines, and the journey planner.
- API documentation: http://localhost:8000/docs
- Dispatch log: `docker compose logs -f worker`

Sample data only (approximate coordinates, invented timings and fares). Authentication is a
development stub: any bearer token is accepted as a user, and a token starting with `staff-`
acts as staff at every station.

Try the safety flow:

    curl -X POST localhost:8000/v1/incidents -H "X-Device-Id: d1" -H "Idempotency-Key: demo-key-0001" \
      -H "Content-Type: application/json" -d '{"type":"HARASSMENT","coach":{"source":"MANUAL","coach_no":3},
      "location":{"lat":28.6328,"lng":77.2197,"accuracy_m":40},"client_ts":"'$(date -u +%FT%TZ)'"}'

Reset all data: `docker compose down -v`