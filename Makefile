.PHONY: up down logs ps clean

# ---- Local infrastructure ----
up:
	docker compose -f infra/docker/docker-compose.yml --env-file .env up -d

down:
	docker compose -f infra/docker/docker-compose.yml --env-file .env down

logs:
	docker compose -f infra/docker/docker-compose.yml --env-file .env logs -f --tail=200

ps:
	docker compose -f infra/docker/docker-compose.yml --env-file .env ps

clean:
	docker compose -f infra/docker/docker-compose.yml --env-file .env down -v
	@echo "Volumes removed. Run 'make up' to start fresh."
